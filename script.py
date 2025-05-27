# Fixed version combining your working script with headless capability
from playwright.sync_api import sync_playwright
import os
import argparse
import time

user_data_dir = os.path.expanduser("~/.sbir-session")

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
    print("🚀 Launching browser in headless mode...")
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=True,  # This works fine for downloads
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            viewport={'width': 1920, 'height': 1080}
        )
        
        # Use existing page or create new one (like your working script)
        page = browser.pages[0] if browser.pages else browser.new_page()
        page.set_default_timeout(30000)

        # Enable request/response logging
        def log_request(request):
            print(f"→ {request.method} {request.url}")
        
        def log_response(response):
            print(f"← {response.status} {response.url}")
        
        page.on("request", log_request)
        page.on("response", log_response)

        try:
            print("🔄 Navigating to topics search page...")
            page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=90000)
            print("✅ Page loaded successfully")
            save_debug_screenshot(page, 'initial_page.png')

            # Wait for search input
            print("⏳ Waiting for search input...")
            page.wait_for_selector('input[aria-label="Search"]', timeout=15000)
            print("✅ Search input found")

            # Search for topic (using your working script logic)
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
            with page.expect_download(timeout=60000) as download_info:
                page.click('a[title="Download PDF"]', timeout=10000)

            download = download_info.value
            file_path = os.path.join(os.getcwd(), download.suggested_filename)
            download.save_as(file_path)

            if not os.path.exists(file_path):
                raise Exception("Failed to save PDF file")
                
            print(f"✅ PDF saved to: {file_path}")
            return file_path

        except Exception as e:
            print(f"❌ Error during download: {e}")
            save_debug_screenshot(page, 'download_error.png')
            raise
        
        finally:
            # Only close once, like your working script
            try:
                if browser and not browser.is_closed():
                    browser.close()
                print("✅ Browser closed")
            except Exception as cleanup_error:
                print(f"⚠️ Browser cleanup warning (non-fatal): {cleanup_error}")
                # Don't exit with error code for cleanup issues
if __name__ == "__main__":
    run()