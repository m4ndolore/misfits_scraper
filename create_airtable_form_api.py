#!/usr/bin/env python3
"""
Create Airtable Form using API
This script creates a complete form setup in Airtable for the iME questionnaire
"""

import os
import json
import requests
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

class AirtableFormCreator:
    def __init__(self):
        self.api_key = os.getenv('AIRTABLE_API_KEY')
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # Load form configuration
        with open('data/airtable_form_config.json', 'r') as f:
            self.form_config = json.load(f)
    
    def create_form_table(self) -> str:
        """Create a new table with all form fields"""
        print('Creating Form Responses table...')
        
        # Build field definitions
        fields = [
            {
                'name': 'Response ID',
                'type': 'autoNumber'
            },
            {
                'name': 'Company Name',
                'type': 'singleLineText'
            },
            {
                'name': 'Email',
                'type': 'email'
            },
            {
                'name': 'Submission Date',
                'type': 'dateTime',
                'options': {
                    'timeZone': 'America/New_York',
                    'dateFormat': {'name': 'us'}
                }
            }
        ]
        
        # Add all questionnaire fields
        for section in self.form_config['sections']:
            for field in section['fields']:
                field_def = self.create_field_definition(field)
                fields.append(field_def)
        
        # Create table via API
        url = f'https://api.airtable.com/v0/meta/bases/{self.base_id}/tables'
        
        response = requests.post(url, headers=self.headers, json={
            'name': 'Form Responses',
            'fields': fields
        })
        
        if response.status_code == 200:
            result = response.json()
            print('✓ Table created successfully')
            return result['id']
        else:
            print(f'✗ Failed to create table: {response.text}')
            raise Exception(f'API Error: {response.status_code}')
    
    def create_field_definition(self, field: Dict) -> Dict:
        """Convert field configuration to Airtable field definition"""
        field_def = {
            'name': field['field_name'],
            'description': field.get('field_description', '')
        }
        
        if field['field_type'] == 'single_select':
            field_def['type'] = 'singleSelect'
            field_def['options'] = {
                'choices': [
                    {'name': opt['label']} 
                    for opt in field.get('options', [])
                ]
            }
        elif field['field_type'] == 'multiple_select':
            field_def['type'] = 'multipleSelects'
            field_def['options'] = {
                'choices': [
                    {'name': opt['label']} 
                    for opt in field.get('options', [])
                ]
            }
        elif field['field_type'] == 'long_text':
            field_def['type'] = 'multilineText'
        else:
            field_def['type'] = 'singleLineText'
        
        return field_def
    
    def generate_manual_script(self):
        """Generate a manual setup script for Airtable"""
        print("\n=== Manual Setup Script ===")
        print("Copy and paste this into Airtable's Scripting app:\n")
        
        script = """// Airtable Manual Form Setup Script
// This script helps you configure your form manually

// 1. First, create these fields in your table:
const requiredFields = [
    'Company Name (Single line text) - Required',
    'Email (Email) - Required',
"""
        
        # Add all fields
        for section in self.form_config['sections']:
            script += f"\n    // {section['section_title']}\n"
            for field in section['fields']:
                field_type = field['field_type'].replace('_', ' ').title()
                required = "Required" if field['is_required'] else "Optional"
                script += f"    '{field['field_name']} ({field_type}) - {required}',\n"
        
        script += """];

// 2. Configure form view settings:
const formSettings = {
    title: 'iME Business Profile Questionnaire',
    description: 'Help us match you with the best defense contracting opportunities',
    submitButtonText: 'Submit Profile',
    redirectUrl: '', // Add your thank you page URL
    coverImage: '', // Add your branding image URL
};

// 3. Field-specific settings:
"""
        
        # Add field configurations
        for section in self.form_config['sections']:
            script += f"\n// {section['section_title']}\n"
            for field in section['fields']:
                script += f"// {field['field_name']}:\n"
                if field.get('field_description'):
                    script += f"//   - Description: {field['field_description']}\n"
                if field.get('validation', {}).get('max_selections'):
                    script += f"//   - Max selections: {field['validation']['max_selections']}\n"
                if field.get('options'):
                    script += f"//   - Options: {len(field['options'])} choices\n"
                script += "\n"
        
        script += """
// 4. After creating all fields:
//    a) Go to Forms view
//    b) Add all fields in the order shown above
//    c) Mark required fields
//    d) Add field descriptions
//    e) Configure conditional logic if needed

output.text('Setup instructions generated! Follow the steps above.');
"""
        
        print(script)
        
        # Save to file
        with open('data/airtable_manual_setup.js', 'w') as f:
            f.write(script)
        print("\nScript saved to: data/airtable_manual_setup.js")
    
    def generate_field_summary(self):
        """Generate a summary of all fields for easy reference"""
        print("\n=== Field Summary ===")
        
        total_fields = 4  # Base fields
        required_fields = 2  # Company Name, Email
        
        for section in self.form_config['sections']:
            print(f"\n{section['section_title']}:")
            for field in section['fields']:
                total_fields += 1
                if field['is_required']:
                    required_fields += 1
                
                field_type = field['field_type'].replace('_', ' ')
                req = "Required" if field['is_required'] else "Optional"
                print(f"  - {field['field_name']} ({field_type}) [{req}]")
                
                if field.get('field_description'):
                    print(f"    Helper: {field['field_description']}")
                if field.get('options'):
                    print(f"    Options: {len(field['options'])} choices")
                if field.get('validation', {}).get('max_selections'):
                    print(f"    Max selections: {field['validation']['max_selections']}")
        
        print(f"\nTotal fields: {total_fields}")
        print(f"Required fields: {required_fields}")
        print(f"Optional fields: {total_fields - required_fields}")

def main():
    """Main execution"""
    creator = AirtableFormCreator()
    
    print("=== Airtable Form Creator ===\n")
    
    # Check for API credentials
    if not creator.api_key or not creator.base_id:
        print("✗ Missing Airtable credentials!")
        print("\nTo use the API method, add to your .env file:")
        print("AIRTABLE_API_KEY=your_api_key")
        print("AIRTABLE_BASE_ID=your_base_id")
        print("\nGenerating manual setup script instead...")
        
        creator.generate_manual_script()
        creator.generate_field_summary()
        
        print("\n=== Next Steps ===")
        print("1. Open your Airtable base")
        print("2. Create a new table called 'Form Responses'")
        print("3. Add all fields listed in the script")
        print("4. Create a Form view")
        print("5. Configure form settings and field order")
        return
    
    # Try to create via API
    try:
        table_id = creator.create_form_table()
        
        print(f"\n✓ Success! Table created with ID: {table_id}")
        print("\n=== Next Steps ===")
        print("1. Open your Airtable base")
        print("2. Find the 'Form Responses' table")
        print("3. Create a Form view")
        print("4. Configure these settings:")
        print("   - Mark required fields")
        print("   - Add field descriptions from the config")
        print("   - Set up conditional logic")
        print("   - Customize form branding")
        
        # Save result
        result = {
            'table_id': table_id,
            'base_id': creator.base_id,
            'created_at': str(datetime.now())
        }
        
        with open('data/airtable_form_result.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("\nConfiguration saved to: data/airtable_form_result.json")
        
    except Exception as e:
        print(f"\n✗ API creation failed: {e}")
        print("\nGenerating manual setup script instead...")
        creator.generate_manual_script()
        creator.generate_field_summary()

if __name__ == "__main__":
    from datetime import datetime
    main()