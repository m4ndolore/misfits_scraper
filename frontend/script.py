from playwright.sync_api import sync_playwright
import os
import argparse
import time

user_data_dir = os.path.expanduser("~/.sbir-session")

parser = argparse.ArgumentParser()
parser.add_argument('--topic', required=True, help='Topic Code (e.g., A254-016)')
args = parser.parse_args()
topic_code = args.topic


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False)
        page = browser.pages[0] if browser.pages else browser.new_page()

        print("🔄 Navigating to topics search page...")
        page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=60000)
        page.wait_for_selector('input[aria-label="Search"]', timeout=10000)

        print(f"🔍 Searching for topic: {topic_code}...")
        page.fill('input[aria-label="Search"]', topic_code)
        page.click('#searchButton')
        page.wait_for_timeout(3000)  # Wait briefly for results to populate

        print("🖱️ Clicking first topic result...")
        topic_locator = page.locator(".topic-number-status", has_text=topic_code)
        if topic_locator.count() == 0:
            print("❌ Topic not found in search results.")
            browser.close()
            return

        topic_locator.first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        print("⬇️ Attempting PDF download...")
        try:
            with page.expect_download(timeout=10000) as download_info:
                page.click('a[title="Download PDF"]', timeout=5000)
            download = download_info.value
            file_path = os.path.join(os.getcwd(), download.suggested_filename)
            download.save_as(file_path)
            print(f"✅ PDF saved to: {file_path}")
        except Exception as e:
            print(f"❌ PDF download failed: {e}")

        browser.close()


if __name__ == "__main__":
    run()
