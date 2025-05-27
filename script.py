# Hybrid approach: Use requests for search API, Playwright only for final download
import requests
import json
import os
import argparse
from playwright.sync_api import sync_playwright
import time

parser = argparse.ArgumentParser()
parser.add_argument('--topic', required=True, help='Topic Code (e.g., A254-016)')
args = parser.parse_args()
topic_code = args.topic

def search_topic_via_api(topic_code):
    """Search for topic using direct API calls instead of browser automation"""
    print(f"🔍 Searching for topic via API: {topic_code}...")
    
    # This is the API endpoint the site uses for search
    search_url = "https://www.dodsbirsttr.mil/topics/api/public/topics/search"
    
    # Search parameters (from analyzing the working browser requests)
    search_params = {
        "searchParam": json.dumps({
            "searchText": topic_code,
            "components": None,
            "programYear": None,
            "solicitationCycleNames": ["openTopics"],
            "releaseNumbers": [],
            "topicReleaseStatus": [591, 592],
            "modernizationPriorities": [],
            "sortBy": "finalTopicCode,asc",
            "technologyAreaIds": [],
            "component": None,
            "program": None
        }),
        "size": 10,
        "page": 0
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
        'Origin': 'https://www.dodsbirsttr.mil'
    }
    
    try:
        response = requests.get(search_url, params=search_params, headers=headers, timeout=30)
        print(f"🔍 Search API response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'content' in data and len(data['content']) > 0:
                # Find exact topic match
                for topic in data['content']:
                    if topic.get('finalTopicCode') == topic_code:
                        print(f"✅ Found topic: {topic.get('topicTitle', 'Unknown Title')}")
                        return topic
                
                print(f"❌ Topic {topic_code} not found in search results")
                return None
            else:
                print("❌ No search results returned")
                return None
        else:
            print(f"❌ Search API failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ API search error: {e}")
        return None

def download_pdf_direct(topic_data):
    """Try to download PDF directly using the API"""
    if not topic_data:
        return None
    
    topic_id = topic_data.get('id')
    if not topic_id:
        print("❌ No topic ID found")
        return None
    
    # Direct PDF download URL pattern
    pdf_url = f"https://www.dodsbirsttr.mil/topics/api/public/topics/{topic_id}/download/PDF"
    
    print(f"⬇️ Attempting direct PDF download from: {pdf_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Referer': 'https://www.dodsbirsttr.mil/topics-app/',
    }
    
    try:
        response = requests.get(pdf_url, headers=headers, timeout=60, stream=True)
        
        if response.status_code == 200:
            # Generate filename from topic data
            topic_title = topic_data.get('topicTitle', '').replace('/', '-').replace('\\', '-')
            # Clean filename
            import re
            topic_title = re.sub(r'[^\w\s\-_.]', '', topic_title)
            filename = f"topic_{topic_code}_{topic_title}.PDF"
            
            file_path = os.path.join(os.getcwd(), filename)
            
            # Save the PDF
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                print(f"✅ PDF saved to: {file_path}")
                return file_path
            else:
                print("❌ PDF file is empty or not saved properly")
                return None
        else:
            print(f"❌ PDF download failed with status {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Direct PDF download error: {e}")
        return None

def download_pdf_with_playwright(topic_data):
    """Fallback: Use Playwright for PDF download if direct download fails"""
    print("🔄 Trying Playwright fallback for PDF download...")
    
    browser = None
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--no-default-browser-check',
                    '--disable-hang-monitor',
                    '--disable-popup-blocking',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--disable-sync',
                    '--disable-translate'
                ]
            )
            
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            page.set_default_timeout(30000)
            
            # Navigate directly to topic details page
            topic_id = topic_data.get('id')
            topic_url = f"https://www.dodsbirsttr.mil/topics-app/details/{topic_id}"
            
            print(f"🔄 Navigating to topic details: {topic_url}")
            page.goto(topic_url, timeout=60000)
            page.wait_for_load_state("networkidle")
            
            # Try to download PDF
            try:
                with page.expect_download(timeout=60000) as download_info:
                    # Try multiple possible selectors for PDF download
                    selectors = [
                        'a[title="Download PDF"]',
                        'a:has-text("Download PDF")',
                        'a:has-text("PDF")',
                        '.pdf-download',
                        '[data-testid="pdf-download"]'
                    ]
                    
                    download_clicked = False
                    for selector in selectors:
                        try:
                            if page.locator(selector).count() > 0:
                                page.click(selector, timeout=10000)
                                download_clicked = True
                                break
                        except:
                            continue
                    
                    if not download_clicked:
                        raise Exception("Could not find PDF download button")

                download = download_info.value
                file_path = os.path.join(os.getcwd(), download.suggested_filename)
                download.save_as(file_path)

                if os.path.exists(file_path):
                    print(f"✅ PDF saved via Playwright: {file_path}")
                    return file_path
                else:
                    raise Exception("PDF file not saved")
                    
            except Exception as download_error:
                print(f"❌ Playwright download failed: {download_error}")
                return None
                
    except Exception as e:
        print(f"❌ Playwright error: {e}")
        return None
    
    finally:
        if browser:
            try:
                browser.close()
                print("✅ Browser closed")
            except:
                pass

def run():
    """Main execution function"""
    try:
        # Step 1: Search for topic using API
        topic_data = search_topic_via_api(topic_code)
        if not topic_data:
            print(f"❌ Could not find topic {topic_code}")
            return None
        
        # Step 2: Try direct PDF download first
        pdf_path = download_pdf_direct(topic_data)
        if pdf_path:
            return pdf_path
        
        # Step 3: Fallback to Playwright if direct download failed
        print("🔄 Direct download failed, trying Playwright fallback...")
        pdf_path = download_pdf_with_playwright(topic_data)
        return pdf_path
        
    except Exception as e:
        print(f"❌ Error in main execution: {e}")
        return None

if __name__ == "__main__":
    result = run()
    if not result:
        exit(1)