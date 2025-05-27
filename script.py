# Back to browser approach but with minimal, stable configuration + better timing
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
            page.set_default_timeout(90000)  # Increased to 90 seconds
            
            print("🔄 Navigating to topics search page...")
            page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=180000)  # 3 minute timeout
            print("✅ Page loaded")
            
            # Wait longer for the page to fully initialize
            print("⏳ Waiting for page to fully load...")
            time.sleep(8)  # Increased from 5 to 8 seconds
            
            # Try to find search input with longer wait
            print("🔍 Looking for search input...")
            search_input = page.locator('input[aria-label="Search"]')
            
            # Wait for search input to be visible and enabled
            search_input.wait_for(state="visible", timeout=45000)  # Increased timeout
            time.sleep(3)  # Additional wait
            
            print(f"🔍 Searching for topic: {topic_code}...")
            search_input.fill(topic_code)
            time.sleep(2)  # Increased wait between fill and click
            
            # Try clicking search button with error handling
            try:
                search_button = page.locator('#searchButton')
                search_button.wait_for(state="visible", timeout=15000)
                search_button.click()
                print("✅ Search button clicked")
            except Exception as search_error:
                print(f"❌ Search button click failed: {search_error}")
                # Try alternative - press Enter instead
                print("🔄 Trying Enter key instead...")
                search_input.press("Enter")
            
            # Wait longer for search results
            print("⏳ Waiting for search results...")
            time.sleep(8)  # Increased from 5 to 8 seconds
            
            # Look for topic in results with retry logic
            print("🔍 Looking for topic in results...")
            topic_elements = None
            
            # Retry logic for finding topic (sometimes results load slowly)
            for attempt in range(3):
                topic_elements = page.locator(f".topic-number-status:has-text('{topic_code}')")
                if topic_elements.count() > 0:
                    break
                print(f"⏳ Attempt {attempt + 1}/3: Topic not found yet, waiting...")
                time.sleep(5)
            
            if not topic_elements or topic_elements.count() == 0:
                print(f"❌ Topic {topic_code} not found in search results after all attempts")
                return None
            
            print("🖱️ Clicking on topic...")
            topic_elements.first.click()
            
            # Wait longer for topic details page to load
            print("⏳ Waiting for topic details to load...")
            time.sleep(8)  # Increased wait time
            
            # Try to download PDF
            print("⬇️ Looking for PDF download link...")
            
            # Try multiple selectors for PDF download with retry
            pdf_selectors = [
                'a[title="Download PDF"]',
                'a:has-text("Download PDF")',
                'a:has-text("PDF")',
                '.download-pdf',
                '[href*="download/PDF"]'
            ]
            
            pdf_link = None
            # Retry logic for finding PDF link
            for attempt in range(3):
                for selector in pdf_selectors:
                    links = page.locator(selector)
                    if links.count() > 0:
                        pdf_link = links.first
                        print(f"✅ Found PDF link with selector: {selector}")
                        break
                
                if pdf_link:
                    break
                    
                print(f"⏳ Attempt {attempt + 1}/3: PDF link not found yet, waiting...")
                time.sleep(5)
            
            if not pdf_link:
                print("❌ No PDF download link found after all attempts")
                return None
            
            print("⬇️ Starting PDF download...")
            
            # Handle download with much longer timeout
            try:
                with page.expect_download(timeout=300000) as download_info:  # 5 minute timeout!
                    pdf_link.click()
                    print("⏳ Download started, waiting for completion...")
                
                download = download_info.value
                print(f"✅ Download completed: {download.suggested_filename}")
                
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
                    
            except Exception as download_error:
                print(f"❌ Download failed: {download_error}")
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