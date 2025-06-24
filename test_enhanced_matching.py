#!/usr/bin/env python3
"""Demonstrate enhanced AI matching with questionnaire responses"""

import json
from typing import Dict, List, Any

def load_questionnaire():
    """Load the questionnaire structure"""
    with open('data/ime_onboarding_questions.json', 'r') as f:
        return json.load(f)

def create_sample_profile_responses():
    """Create sample responses for different company profiles"""
    return [
        {
            "company": "TechDefense Corp",
            "responses": {
                "technical_capabilities": {
                    "primary_tech_areas": ["ai_ml", "cybersecurity", "autonomy"],
                    "secondary_tech_areas": ["sensors", "data_analytics"]
                },
                "agency_experience": {
                    "agencies_worked_with": ["army", "darpa", "air_force"],
                    "contract_types": ["sbir_phase1", "sbir_phase2", "other_rd"]
                },
                "business_preferences": {
                    "preferred_contract_size": "250k_plus",
                    "risk_tolerance": "aggressive",
                    "timeline_preference": "long"
                },
                "team_capabilities": {
                    "clearance_level": "secret",
                    "facility_clearance": "yes",
                    "certifications": ["iso9001", "nist_800_171", "cmmi"]
                },
                "innovation_profile": {
                    "innovation_areas": ["novel_algorithms", "proprietary_tech"],
                    "competitive_advantages": "Proprietary AI algorithms for real-time threat detection"
                }
            }
        },
        {
            "company": "NanoMaterials Inc",
            "responses": {
                "technical_capabilities": {
                    "primary_tech_areas": ["materials", "manufacturing", "energy"],
                    "secondary_tech_areas": ["sensors"]
                },
                "agency_experience": {
                    "agencies_worked_with": ["air_force", "navy", "nasa"],
                    "contract_types": ["sbir_phase1", "sttr"]
                },
                "business_preferences": {
                    "preferred_contract_size": "150k_250k",
                    "risk_tolerance": "moderate",
                    "timeline_preference": "medium"
                },
                "team_capabilities": {
                    "clearance_level": "public_trust",
                    "facility_clearance": "no",
                    "certifications": ["iso9001", "as9100"]
                },
                "innovation_profile": {
                    "innovation_areas": ["proprietary_tech", "cost_reduction"],
                    "competitive_advantages": "Novel nanomaterial synthesis process reducing costs by 60%"
                }
            }
        },
        {
            "company": "StartupRobotics",
            "responses": {
                "technical_capabilities": {
                    "primary_tech_areas": ["autonomy", "software", "modeling_sim"],
                    "secondary_tech_areas": ["ai_ml"]
                },
                "agency_experience": {
                    "agencies_worked_with": ["none"],
                    "contract_types": ["none"]
                },
                "business_preferences": {
                    "preferred_contract_size": "under_150k",
                    "risk_tolerance": "conservative",
                    "timeline_preference": "short"
                },
                "team_capabilities": {
                    "clearance_level": "none",
                    "facility_clearance": "no",
                    "certifications": ["none"]
                },
                "innovation_profile": {
                    "innovation_areas": ["novel_algorithms", "speed_efficiency"],
                    "competitive_advantages": "Fresh perspective with cutting-edge academic research"
                }
            }
        }
    ]

