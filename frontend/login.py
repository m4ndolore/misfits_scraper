from playwright.sync_api import sync_playwright
import os

user_data_dir = os.path.expanduser("~/.sbir-session")

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False)
    page = browser.new_page()
    page.goto("https://www.dodsbirsttr.mil/topics-app/")
    print("✅ Login browser launched. Please log in manually, then close this window when done.")
    input("🔒 Press Enter here after you've logged in and can browse topics...")  # Wait for manual login
    browser.close()
    print("✅ Session saved to ~/.sbir-session")
