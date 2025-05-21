from playwright.sync_api import sync_playwright
import os

user_data_dir = os.path.expanduser("~/.sbir-session")

with sync_playwright() as p:
    browser = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False)
    page = browser.new_page()
    
    # Go to the public topics list
    page.goto("https://www.dodsbirsttr.mil/topics-app/")
    
    # Wait for the list to load and click on the topic of interest
    page.wait_for_selector("text=AI for Anomaly Detection")  # Replace with actual topic title text
    page.click("text=AI for Anomaly Detection")

    # Wait for modal or detail page
    page.wait_for_timeout(2000)  # Adjust as needed
    
    # Trigger the actual download button
    with page.expect_download() as download_info:
        page.click("text=Download PDF")  # Adjust selector based on actual DOM

    download = download_info.value
    download.save_as("topic_download.pdf")
    print("✅ PDF downloaded successfully!")

    browser.close()
