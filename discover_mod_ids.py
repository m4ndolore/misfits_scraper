import requests
import json
import time
from urllib.parse import quote

BASE_URL = "https://www.dodsbirsttr.mil/topics/api/public/topics/search"
DETAIL_URL = "https://www.dodsbirsttr.mil/topics/api/public/topics/{}"

search_param = {
    "searchText": None,
    "components": None,
    "programYear": None,
    "solicitationCycleNames": [],
    "releaseNumbers": [],
    "topicReleaseStatus": [591],
    "modernizationPriorities": [],
    "sortBy": "finalTopicCode,asc",
    "technologyAreaIds": [],
    "component": ["USAF"],
    "program": ["SBIR"]
}

encoded = quote(json.dumps(search_param))
url = f"{BASE_URL}?searchParam={encoded}&size=100&page=0"

print(f"[*] Fetching from:\n{url}\n")

headers = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0"
}

resp = requests.get(url, headers=headers)
resp.raise_for_status()

topics = resp.json().get("data", [])
print(f"[+] Retrieved {len(topics)} open USAF SBIR topics\n")

mod_priorities = set()

for i, topic in enumerate(topics):
    tid = topic["topicId"]
    title = topic.get("topicTitle", "Untitled")
    print(f"[{i+1}/{len(topics)}] Fetching details for {tid} — {title[:60]}...")

    try:
        detail_url = DETAIL_URL.format(tid)
        detail_resp = requests.get(detail_url, headers=headers)
        detail_resp.raise_for_status()
        data = detail_resp.json()
        mods = data.get("modernizationPriorities", [])
        for m in mods:
            mod_priorities.add(m)
        time.sleep(0.5)  # polite delay
    except Exception as e:
        print(f"  [!] Error fetching {tid}: {e}")

# Final output
print("\n=== Unique Modernization Priorities ===")
for m in sorted(mod_priorities):
    print(f" - {m}")
