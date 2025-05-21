from playwright.sync_api import sync_playwright
import os

user_data_dir = os.path.expanduser("~/.sbir-session")  # Preserves your login

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False)
        page = browser.pages[0] if browser.pages else browser.new_page()

        # 1. Navigate to main site
        print("🔄 Navigating to topics page...")
        page.goto("https://www.dodsbirsttr.mil/topics-app/", timeout=60000)
        page.wait_for_load_state("networkidle")

        input("⏸️ Please manually click on a topic (e.g., AI for Anomaly Detection) and wait until the topic page loads, then press Enter here...")

        # 2. Click the download button and intercept the download
        print("⬇️ Looking for PDF download...")
        with page.expect_download(timeout=10000) as download_info:
            pdf_links = page.locator('a[title="Download PDF"]')
            count = pdf_links.count()
            print(f"🔎 Found {count} 'Download PDF' link(s)")

            # Click the first visible one
            for i in range(count):
                link = pdf_links.nth(i)
                if link.is_visible():
                    print(f"✅ Clicking visible link #{i+1}")
                    with page.expect_download(timeout=15000) as download_info:
                        link.click()
                    download = download_info.value
                    filename = download.suggested_filename
                    download.save_as(filename)
                    print(f"✅ Saved: {filename}")
                    break
            else:
                print("❌ No visible 'Download PDF' links found.")
        
        download = download_info.value
        download_path = os.path.join(os.getcwd(), download.suggested_filename)
        download.save_as(download_path)
        print(f"✅ Download saved to {download_path}")

        browser.close()

if __name__ == "__main__":
    run()
