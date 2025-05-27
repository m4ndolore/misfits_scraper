# Back to browser approach but with minimal, stable configuration
from playwright.sync_api import sync_playwright
import os
import argparse
import time

parser = argparse.ArgumentParser()
parser.add_argument('--topic', required=True, help='Topic Code (e.g., A254-016)')
args = parser.parse_args()
topic_code = args.topic

def run():
    browser = None
    
    try:
        print("🚀 Launching browser with minimal configuration...")
        
        with sync_playwright() as p:
            # Use the most minimal browser configuration possible
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                    # Only the essential flags - removing everything else that might cause issues
                ]
            )
            
            # Simple context - no special configuration
            page = browser.new_page()
            page.set_default_timeout(60000)  # Longer timeout
            
            print("🔄 Navigating to topics search page...")
            page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=120000)  # 2 minute timeout
            print("✅ Page loaded")
            
            # Wait longer for the page to fully initialize
            print("⏳ Waiting for page to fully load...")
            time.sleep(5)  # Simple sleep instead of complex waits
            
            # Try to find search input with longer wait
            print("🔍 Looking for search input...")
            search_input = page.locator('input[aria-label="Search"]')
            
            # Wait for search input to be visible and enabled
            search_input.wait_for(state="visible", timeout=30000)
            time.sleep(2)  # Additional wait
            
            print(f"🔍 Searching for topic: {topic_code}...")
            search_input.fill(topic_code)
            time.sleep(1)  # Wait between fill and click
            
            # Try clicking search button with error handling
            try:
                search_button = page.locator('#searchButton')
                search_button.wait_for(state="visible", timeout=10000)
                search_button.click()
                print("✅ Search button clicked")
            except Exception as search_error:
                print(f"❌ Search button click failed: {search_error}")
                # Try alternative - press Enter instead
                print("🔄 Trying Enter key instead...")
                search_input.press("Enter")
            
            # Wait for search results
            print("⏳ Waiting for search results...")
            time.sleep(5)  # Give time for results to load
            
            # Look for topic in results
            print("🔍 Looking for topic in results...")
            topic_elements = page.locator(f".topic-number-status:has-text('{topic_code}')")
            
            if topic_elements.count() == 0:
                print(f"❌ Topic {topic_code} not found in search results")
                return None
            
            print("🖱️ Clicking on topic...")
            topic_elements.first.click()
            
            # Wait for topic details page to load
            print("⏳ Waiting for topic details to load...")
            time.sleep(5)
            
            # Try to download PDF
            print("⬇️ Looking for PDF download link...")
            
            # Try multiple selectors for PDF download
            pdf_selectors = [
                'a[title="Download PDF"]',
                'a:has-text("Download PDF")',
                'a:has-text("PDF")',
                '.download-pdf',
                '[href*="download/PDF"]'
            ]
            
            pdf_link = None
            for selector in pdf_selectors:
                links = page.locator(selector)
                if links.count() > 0:
                    pdf_link = links.first
                    print(f"✅ Found PDF link with selector: {selector}")
                    break
            
            if not pdf_link:
                print("❌ No PDF download link found")
                return None
            
            print("⬇️ Starting PDF download...")
            
            # Handle download
            with page.expect_download(timeout=120000) as download_info:  # 2 minute timeout
                pdf_link.click()
            
            download = download_info.value
            
            # Save the file
            suggested_name = download.suggested_filename
            if not suggested_name or not suggested_name.endswith('.PDF'):
                # Generate our own filename if needed
                suggested_name = f"topic_{topic_code}.PDF"
            
            file_path = os.path.join(os.getcwd(), suggested_name)
            download.save_as(file_path)
            
            # Verify file was saved
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                print(f"✅ PDF saved to: {file_path}")
                return file_path
            else:
                print("❌ PDF file was not saved properly")
                return None
                
    except Exception as e:
        print(f"❌ Error during download: {e}")
        return None
    
    finally:
        # Simple cleanup
        if browser:
            try:
                browser.close()
                print("✅ Browser closed")
            except Exception as cleanup_error:
                print(f"⚠️ Browser cleanup warning: {cleanup_error}")

if __name__ == "__main__":
    result = run()
    if not result:
        exit(1)