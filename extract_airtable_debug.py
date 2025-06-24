#!/usr/bin/env python3
"""Debug script to understand Airtable page structure"""

from playwright.sync_api import sync_playwright
import time

def debug_airtable():
    url = "https://airtable.com/appGFhooq5rKm7ZWQ/shrQiDKQ9ENcR3Smn"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for debugging
        
        try:
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = context.new_page()
            
            print(f"Loading: {url}")
            page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            # Wait for any content
            time.sleep(10)
            
            # Debug: Find all possible table-like structures
            print("\nSearching for data containers...")
            
            # Try different selectors
            selectors = [
                '[data-testid="table"]',
                '[class*="table"]',
                '[class*="grid"]',
                '[role="table"]',
                '[role="grid"]',
                'table',
                '.dataTable',
                '[data-rowindex]'
            ]
            
            for selector in selectors:
                count = page.locator(selector).count()
                if count > 0:
                    print(f"  Found {count} elements matching: {selector}")
            
            # Get page content for manual inspection
            content = page.content()
            with open('airtable_page_content.html', 'w') as f:
                f.write(content)
            print("\nPage HTML saved to airtable_page_content.html")
            
            # Take screenshot
            page.screenshot(path="airtable_debug.png", full_page=True)
            print("Screenshot saved to airtable_debug.png")
            
            input("\nPress Enter to close browser...")
            
        finally:
            browser.close()

if __name__ == "__main__":
    debug_airtable()