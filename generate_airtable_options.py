#!/usr/bin/env python3
"""Generate copy-paste ready field options for Airtable form setup"""

import json
import csv

def load_options():
    """Load all options from the questionnaire CSV files"""
    options_by_field = {}
    
    # Load question options
    with open('data/airtable_import/question_options.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            field_name = row['question_id']
            if field_name not in options_by_field:
                options_by_field[field_name] = []
            options_by_field[field_name].append(row['option_label'])
    
    return options_by_field

def generate_options_text():
    """Generate formatted text for easy copy-paste into Airtable"""
    options = load_options()
    
    output = """# Airtable Field Options - Copy & Paste Ready

## Instructions:
1. Click on each field in Airtable
2. Click "Customize field type"
3. Copy and paste the options below
4. Airtable will automatically create each option when you paste

---

"""
    
    # Field descriptions
    field_info = {
        'primary_tech_areas': {
            'name': 'Primary Technical Areas',
            'type': 'Multiple select',
            'description': 'Select up to 5 core competencies',
            'max_selections': 5
        },
        'secondary_tech_areas': {
            'name': 'Secondary Technical Areas',
            'type': 'Multiple select',
            'description': 'Additional areas where you have some expertise'
        },
        'agencies_worked_with': {
            'name': 'Agencies Worked With',
            'type': 'Multiple select',
            'description': 'Select all that apply'
        },
        'contract_types': {
            'name': 'Contract Types',
            'type': 'Multiple select',
            'description': 'Select all that apply'
        },
        'preferred_contract_size': {
            'name': 'Preferred Contract Size',
            'type': 'Single select'
        },
        'risk_tolerance': {
            'name': 'Risk Tolerance',
            'type': 'Single select'
        },
        'timeline_preference': {
            'name': 'Timeline Preference',
            'type': 'Single select'
        },
        'clearance_level': {
            'name': 'Clearance Level',
            'type': 'Single select'
        },
        'facility_clearance': {
            'name': 'Facility Clearance',
            'type': 'Single select'
        },
        'certifications': {
            'name': 'Certifications',
            'type': 'Multiple select',
            'description': 'Select all that apply'
        },
        'innovation_areas': {
            'name': 'Innovation Areas',
            'type': 'Multiple select',
            'description': 'Select up to 3',
            'max_selections': 3
        }
    }
    
    # Generate formatted options for each field
    for field_id, field_data in field_info.items():
        output += f"## {field_data['name']}\n"
        output += f"**Field type:** {field_data['type']}\n"
        
        if field_data.get('description'):
            output += f"**Description:** {field_data['description']}\n"
        
        if field_data.get('max_selections'):
            output += f"**Max selections:** {field_data['max_selections']}\n"
        
        output += "\n**Options (copy all lines below):**\n```\n"
        
        if field_id in options:
            for option in options[field_id]:
                output += f"{option}\n"
        
        output += "```\n\n---\n\n"
    
    # Add field that doesn't have predefined options
    output += """## Competitive Advantages
**Field type:** Long text
**Description:** Brief description (optional)
**Required:** No

(No options needed - this is a text field)

---

## Quick Setup Script

If you have access to Airtable's scripting app, you can use this script to add all options at once:

```javascript
// Airtable Scripting App - Add All Options
const table = base.getTable('Form Responses');

// Define all options
const fieldOptions = {
"""
    
    # Generate JavaScript object with all options
    for field_id, opts in options.items():
        if field_id in field_info:
            output += f"    '{field_id}': [\n"
            for opt in opts:
                output += f"        '{opt}',\n"
            output += "    ],\n"
    
    output += """};

// Update each field with its options
for (const [fieldName, options] of Object.entries(fieldOptions)) {
    try {
        const field = table.getField(fieldName);
        if (field.type === 'multipleSelects' || field.type === 'singleSelect') {
            await field.updateOptionsAsync({
                choices: options.map(name => ({name}))
            });
            console.log(`✓ Updated ${fieldName} with ${options.length} options`);
        }
    } catch (e) {
        console.error(`✗ Failed to update ${fieldName}:`, e.message);
    }
}

console.log('\\nDone! All field options have been added.');
```
"""
    
    return output

def generate_validation_rules():
    """Generate validation rules summary"""
    return """
# Validation Rules for Airtable Form

## Required Fields (12 total):
1. Company Name
2. Email
3. primary_tech_areas
4. secondary_tech_areas
5. agencies_worked_with
6. contract_types
7. preferred_contract_size
8. risk_tolerance
9. timeline_preference
10. clearance_level
11. facility_clearance
12. certifications

## Optional Fields (2 total):
1. innovation_areas
2. competitive_advantages

## Fields with Selection Limits:
- **primary_tech_areas**: Maximum 5 selections
- **innovation_areas**: Maximum 3 selections

## Special Validation:
- **Email**: Must be valid email format
- **Company Name**: Should not be empty

Note: Airtable doesn't enforce max selections natively. You'll need to:
1. Add a note in the field description
2. Use form logic or automation to validate
3. Or use a custom form solution that enforces these limits
"""

def main():
    """Generate all helper files"""
    # Generate options text
    options_text = generate_options_text()
    with open('data/airtable_import/FIELD_OPTIONS.md', 'w') as f:
        f.write(options_text)
    print("✓ Generated: data/airtable_import/FIELD_OPTIONS.md")
    
    # Generate validation rules
    validation_text = generate_validation_rules()
    with open('data/airtable_import/VALIDATION_RULES.md', 'w') as f:
        f.write(validation_text)
    print("✓ Generated: data/airtable_import/VALIDATION_RULES.md")
    
    # Summary
    print("\nFiles created:")
    print("1. form_responses_template.csv - Import this to create your table")
    print("2. FORM_IMPORT_INSTRUCTIONS.md - Step-by-step setup guide")
    print("3. FIELD_OPTIONS.md - All options ready to copy-paste")
    print("4. VALIDATION_RULES.md - Required fields and limits")

if __name__ == "__main__":
    main()