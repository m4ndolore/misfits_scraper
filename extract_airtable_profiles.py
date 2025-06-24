#!/usr/bin/env python3
"""Extract business profiles from Airtable for iME integration"""

from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

def extract_airtable_data():
    url = "https://airtable.com/appGFhooq5rKm7ZWQ/shrQiDKQ9ENcR3Smn"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        try:
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            page = context.new_page()
            
            print(f"Loading Airtable view...")
            page.goto(url, wait_until='networkidle', timeout=60000)
            
            # Wait for table to fully render - Airtable uses custom selectors
            page.wait_for_selector('table', timeout=30000)
            time.sleep(5)  # Give it more time to load all data
            
            # Try to scroll to load more data if needed
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)
            
            # Extract data using table structure
            profiles = []
            
            # Get all table rows (skip header)
            rows = page.locator('tbody tr').all()
            
            print(f"Found {len(rows)} rows in table")
            
            # Define expected columns based on screenshot
            column_mapping = {
                0: "Program Name",
                1: "Lead Organization", 
                2: "Organization Type",
                3: "POC Email",
                4: "POC Phone",
                5: "Preferred Contact Method",
                6: "Company URL",
                7: "Team Size",
                8: "Technical Maturity",
                9: "Production Timeline"
            }
            
            for row in rows:
                cells = row.locator('td').all()
                if cells:
                    profile = {}
                    for i, cell in enumerate(cells):
                        if i in column_mapping:
                            cell_text = cell.inner_text().strip()
                            profile[column_mapping[i]] = cell_text
                    
                    if profile.get('Program Name'):  # Only add if has data
                        profiles.append(profile)
            
            print(f"\nExtracted {len(profiles)} business profiles")
            
            # Map to iME-compatible structure
            ime_profiles = []
            for profile in profiles:
                ime_profile = {
                    "companyInfo": {
                        "name": profile.get("Program Name", ""),
                        "organization": profile.get("Lead Organization", ""),
                        "type": profile.get("Organization Type", ""),
                        "url": profile.get("Company URL", ""),
                        "teamSize": profile.get("Team Size", ""),
                        "contact": {
                            "email": profile.get("POC Email", ""),
                            "phone": profile.get("POC Phone", ""),
                            "preferredMethod": profile.get("Preferred Contact Method", "")
                        }
                    },
                    "capabilities": {
                        "technicalMaturity": profile.get("Technical Maturity", ""),
                        "productionTimeline": profile.get("Production Timeline", ""),
                        # Additional capabilities would come from other columns
                    },
                    "preferences": {
                        # These would need to be extracted from additional columns
                        "agencies": [],
                        "contractTypes": ["SBIR", "STTR"],  # Default for this dataset
                        "budgetRange": {},
                        "riskTolerance": "medium"  # Default, could be derived
                    },
                    "metadata": {
                        "extractedAt": datetime.now().isoformat(),
                        "source": "airtable"
                    }
                }
                ime_profiles.append(ime_profile)
            
            # Save raw data
            with open('data/airtable_profiles_raw.json', 'w') as f:
                json.dump(profiles, f, indent=2)
            
            # Save iME-formatted data
            with open('data/ime_business_profiles.json', 'w') as f:
                json.dump(ime_profiles, f, indent=2)
            
            print(f"\nData saved to:")
            print("  - data/airtable_profiles_raw.json (raw Airtable data)")
            print("  - data/ime_business_profiles.json (iME-formatted)")
            
            # Print sample profile
            if ime_profiles:
                print("\nSample iME profile:")
                print(json.dumps(ime_profiles[0], indent=2))
            
            return ime_profiles
            
        except Exception as e:
            print(f"\nError extracting data: {type(e).__name__}: {str(e)}")
            raise
            
        finally:
            browser.close()

if __name__ == "__main__":
    # Create data directory if needed
    import os
    os.makedirs('data', exist_ok=True)
    
    profiles = extract_airtable_data()