def calculate_enhanced_match_score(profile_responses: Dict, opportunity: Dict, weights: Dict) -> Dict:
    """Calculate match score using questionnaire responses"""
    
    scores = {
        "technical_alignment": 0,
        "experience_match": 0,
        "risk_tolerance": 0,
        "budget_fit": 0,
        "strategic_value": 0,
        "competitive_advantage": 0
    }
    
    # Technical Alignment (35%)
    primary_tech = set(profile_responses["technical_capabilities"]["primary_tech_areas"])
    secondary_tech = set(profile_responses["technical_capabilities"]["secondary_tech_areas"])
    
    # Check if opportunity keywords match tech areas
    opp_keywords = opportunity.get("keywords", [])
    primary_matches = len([k for k in opp_keywords if any(t in k.lower() for t in primary_tech)])
    secondary_matches = len([k for k in opp_keywords if any(t in k.lower() for t in secondary_tech)])
    
    scores["technical_alignment"] = min(1.0, (primary_matches * 0.3 + secondary_matches * 0.1))
    
    # Experience Match (25%)
    agencies = profile_responses["agency_experience"]["agencies_worked_with"]
    if opportunity["agency"].lower() in [a.replace("_", " ") for a in agencies]:
        scores["experience_match"] = 0.8
    elif "none" not in agencies:
        scores["experience_match"] = 0.4
    else:
        scores["experience_match"] = 0.1
    
    # Risk Tolerance (15%)
    risk_map = {"conservative": 0.3, "moderate": 0.6, "aggressive": 0.9}
    risk_score = risk_map.get(profile_responses["business_preferences"]["risk_tolerance"], 0.5)
    scores["risk_tolerance"] = risk_score
    
    # Budget Fit (10%)
    pref_size = profile_responses["business_preferences"]["preferred_contract_size"]
    opp_budget = opportunity.get("budget", 250000)
    
    if pref_size == "any":
        scores["budget_fit"] = 1.0
    elif pref_size == "under_150k" and opp_budget < 150000:
        scores["budget_fit"] = 1.0
    elif pref_size == "150k_250k" and 150000 <= opp_budget <= 250000:
        scores["budget_fit"] = 1.0
    elif pref_size == "250k_plus" and opp_budget > 250000:
        scores["budget_fit"] = 1.0
    else:
        scores["budget_fit"] = 0.5
    
    # Strategic Value (10%)
    innovations = profile_responses["innovation_profile"]["innovation_areas"]
    scores["strategic_value"] = min(1.0, len(innovations) * 0.3)
    
    # Competitive Advantage (5%)
    clearance = profile_responses["team_capabilities"]["clearance_level"]
    if clearance in ["secret", "top_secret", "ts_sci"]:
        scores["competitive_advantage"] = 0.8
    else:
        scores["competitive_advantage"] = 0.3
    
    # Calculate weighted total
    total_score = (
        scores["technical_alignment"] * 0.35 +
        scores["experience_match"] * 0.25 +
        scores["risk_tolerance"] * 0.15 +
        scores["budget_fit"] * 0.10 +
        scores["strategic_value"] * 0.10 +
        scores["competitive_advantage"] * 0.05
    )
    
    return {
        "total_score": total_score,
        "scores": scores,
        "recommendation": get_recommendation(total_score),
        "confidence": "high" if len(agencies) > 2 else "medium"
    }

def get_recommendation(score: float) -> str:
    """Get recommendation based on score"""
    if score >= 0.8:
        return "Highly Recommended - Excellent match!"
    elif score >= 0.6:
        return "Recommended - Good opportunity"
    elif score >= 0.4:
        return "Conditional - Worth considering"
    else:
        return "Not Recommended - Poor fit"

def main():
    """Demonstrate enhanced matching with questionnaire data"""
    print("Enhanced AI Matching with Questionnaire Responses")
    print("=" * 60)
    
    # Load questionnaire
    questionnaire = load_questionnaire()
    weights = questionnaire["scoring_weights"]
    
    # Sample opportunities
    opportunities = [
        {
            "id": "A24-001",
            "title": "AI-Powered Threat Detection for Autonomous Systems",
            "agency": "Army",
            "budget": 275000,
            "keywords": ["ai", "ml", "cybersecurity", "autonomous", "threat detection"],
            "complexity": "high"
        },
        {
            "id": "AF24-087",
            "title": "Advanced Nanomaterials for Hypersonic Applications",
            "agency": "Air Force",
            "budget": 250000,
            "keywords": ["materials", "nanomaterials", "hypersonic", "thermal protection"],
            "complexity": "high"
        },
        {
            "id": "N24-042",
            "title": "Small UAS Navigation Without GPS",
            "agency": "Navy",
            "budget": 150000,
            "keywords": ["autonomy", "navigation", "robotics", "software"],
            "complexity": "medium"
        }
    ]
    
    # Test each profile
    profiles = create_sample_profile_responses()
    
    for profile in profiles:
        print(f"\n\nCompany: {profile['company']}")
        print("-" * 40)
        
        # Show key characteristics
        responses = profile['responses']
        print(f"Primary Tech: {', '.join(responses['technical_capabilities']['primary_tech_areas'])}")
        print(f"Experience: {', '.join(responses['agency_experience']['agencies_worked_with'])}")
        print(f"Risk Profile: {responses['business_preferences']['risk_tolerance']}")
        
        print("\nOpportunity Matches:")
        
        matches = []
        for opp in opportunities:
            result = calculate_enhanced_match_score(responses, opp, weights)
            matches.append({
                "opportunity": opp,
                "result": result
            })
        
        # Sort by score
        matches.sort(key=lambda x: x['result']['total_score'], reverse=True)
        
        for match in matches:
            opp = match['opportunity']
            result = match['result']
            score_pct = result['total_score'] * 100
            
            print(f"\n  {opp['id']}: {opp['title']}")
            print(f"    Score: {score_pct:.1f}% - {result['recommendation']}")
            print(f"    Confidence: {result['confidence']}")
            
            # Show score breakdown
            print("    Breakdown:")
            for factor, score in result['scores'].items():
                print(f"      - {factor}: {score:.2f}")

if __name__ == "__main__":
    main()