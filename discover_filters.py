#!/usr/bin/env python3
import json
import math
import argparse
import time
import logging
from collections import Counter
import requests
from urllib.parse import quote

# ───────── Config ───────── #
SEARCH_URL      = "https://www.dodsbirsttr.mil/topics/api/public/topics/search"
DETAIL_URL      = "https://www.dodsbirsttr.mil/topics/api/public/topics/{topicId}"
HEADERS         = {"User-Agent": "Filter-Discovery/Modernization/2.0", "Accept": "application/json"}
RETRY_DELAY     = 1      # seconds between retries on 5xx
MAX_RETRIES     = 2
PAGE_SIZE       = 100    # results per page
LOG_FORMAT      = "%(asctime)s [%(levelname)s] %(message)s"

# ─────── Helpers ───────── #

def build_search_url(params, page, size):
    payload = quote(json.dumps(params, separators=(',',':')))
    return f"{SEARCH_URL}?searchParam={payload}&size={size}&page={page}"


def fetch_json(url):
    """Fetch JSON with retry on server errors."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except requests.HTTPError:
            status = resp.status_code
            if 500 <= status < 600 and attempt < MAX_RETRIES:
                logging.warning(f"5xx {status} on {url}, retry {attempt+1}/{MAX_RETRIES}")
                time.sleep(RETRY_DELAY)
                continue
            logging.error(f"HTTP error {status} on {url}")
            break
        except Exception as e:
            logging.error(f"Error fetching {url}: {e}")
            break
    return None

# ─────── Modernization Discovery ─────── #

def discover_modernization(page_limit, detail_limit, status_codes):
    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)

    # minimal search parameters
    base_param = {
        "searchText": None,
        "components": None,
        "programYear": None,
        "solicitationCycleNames": [],
        "releaseNumbers": [],
        "topicReleaseStatus": status_codes or [],
        "modernizationPriorities": [],
        "sortBy": "finalTopicCode,asc",
        "technologyAreaIds": [],
        "component": None,
        "program": None
    }

    # determine pages to scan
    first = fetch_json(build_search_url(base_param, 0, PAGE_SIZE)) or {}
    total = first.get('total', 0)
    max_pages = math.ceil(total / PAGE_SIZE) if total else 0
    pages = max_pages if page_limit == 0 else min(page_limit, max_pages)
    logging.info(f"Total topics={total:,}, scanning {pages} pages for modernization priorities...")

    # counter for modernizationPriorities
    mod_counter = Counter()
    processed = 0

    # loop pages and fetch details inline
    for p in range(pages):
        url = build_search_url(base_param, p, PAGE_SIZE)
        data = fetch_json(url) or {}
        topics = data.get('data', [])
        logging.info(f"Page {p+1}/{pages}: scanning {len(topics)} topics for details")
        for t in topics:
            tid = t.get('topicId')
            if not tid:
                continue
            detail = fetch_json(DETAIL_URL.format(topicId=tid))
            processed += 1
            if detail:
                mods = detail.get('modernizationPriorities') or []
                mod_counter.update(mods)
                logging.info(f"[{processed}] ID={tid}, mods={mods}")
            if detail_limit and processed >= detail_limit:
                logging.info(f"Reached detail limit of {detail_limit}, stopping.")
                break
        if detail_limit and processed >= detail_limit:
            break

    return {"modernizationPrioritiesCounts": dict(mod_counter)}

# ─────── CLI Entrypoint ───────── #

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Enumerate modernizationPriorities from DSIP API"
    )
    parser.add_argument('--page-limit',   type=int, default=5,
                        help="Pages to scan for topics (0=all)")
    parser.add_argument('--detail-limit', type=int, default=50,
                        help="Detail calls to make (0=all)")
    parser.add_argument('--status',       type=int, nargs='*', default=[],
                        help="Filter by topicStatus codes, e.g. 591 for Open")
    parser.add_argument('--output',       type=str,
                        help="Optional JSON file path for output")
    args = parser.parse_args()

    results = discover_modernization(
        args.page_limit, args.detail_limit, args.status
    )
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        logging.info(f"Wrote modernization counts to {args.output}")
    else:
        print(json.dumps(results, indent=2))