from playwright.sync_api import sync_playwright
import os

temp_profile_path = os.path.expanduser("~/chrome-profile-playwright")

with sync_playwright() as p:
    context = p.chromium.launch_persistent_context(
        user_data_dir=temp_profile_path,
        headless=False  # See the window so you can confirm auth
    )
    page = context.pages[0] if context.pages else context.new_page()
    page.goto("https://www.dodsbirsttr.mil/topics/app/")

    input("Log in if needed, then press Enter to continue...")

    
    # Optional: wait and interact manually to explore
    page.wait_for_timeout(10000)  # 10 seconds to look around

    context.close()
