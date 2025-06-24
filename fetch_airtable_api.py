#!/usr/bin/env python3
"""Fetch business profiles from Airtable using API"""

import os
import json
import requests
from datetime import datetime
from typing import List, Dict, Any

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')
AIRTABLE_TABLE_NAME = os.getenv('AIRTABLE_TABLE_NAME')
AIRTABLE_VIEW_NAME = os.getenv('AIRTABLE_VIEW_NAME')

if not all([AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME]):
    raise ValueError("Missing required environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME")

class AirtableClient:
    def __init__(self):
        self.api_key = AIRTABLE_API_KEY
        self.base_id = AIRTABLE_BASE_ID
        self.table_name = AIRTABLE_TABLE_NAME
        self.view_name = AIRTABLE_VIEW_NAME
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        # Table name should be the table ID (starts with 'tbl') or the actual table name
        self.base_url = f'https://api.airtable.com/v0/{self.base_id}/{self.table_name}'
        print(f"API Base URL: {self.base_url}")
        if self.view_name:
            print(f"Using view: {self.view_name}")
    
    def fetch_all_records(self) -> List[Dict[str, Any]]:
        """Fetch all records from the Airtable view"""
        all_records = []
        offset = None
        
        while True:
            params = {'pageSize': 100}
            if offset:
                params['offset'] = offset
            
            # Add view parameter if specified
            if self.view_name:
                params['view'] = self.view_name
            
            print(f"Requesting: {self.base_url} with params: {params}")
            response = requests.get(self.base_url, headers=self.headers, params=params)
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
                print(f"Headers sent: {self.headers}")
                break
                
            data = response.json()
            records = data.get('records', [])
            all_records.extend(records)
            
            # Check for more pages
            offset = data.get('offset')
            if not offset:
                break
                
            print(f"Fetched {len(records)} records, total so far: {len(all_records)}")
        
        return all_records
    
    def transform_to_ime_format(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Airtable records to iME business profile format"""
        ime_profiles = []
        
        for record in records:
            fields = record.get('fields', {})
            
            # Skip empty records
            if not fields.get('Program Name'):
                continue
            
            ime_profile = {
                "id": record.get('id'),
                "companyInfo": {
                    "name": fields.get("Program Name", ""),
                    "organization": fields.get("Lead Organization", ""),
                    "type": fields.get("Organization Type", ""),
                    "url": fields.get("Company URL", ""),
                    "teamSize": fields.get("Team Size", ""),
                    "contact": {
                        "email": fields.get("POC Email", ""),
                        "phone": fields.get("POC Phone", ""),
                        "preferredMethod": fields.get("Preferred Contact Method", "")
                    }
                },
                "capabilities": {
                    "technicalMaturity": fields.get("Technical Maturity", ""),
                    "productionTimeline": fields.get("Production Timeline", ""),
                    "primaryTechnology": fields.get("Primary Technology", ""),
                    "secondaryTechnologies": fields.get("Secondary Technologies", []),
                    "trlLevel": fields.get("TRL Level", ""),
                    "certifications": fields.get("Certifications", [])
                },
                "preferences": {
                    "agencies": fields.get("Target Agencies", ["DoD"]),  # Default to DoD
                    "contractTypes": ["SBIR", "STTR"],  # Default for this dataset
                    "budgetRange": {
                        "min": fields.get("Min Budget", 0),
                        "max": fields.get("Max Budget", 0)
                    },
                    "riskTolerance": fields.get("Risk Tolerance", "medium")
                },
                "pastPerformance": {
                    "previousContracts": fields.get("Previous Contracts", 0),
                    "agencies": fields.get("Past Agencies", []),
                    "successRate": fields.get("Success Rate", 0)
                },
                "metadata": {
                    "extractedAt": datetime.now().isoformat(),
                    "source": "airtable",
                    "recordId": record.get('id'),
                    "createdTime": record.get('createdTime')
                }
            }
            
            ime_profiles.append(ime_profile)
        
        return ime_profiles

def main():
    """Main function to fetch and process Airtable data"""
    print("Fetching business profiles from Airtable API...")
    
    # Create data directory if needed
    os.makedirs('data', exist_ok=True)
    
    # Initialize client and fetch data
    client = AirtableClient()
    records = client.fetch_all_records()
    
    print(f"\nFetched {len(records)} total records from Airtable")
    
    # Save raw Airtable data
    with open('data/airtable_raw_api.json', 'w') as f:
        json.dump(records, f, indent=2)
    print("Saved raw data to data/airtable_raw_api.json")
    
    # Transform to iME format
    ime_profiles = client.transform_to_ime_format(records)
    print(f"\nTransformed {len(ime_profiles)} profiles to iME format")
    
    # Save iME formatted data
    with open('data/ime_business_profiles.json', 'w') as f:
        json.dump(ime_profiles, f, indent=2)
    print("Saved iME profiles to data/ime_business_profiles.json")
    
    # Print sample profile
    if ime_profiles:
        print("\nSample iME profile:")
        print(json.dumps(ime_profiles[0], indent=2))
    
    # Generate summary statistics
    print("\n=== Summary Statistics ===")
    print(f"Total profiles: {len(ime_profiles)}")
    
    # Count by organization type
    org_types = {}
    for profile in ime_profiles:
        org_type = profile['companyInfo'].get('type', 'Unknown')
        org_types[org_type] = org_types.get(org_type, 0) + 1
    
    print("\nOrganization Types:")
    for org_type, count in sorted(org_types.items()):
        print(f"  {org_type}: {count}")
    
    # Count by technical maturity
    maturities = {}
    for profile in ime_profiles:
        maturity = profile['capabilities'].get('technicalMaturity', 'Unknown')
        maturities[maturity] = maturities.get(maturity, 0) + 1
    
    print("\nTechnical Maturity Levels:")
    for maturity, count in sorted(maturities.items()):
        print(f"  {maturity}: {count}")
    
    return ime_profiles

if __name__ == "__main__":
    profiles = main()