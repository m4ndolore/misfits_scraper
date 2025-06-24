#!/usr/bin/env python3
"""Test Airtable API connection"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Get credentials
api_key = os.getenv('AIRTABLE_API_KEY')
base_id = os.getenv('AIRTABLE_BASE_ID')
table_name = os.getenv('AIRTABLE_TABLE_NAME')

print(f"Testing Airtable API connection...")
print(f"Base ID: {base_id}")
print(f"Table Name: {table_name}")
print(f"API Key: {'*' * 10}{api_key[-4:] if api_key else 'NOT SET'}")

# Test 1: List tables in the base
print("\n--- Test 1: List tables in base ---")
url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
headers = {
    'Authorization': f'Bearer {api_key}'
}

response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("Tables in base:")
    for table in data.get('tables', []):
        print(f"  - {table['name']} (ID: {table['id']})")
else:
    print(f"Error: {response.text}")

# Test 2: Try to access the specific table
print(f"\n--- Test 2: Access table {table_name} ---")
url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
params = {'maxRecords': 1}

response = requests.get(url, headers=headers, params=params)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Success! Found {len(data.get('records', []))} records")
    if data.get('records'):
        print("First record fields:", list(data['records'][0].get('fields', {}).keys()))
else:
    print(f"Error: {response.text}")

# Test 3: Try URL encoding the table name
if not table_name.startswith('tbl'):
    print(f"\n--- Test 3: Try URL encoded table name ---")
    import urllib.parse
    encoded_name = urllib.parse.quote(table_name)
    url = f"https://api.airtable.com/v0/{base_id}/{encoded_name}"
    
    response = requests.get(url, headers=headers, params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success with URL encoding!")
    else:
        print(f"Error: {response.text}")