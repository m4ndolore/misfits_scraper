#!/usr/bin/env python3
"""Test AI matching engine with real business profiles from Airtable"""

import json
import requests
import random
from typing import List, Dict, Any

def load_business_profiles() -> List[Dict[str, Any]]:
    """Load business profiles from iME format file"""
    with open('data/ime_business_profiles.json', 'r') as f:
        return json.load(f)

def load_sample_opportunities() -> List[Dict[str, Any]]:
    """Load some sample SBIR opportunities for testing"""
    # These are test opportunities - in production would come from the scraper
    return [
        {
            "id": "A24-001",
            "topic_number": "A24-001",
            "title": "AI-Powered Navigation Systems for Autonomous Vehicles",
            "agency": "Army",
            "description": "Develop AI algorithms for real-time navigation in GPS-denied environments",
            "technical_poc": "Dr. Smith",
            "budget": 250000,
            "phase": "Phase I"
        },
        {
            "id": "AF24-087", 
            "topic_number": "AF24-087",
            "title": "Advanced Materials for Hypersonic Applications",
            "agency": "Air Force",
            "description": "Research novel materials that can withstand extreme temperatures and pressures",
            "technical_poc": "Col. Johnson",
            "budget": 300000,
            "phase": "Phase I"
        },
        {
            "id": "N24-042",
            "topic_number": "N24-042",
            "title": "Cybersecurity for Naval Control Systems",
            "agency": "Navy",
            "description": "Develop secure communication protocols for shipboard control systems",
            "technical_poc": "LCDR Williams",
            "budget": 275000,
            "phase": "Phase I"
        }
    ]

def test_matching_engine(profiles: List[Dict[str, Any]], opportunities: List[Dict[str, Any]]):
    """Test the AI matching engine with real profiles"""
    
    # Select a few random profiles for testing
    test_profiles = random.sample(profiles, min(5, len(profiles)))
    
    print("Testing AI Matching Engine with Real Business Profiles")
    print("=" * 60)
    
    for i, profile in enumerate(test_profiles):
        print(f"\nProfile {i+1}: {profile['companyInfo']['name']} ({profile['companyInfo']['organization']})")
        print(f"  Type: {profile['companyInfo']['type']}")
        print(f"  Team Size: {profile['companyInfo']['teamSize']}")
        print(f"  Technical Maturity: {profile['capabilities']['technicalMaturity']}")
        print(f"  Timeline: {profile['capabilities']['productionTimeline']}")
        
        # Call the matching API
        print("\n  Matching with opportunities...")
        
        try:
            response = requests.post(
                'http://localhost:3000/api/match-opportunities',
                json={
                    'businessProfile': profile,
                    'opportunities': opportunities
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print("\n  Match Results:")
                if 'error' in result:
                    print(f"  Error: {result['error']}")
                elif 'success' in result and result['success']:
                    matches = result['data']['matches']
                    # Show match summary
                    summary = result['data']['summary']
                    print(f"  Summary: {summary['highlyRecommended']} highly recommended, {summary['recommended']} recommended")
                    
                    # The API returns match scores without opportunity details
                    # Let's show the scores with opportunity indices
                    for i, match in enumerate(matches[:3]):
                        score_pct = match['overallScore'] * 100
                        opp = opportunities[i] if i < len(opportunities) else {'topic_number': f'Opp{i+1}', 'title': 'Unknown'}
                        print(f"\n    - {opp['topic_number']}: {opp['title']}")
                        print(f"      Score: {score_pct:.1f}% - {match['recommendation']['level']}")
                        print(f"      Action: {match['recommendation']['action']}")
                        if match['reasoning']:
                            print(f"      Reason: {match['reasoning'][0]}")
            else:
                print(f"  API Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("  Error: Could not connect to API server at localhost:3000")
            print("  Make sure the server is running: node server.js")
            break
        except Exception as e:
            print(f"  Error: {type(e).__name__}: {str(e)}")

def test_market_insights(profiles: List[Dict[str, Any]]):
    """Test market insights generation"""
    print("\n\n" + "=" * 60)
    print("Testing Market Insights Generation")
    print("=" * 60)
    
    # Get a profile with prototype maturity
    prototype_profiles = [p for p in profiles if p['capabilities']['technicalMaturity'] == 'Prototype']
    if prototype_profiles:
        test_profile = prototype_profiles[0]
        
        print(f"\nGenerating insights for: {test_profile['companyInfo']['name']}")
        
        try:
            response = requests.post(
                'http://localhost:3000/api/market-insights',
                json={
                    'businessProfile': test_profile,
                    'marketData': {
                        'recentAwards': 150,
                        'averageCompetition': 12,
                        'successRate': 0.15
                    }
                }
            )
            
            if response.status_code == 200:
                insights = response.json()
                print("\nMarket Insights:")
                print(f"  Trends: {', '.join(insights['trends'][:3])}")
                print(f"  Opportunities: {', '.join(insights['opportunities'][:3])}")
                print(f"  Risks: {', '.join(insights['risks'][:3])}")
                print(f"\n  Recommendations:")
                for rec in insights['recommendations'][:3]:
                    print(f"    - {rec}")
            else:
                print(f"API Error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to API server")
        except Exception as e:
            print(f"Error: {type(e).__name__}: {str(e)}")

def main():
    """Main test function"""
    print("Loading business profiles from Airtable...")
    profiles = load_business_profiles()
    print(f"Loaded {len(profiles)} profiles")
    
    print("\nLoading sample opportunities...")
    opportunities = load_sample_opportunities()
    print(f"Loaded {len(opportunities)} opportunities")
    
    # Test matching
    test_matching_engine(profiles, opportunities)
    
    # Test market insights
    test_market_insights(profiles)
    
    print("\n\nTesting complete!")

if __name__ == "__main__":
    main()