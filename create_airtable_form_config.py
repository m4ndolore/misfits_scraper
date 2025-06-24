#!/usr/bin/env python3
"""Generate Airtable form configuration from questionnaire CSVs"""

import csv
import json
from pathlib import Path

def load_csv(filename):
    """Load CSV file and return as list of dictionaries"""
    with open(f'data/airtable_import/{filename}', 'r') as f:
        return list(csv.DictReader(f))

def generate_form_config():
    """Generate complete form configuration for Airtable"""
    
    # Load all data
    sections = load_csv('sections.csv')
    questions = load_csv('questions_master.csv')
    options = load_csv('question_options.csv')
    
    # Group options by question
    options_by_question = {}
    for opt in options:
        qid = opt['question_id']
        if qid not in options_by_question:
            options_by_question[qid] = []
        options_by_question[qid].append(opt)
    
    # Build form configuration
    form_config = {
        'form_name': 'iME Business Profile Questionnaire',
        'form_description': 'Help us match you with the best defense contracting opportunities',
        'sections': []
    }
    
    # Process each section
    for section in sections:
        section_config = {
            'section_id': section['section_id'],
            'section_title': section['section_title'],
            'section_description': section['section_description'],
            'fields': []
        }
        
        # Get questions for this section
        section_questions = [q for q in questions if q['section_id'] == section['section_id']]
        section_questions.sort(key=lambda x: int(x['display_order']))
        
        for question in section_questions:
            field_config = {
                'field_name': question['question_id'],
                'field_label': question['question_text'],
                'field_description': question['question_hint'] or '',
                'field_type': map_field_type(question['question_type']),
                'is_required': question['is_required'] == 'TRUE',
                'validation': {}
            }
            
            # Add max selections if specified
            if question['max_selections']:
                field_config['validation']['max_selections'] = int(question['max_selections'])
            
            # Add options for select fields
            if question['question_type'] in ['single_select', 'multi_select']:
                field_options = options_by_question.get(question['question_id'], [])
                field_options.sort(key=lambda x: int(x['display_order']))
                
                field_config['options'] = [
                    {
                        'value': opt['option_value'],
                        'label': opt['option_label']
                    }
                    for opt in field_options
                ]
            
            section_config['fields'].append(field_config)
        
        form_config['sections'].append(section_config)
    
    return form_config

def map_field_type(question_type):
    """Map question types to Airtable field types"""
    mapping = {
        'single_select': 'single_select',
        'multi_select': 'multiple_select',
        'text_input': 'long_text'
    }
    return mapping.get(question_type, 'single_line_text')

def generate_airtable_script(config):
    """Generate Airtable automation script"""
    script = """
// Airtable Form Configuration Script
// Copy this into your Airtable scripting block

const formConfig = """ + json.dumps(config, indent=2) + """;

// Create form fields based on configuration
console.log('Form Configuration Generated:');
console.log('============================');

formConfig.sections.forEach(section => {
    console.log(`\\n## ${section.section_title}`);
    console.log(`Description: ${section.section_description}`);
    
    section.fields.forEach((field, index) => {
        console.log(`\\n${index + 1}. ${field.field_label}`);
        console.log(`   Field Name: ${field.field_name}`);
        console.log(`   Type: ${field.field_type}`);
        console.log(`   Required: ${field.is_required ? 'Yes' : 'No'}`);
        
        if (field.field_description) {
            console.log(`   Helper Text: "${field.field_description}"`);
        }
        
        if (field.validation.max_selections) {
            console.log(`   Max Selections: ${field.validation.max_selections}`);
        }
        
        if (field.options) {
            console.log(`   Options: ${field.options.length} choices`);
        }
    });
});

// Instructions for manual setup
console.log('\\n\\nMANUAL SETUP INSTRUCTIONS:');
console.log('==========================');
console.log('1. Create a new table called "Form Responses"');
console.log('2. Add these fields in order:');
console.log('   - Response ID (Autonumber)');
console.log('   - Company Name (Single line text) [Required]');
console.log('   - Email (Email) [Required]');
console.log('   - Submission Date (Created time)');
console.log('');
console.log('3. For each field above, add it with these settings:');
console.log('   - Use the Field Name as the actual field name');
console.log('   - Set the field type as specified');
console.log('   - Add the Helper Text to the field description');
console.log('   - Mark as Required if specified');
console.log('   - For Multiple Select fields with Max Selections, note this for form logic');
console.log('');
console.log('4. Create a Form view and configure conditional logic as needed');
"""
    
    return script

def generate_typeform_config(config):
    """Generate configuration for Typeform integration"""
    typeform_config = {
        'title': config['form_name'],
        'welcome_screen': {
            'title': 'Welcome to iME Business Profile Setup',
            'description': config['form_description']
        },
        'questions': []
    }
    
    question_number = 0
    for section in config['sections']:
        # Add section intro
        typeform_config['questions'].append({
            'type': 'statement',
            'title': section['section_title'],
            'description': section['section_description']
        })
        
        # Add questions
        for field in section['fields']:
            question_number += 1
            tf_question = {
                'ref': field['field_name'],
                'title': field['field_label'],
                'description': field['field_description'],
                'required': field['is_required'],
                'type': map_to_typeform_type(field['field_type'])
            }
            
            if field.get('options'):
                tf_question['choices'] = [
                    {'label': opt['label'], 'ref': opt['value']}
                    for opt in field['options']
                ]
            
            if field.get('validation', {}).get('max_selections'):
                tf_question['max_selections'] = field['validation']['max_selections']
            
            typeform_config['questions'].append(tf_question)
    
    return typeform_config

def map_to_typeform_type(airtable_type):
    """Map Airtable types to Typeform types"""
    mapping = {
        'single_select': 'multiple_choice',
        'multiple_select': 'multiple_choice',  # with allow_multiple
        'long_text': 'long_text'
    }
    return mapping.get(airtable_type, 'short_text')

def main():
    """Generate all form configurations"""
    print("Generating Airtable form configuration...")
    
    # Generate main configuration
    config = generate_form_config()
    
    # Save as JSON
    with open('data/airtable_form_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    print("✓ Saved form configuration to data/airtable_form_config.json")
    
    # Generate Airtable script
    script = generate_airtable_script(config)
    with open('data/airtable_form_script.js', 'w') as f:
        f.write(script)
    print("✓ Generated Airtable script at data/airtable_form_script.js")
    
    # Generate Typeform config (if using external forms)
    tf_config = generate_typeform_config(config)
    with open('data/typeform_config.json', 'w') as f:
        json.dump(tf_config, f, indent=2)
    print("✓ Generated Typeform config at data/typeform_config.json")
    
    # Print summary
    print(f"\nForm Summary:")
    print(f"- Sections: {len(config['sections'])}")
    print(f"- Total Questions: {sum(len(s['fields']) for s in config['sections'])}")
    print(f"- Required Questions: {sum(1 for s in config['sections'] for f in s['fields'] if f['is_required'])}")
    
    print("\nNext Steps:")
    print("1. Open data/airtable_form_script.js")
    print("2. Follow the manual setup instructions")
    print("3. Or use data/typeform_config.json with Typeform API")

if __name__ == "__main__":
    main()