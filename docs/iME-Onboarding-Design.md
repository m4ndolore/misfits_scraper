# iME Onboarding Questionnaire Design

## Overview
This document outlines the onboarding questionnaire for capturing comprehensive business profiles that enable accurate AI-powered opportunity matching.

## Question Categories & AI Mapping

### 1. Technical Capabilities & Expertise
**Purpose**: Core matching factor - aligns companies with relevant technical opportunities

**Questions**:
- Primary technical expertise (up to 5 selections)
- Secondary technical areas (unlimited)

**Options Include**:
- AI/ML, Cybersecurity, Autonomous Systems
- Communications, Sensors, Advanced Materials
- Energy Systems, Quantum Tech, Space Tech
- And 7 more categories

**AI Scoring Impact**: 35% of total match score (Technical Alignment)

### 2. Agency Experience & Past Performance
**Purpose**: Predicts success likelihood with specific agencies

**Questions**:
- Agencies worked with (multi-select)
- Contract types held (SBIR phases, STTR, etc.)

**AI Scoring Impact**: 25% of total match score (Experience Match)

### 3. Business Preferences & Risk Profile
**Purpose**: Matches opportunity complexity to company comfort level

**Questions**:
- Preferred contract size
- Risk tolerance (conservative/moderate/aggressive)
- Timeline preference

**AI Scoring Impact**: 15% of total match score (Risk Tolerance)

### 4. Team & Infrastructure
**Purpose**: Filters opportunities by security and compliance requirements

**Questions**:
- Security clearance levels
- Facility clearance status
- Certifications (ISO, CMMI, NIST, etc.)

**AI Scoring Impact**: Affects multiple scoring factors

### 5. Innovation & Unique Value
**Purpose**: Identifies competitive advantages and strategic fit

**Questions**:
- Key innovation areas (up to 3)
- Competitive advantages (text input)

**AI Scoring Impact**: 15% combined (Strategic Value + Competitive Advantage)

## User Experience Flow

```
1. Welcome Screen
   └─> "Let's build your opportunity profile"

2. Technical Capabilities (Required)
   └─> Multi-select with smart grouping
   └─> Visual chips for selected items

3. Agency Experience (Required)
   └─> Logo-based selection for agencies
   └─> Timeline view for contract history

4. Business Preferences (Required)
   └─> Slider for risk tolerance
   └─> Visual budget ranges

5. Team Capabilities (Required)
   └─> Progressive disclosure for certifications

6. Innovation Profile (Optional)
   └─> Skip option available
   └─> Rich text for advantages

7. Review & Confirm
   └─> Summary view
   └─> Edit any section
   └─> Save profile
```

## Data Structure for Responses

```json
{
  "profileId": "uuid",
  "companyId": "company-uuid",
  "responses": {
    "technical_capabilities": {
      "primary_tech_areas": ["ai_ml", "cybersecurity", "sensors"],
      "secondary_tech_areas": ["software", "data_analytics"]
    },
    "agency_experience": {
      "agencies_worked_with": ["army", "navy", "darpa"],
      "contract_types": ["sbir_phase1", "sbir_phase2"]
    },
    "business_preferences": {
      "preferred_contract_size": "150k_250k",
      "risk_tolerance": "moderate",
      "timeline_preference": "medium"
    },
    "team_capabilities": {
      "clearance_level": "secret",
      "facility_clearance": "yes",
      "certifications": ["iso9001", "nist_800_171"]
    },
    "innovation_profile": {
      "innovation_areas": ["novel_algorithms", "proprietary_tech"],
      "competitive_advantages": "Our ML algorithms reduce processing time by 10x..."
    }
  },
  "completedAt": "2024-01-15T10:30:00Z",
  "scoreWeights": {
    // Inherits from questionnaire scoring_weights
  }
}
```

## Implementation Recommendations

### Frontend Components Needed:
1. **MultiSelectChips**: Visual selection with limits
2. **ProgressIndicator**: Shows questionnaire progress
3. **SmartSuggestions**: Based on previous selections
4. **ProfilePreview**: Real-time preview of matching impact

### Backend Requirements:
1. **Validation API**: Ensure required fields
2. **Scoring Preview**: Show how selections affect matching
3. **Profile Storage**: Save to iME database
4. **Analytics**: Track common selections for insights

### AI Integration:
- Each response directly maps to our 6-factor scoring model
- Responses are weighted according to `scoring_weights`
- Missing optional data uses conservative defaults
- Profile completeness affects confidence scores

## Next Steps
1. UI/UX mockups for each question type
2. Implement frontend components
3. Create API endpoints for profile submission
4. Update matching engine to use questionnaire data
5. A/B test question ordering and wording