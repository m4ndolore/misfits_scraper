#!/usr/bin/env python3
"""Validate Airtable questionnaire setup and test API integration"""

import os
import json
import requests
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

class AirtableQuestionnaireValidator:
    def __init__(self):
        self.api_key = os.getenv('AIRTABLE_API_KEY')
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
    def validate_table(self, table_name: str) -> Dict[str, Any]:
        """Check if table exists and has records"""
        url = f'https://api.airtable.com/v0/{self.base_id}/{table_name}'
        response = requests.get(url, headers=self.headers, params={'maxRecords': 1})
        
        if response.status_code == 200:
            data = response.json()
            return {
                'exists': True,
                'record_count': len(data.get('records', [])),
                'has_records': len(data.get('records', [])) > 0
            }
        else:
            return {
                'exists': False,
                'error': response.text
            }
    
    def fetch_questionnaire_structure(self) -> Dict[str, Any]:
        """Fetch the complete questionnaire structure from Airtable"""
        structure = {
            'sections': [],
            'questions': [],
            'options': []
        }
        
        # Fetch sections
        sections_url = f'https://api.airtable.com/v0/{self.base_id}/Sections'
        sections_response = requests.get(
            sections_url, 
            headers=self.headers,
            params={'sort[0][field]': 'display_order'}
        )
        
        if sections_response.status_code == 200:
            structure['sections'] = sections_response.json().get('records', [])
        
        # Fetch questions
        questions_url = f'https://api.airtable.com/v0/{self.base_id}/Questions'
        questions_response = requests.get(
            questions_url,
            headers=self.headers,
            params={'sort[0][field]': 'display_order'}
        )
        
        if questions_response.status_code == 200:
            structure['questions'] = questions_response.json().get('records', [])
        
        return structure
    
    def generate_form_preview(self, structure: Dict[str, Any]) -> str:
        """Generate a preview of how the form would look"""
        preview = "=== iME Onboarding Form Preview ===\n\n"
        
        # Group questions by section
        questions_by_section = {}
        for question in structure['questions']:
            section_id = question['fields'].get('section_id', ['Unknown'])[0]
            if section_id not in questions_by_section:
                questions_by_section[section_id] = []
            questions_by_section[section_id].append(question)
        
        # Display sections and questions
        for section in structure['sections']:
            section_id = section['fields']['section_id']
            preview += f"## {section['fields']['section_title']}\n"
            preview += f"{section['fields']['section_description']}\n\n"
            
            questions = questions_by_section.get(section_id, [])
            for i, question in enumerate(questions, 1):
                fields = question['fields']
                preview += f"{i}. {fields['question_text']}\n"
                if fields.get('question_hint'):
                    preview += f"   Hint: {fields['question_hint']}\n"
                preview += f"   Type: {fields['question_type']}"
                if fields.get('max_selections'):
                    preview += f" (max {fields['max_selections']})"
                preview += f" {'[Required]' if fields.get('is_required') else '[Optional]'}\n\n"
        
        return preview

def main():
    """Validate Airtable setup"""
    validator = AirtableQuestionnaireValidator()
    
    print("Validating Airtable Questionnaire Setup")
    print("=" * 50)
    
    # Check required tables
    required_tables = ['Sections', 'Questions', 'Question Options', 'AI Scoring Factors']
    table_status = {}
    
    for table in required_tables:
        print(f"\nChecking table: {table}")
        status = validator.validate_table(table)
        table_status[table] = status
        
        if status['exists']:
            print(f"  ✓ Table exists")
            print(f"  ✓ Has records: {status['has_records']}")
        else:
            print(f"  ✗ Table not found or error: {status.get('error', 'Unknown')}")
    
    # If core tables exist, fetch structure
    if table_status['Sections']['exists'] and table_status['Questions']['exists']:
        print("\n\nFetching questionnaire structure...")
        structure = validator.fetch_questionnaire_structure()
        
        print(f"Found {len(structure['sections'])} sections")
        print(f"Found {len(structure['questions'])} questions")
        
        # Generate preview
        if structure['sections'] and structure['questions']:
            preview = validator.generate_form_preview(structure)
            print("\n" + preview)
            
            # Save preview
            with open('data/airtable_import/form_preview.txt', 'w') as f:
                f.write(preview)
            print("\nForm preview saved to: data/airtable_import/form_preview.txt")
    
    # Summary
    print("\n" + "=" * 50)
    print("SETUP SUMMARY")
    print("=" * 50)
    
    all_exist = all(status['exists'] for status in table_status.values())
    if all_exist:
        print("✓ All required tables exist")
        print("\nNext steps:")
        print("1. Import question options if not already done")
        print("2. Set up table relationships")
        print("3. Create form view or use API integration")
    else:
        print("✗ Some tables are missing")
        print("\nTo complete setup:")
        print("1. Import all CSV files in data/airtable_import/")
        print("2. Follow AIRTABLE_SETUP_GUIDE.md")

if __name__ == "__main__":
    main()