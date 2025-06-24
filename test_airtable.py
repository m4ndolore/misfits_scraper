#!/usr/bin/env python3
"""Test script to check if Airtable view loads without crashing"""

from playwright.sync_api import sync_playwright
import time
import json

def test_airtable_access():
    url = "https://airtable.com/appGFhooq5rKm7ZWQ/shrQiDKQ9ENcR3Smn"
    
    with sync_playwright() as p:
        # Launch browser with minimal settings
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
            
            print(f"Attempting to load: {url}")
            
            # Navigate with extended timeout
            page.goto(url, wait_until='networkidle', timeout=60000)
            
            print("Page loaded successfully!")
            
            # Wait for table to render
            time.sleep(5)
            
            # Try to extract visible field headers
            headers = page.locator('[data-testid="column-header"]').all_text_contents()
            if headers:
                print(f"\nFound {len(headers)} columns:")
                for header in headers[:10]:  # Show first 10
                    print(f"  - {header}")
            
            # Try to count visible rows
            rows = page.locator('[data-testid="row"]').count()
            print(f"\nFound {rows} data rows")
            
            # Take a screenshot for debugging
            page.screenshot(path="airtable_test.png")
            print("\nScreenshot saved as airtable_test.png")
            
        except Exception as e:
            print(f"\nError loading Airtable: {type(e).__name__}: {str(e)}")
            print("\nThis might be due to:")
            print("- Authentication requirements")
            print("- Long text fields causing memory issues")
            print("- Dynamic content loading issues")
            
        finally:
            browser.close()

if __name__ == "__main__":
    test_airtable_access()