from playwright.sync_api import sync_playwright
import os

user_data_dir = os.path.expanduser("~/.sbir-session")
access_url = "https://www.dodsbirsttr.mil/topics/api/protected/topics/0108a06f1cbd4ff988d577084d80a58e_86028/accessDetails"

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False)
    page = browser.new_page()
    page.goto(access_url)
    print("🔍 Page loaded:", page.url)
    print("📄 Response content (should NOT be 401):")
    print(page.content())
    input("Press Enter to close...")
    browser.close()
