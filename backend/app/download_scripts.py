# download_script.py
import sys
import os
from playwright.sync_api import sync_playwright

def download_pdf(topic_id):
    with sync_playwright() as p:
        # Use persistent context for session
        user_data_dir = os.path.expanduser('~/.sbir-session')
        browser = p.chromium.launch_persistent_context(
            user_data_dir,
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = browser.pages[0] if browser.pages else browser.new_page()
        
        try:
            # Navigate to the topic search
            page.goto(f'https://www.dodsbirsttr.mil/topics-app/?search={topic_id}')
            
            # Wait for and click the result
            page.wait_for_selector('table tbody tr', timeout=10000)
            page.click('table tbody tr')
            
            # Click the download button
            page.wait_for_selector('a[title="Download PDF"]', timeout=10000)
            with page.expect_download() as download_info:
                page.click('a[title="Download PDF"]')
            download = download_info.value
            
            # Save to downloads directory
            os.makedirs('downloads', exist_ok=True)
            file_path = os.path.join('downloads', f'{topic_id}.pdf')
            download.save_as(file_path)
            print(file_path)  # Return the file path to Node.js
            
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python download_script.py <topic_id>", file=sys.stderr)
        sys.exit(1)
    download_pdf(sys.argv[1])