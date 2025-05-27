# Updated script.py with more stable browser launch
from playwright.sync_api import sync_playwright
import os
import argparse
import time

# Remove user_data_dir - it's causing issues in Docker
# user_data_dir = os.path.expanduser("~/.sbir-session")  # Comment this out

parser = argparse.ArgumentParser()
parser.add_argument('--topic', required=True, help='Topic Code (e.g., A254-016)')
args = parser.parse_args()
topic_code = args.topic

def save_debug_screenshot(page, filename):
    """Helper function to save debug screenshots"""
    try:
        screenshot_dir = os.path.join(os.getcwd(), 'debug_screenshots')
        os.makedirs(screenshot_dir, exist_ok=True)
        screenshot_path = os.path.join(screenshot_dir, filename)
        page.screenshot(path=screenshot_path)
        print(f"📸 Debug screenshot saved to: {screenshot_path}")
        return screenshot_path
    except Exception as e:
        print(f"⚠️ Could not save screenshot: {e}")
        return None

def run():
    browser = None
    page = None
    
    try:
        print("🚀 Launching browser in headless mode...")
        with sync_playwright() as p:
            # Use simpler browser launch instead of persistent context
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    # Add these for better Docker stability
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps',
                    '--no-default-browser-check',
                    '--disable-hang-monitor',
                    '--disable-popup-blocking',
                    '--disable-prompt-on-repost',
                    '--no-service-autorun',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--mute-audio'
                ]
            )
            
            # Create a new context and page
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = context.new_page()
            page.set_default_timeout(30000)

            # Enable request/response logging
            def log_request(request):
                print(f"→ {request.method} {request.url}")
            
            def log_response(response):
                print(f"← {response.status} {response.url}")
            
            page.on("request", log_request)
            page.on("response", log_response)

            print("🔄 Navigating to topics search page...")
            page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=90000)
            print("✅ Page loaded successfully")
            save_debug_screenshot(page, 'initial_page.png')

            # Wait for search input
            print("⏳ Waiting for search input...")
            page.wait_for_selector('input[aria-label="Search"]', timeout=15000)
            print("✅ Search input found")

            # Search for topic
            print(f"🔍 Searching for topic: {topic_code}...")
            page.fill('input[aria-label="Search"]', topic_code)
            page.click('#searchButton')
            page.wait_for_timeout(3000)  # Wait for results

            print("🖱️ Clicking first topic result...")
            topic_locator = page.locator(".topic-number-status", has_text=topic_code)
            if topic_locator.count() == 0:
                print("❌ Topic not found in search results.")
                save_debug_screenshot(page, 'no_results.png')
                return None

            topic_locator.first.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            print("⬇️ Attempting PDF download...")
            
            # More robust download handling
            try:
                # First check if the download button exists
                download_button = page.locator('a[title="Download PDF"]')
                if download_button.count() == 0:
                    print("❌ PDF download button not found")
                    save_debug_screenshot(page, 'no_download_button.png')
                    return None
                
                # Wait for the download with longer timeout
                with page.expect_download(timeout=120000) as download_info:  # 2 minute timeout
                    download_button.click(timeout=30000)  # 30 second click timeout

                download = download_info.value
                file_path = os.path.join(os.getcwd(), download.suggested_filename)
                
                print(f"💾 Saving download to: {file_path}")
                download.save_as(file_path)

                if not os.path.exists(file_path):
                    raise Exception("Failed to save PDF file")
                    
                print(f"✅ PDF saved to: {file_path}")
                return file_path
                
            except Exception as download_error:
                print(f"❌ Download failed: {download_error}")
                save_debug_screenshot(page, 'download_failed.png')
                
                # Try alternative download method if available
                try:
                    print("🔄 Trying alternative download method...")
                    # Sometimes the link is different
                    alt_download = page.locator('a:has-text("Download"), a:has-text("PDF")')
                    if alt_download.count() > 0:
                        with page.expect_download(timeout=60000) as alt_download_info:
                            alt_download.first.click()
                        
                        alt_download = alt_download_info.value
                        alt_file_path = os.path.join(os.getcwd(), alt_download.suggested_filename)
                        alt_download.save_as(alt_file_path)
                        
                        if os.path.exists(alt_file_path):
                            print(f"✅ PDF saved via alternative method: {alt_file_path}")
                            return alt_file_path
                except Exception as alt_error:
                    print(f"❌ Alternative download also failed: {alt_error}")
                
                raise download_error

    except Exception as e:
        print(f"❌ Error during download: {e}")
        if page:
            save_debug_screenshot(page, 'download_error.png')
        raise
    
    finally:
        # Safer cleanup
        print("🧹 Cleaning up browser resources...")
        
        try:
            if page and not page.is_closed():
                page.close()
                print("✅ Page closed")
        except Exception as page_cleanup_error:
            print(f"⚠️ Page cleanup warning (non-fatal): {page_cleanup_error}")
        
        try:
            if 'context' in locals() and context:
                context.close()
                print("✅ Context closed")
        except Exception as context_cleanup_error:
            print(f"⚠️ Context cleanup warning (non-fatal): {context_cleanup_error}")
        
        try:
            if browser and not browser.is_closed():
                browser.close()
                print("✅ Browser closed")
        except Exception as browser_cleanup_error:
            print(f"⚠️ Browser cleanup warning (non-fatal): {browser_cleanup_error}")
        
        print("✅ Cleanup completed")

if __name__ == "__main__":
    run()