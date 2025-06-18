# iME API Requirements for Opportunity Matching

This document outlines the specific API requirements that the iME (Integrated Modernization Environment) project must provide to enable effective opportunity matching and AI-powered insights in the Defense Contract Intelligence Platform.

## Overview

The Defense Contract Intelligence Platform requires detailed business profile data to perform accurate opportunity matching. This data will be consumed via API calls to the iME system, which serves as the source of truth for contractor profiles and capabilities.

## Required API Endpoints

### 1. Business Profile Retrieval

#### Primary Endpoint
```http
GET /api/business-profiles/{profileId}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "companyInfo": { /* Company details */ },
    "capabilities": { /* Technical capabilities */ },
    "preferences": { /* Business preferences */ },
    "teamInfo": { /* Team and personnel */ },
    "financialInfo": { /* Financial information */ },
    "metadata": { /* Profile metadata */ }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Batch Retrieval
```http
POST /api/business-profiles/batch
Body: { "profileIds": ["id1", "id2", "id3"] }
```

### 2. Profile Search and Discovery

```http
POST /api/business-profiles/search
Body: {
  "filters": {
    "technicalAreas": ["AI/ML", "Cybersecurity"],
    "companySize": ["small", "medium"],
    "agencyExperience": ["ARMY", "NAVY"]
  },
  "limit": 50,
  "offset": 0
}
```

### 3. Capabilities Summary

```http
GET /api/business-profiles/{profileId}/capabilities
```

Used for quick capability checks without full profile data.

## Critical Data Requirements

### 1. Company Information (CRITICAL)

```json
{
  "companyInfo": {
    "id": "unique-company-id",
    "name": "Company Legal Name",
    "size": "small|medium|large",
    "cageCode": "12345",
    "securityClearance": ["Secret", "Top Secret"],
    "socioeconomicStatus": ["8(a)", "WOSB", "HUBZone"]
  }
}
```

**Why Critical:** Used for basic eligibility and opportunity filtering.

### 2. Technical Capabilities (CRITICAL)

```json
{
  "capabilities": {
    "technicalAreas": [
      "Artificial Intelligence",
      "Machine Learning", 
      "Cybersecurity",
      "Software Development",
      "Data Analytics"
    ],
    "certifications": [
      "ISO 9001",
      "CMMI Level 3", 
      "ITAR Registered",
      "FedRAMP Authorized"
    ],
    "uniqueCapabilities": [
      "Real-time edge AI processing",
      "Quantum-resistant cryptography"
    ]
  }
}
```

**Why Critical:** Primary matching criteria for technical alignment scoring.

### 3. Past Performance (CRITICAL)

```json
{
  "capabilities": {
    "pastPerformance": [
      {
        "contractNumber": "W911NF-21-C-0001",
        "agency": "ARMY",
        "contractType": "SBIR Phase II",
        "programName": "AI for Logistics",
        "value": 1500000,
        "startDate": "2021-06-01",
        "endDate": "2023-05-31", 
        "status": "Completed",
        "performanceRating": "Excellent",
        "technologyAreas": ["AI/ML", "Logistics"],
        "role": "Prime"
      }
    ]
  }
}
```

**Why Critical:** Used for experience matching and credibility scoring.

### 4. Business Preferences (CRITICAL)

```json
{
  "preferences": {
    "contractTypes": ["SBIR", "STTR", "Prime Contract"],
    "agencyPreferences": ["ARMY", "NAVY", "DARPA"],
    "budgetRange": {
      "min": 100000,
      "max": 5000000
    },
    "riskTolerance": "medium",
    "strategicFocus": [
      "AI Innovation",
      "Defense Modernization"
    ]
  }
}
```

**Why Critical:** Drives personalized recommendations and filtering.

## High Priority Data Requirements

### 1. Team Information

```json
{
  "teamInfo": {
    "keyPersonnel": [
      {
        "name": "Dr. Jane Smith",
        "role": "Principal Investigator", 
        "education": ["PhD Computer Science - MIT"],
        "securityClearance": "Secret",
        "expertise": ["Machine Learning", "Computer Vision"]
      }
    ],
    "availableCapacity": {
      "fullTimeEquivalents": 5.5,
      "canHireAdditional": true
    }
  }
}
```

### 2. Technology Stack Details

```json
{
  "capabilities": {
    "technologyStack": {
      "programmingLanguages": ["Python", "Java", "C++"],
      "frameworks": ["TensorFlow", "React", "Spring"],
      "platforms": ["AWS", "Azure", "Kubernetes"],
      "tools": ["Jenkins", "Docker", "JIRA"]
    }
  }
}
```

## Medium Priority Data Requirements

### 1. Geographic and Operational

```json
{
  "preferences": {
    "geographicFocus": ["Virginia", "California", "Texas"],
    "internationalCapability": true
  }
}
```

### 2. Financial Capacity

```json
{
  "financialInfo": {
    "annualRevenue": 2500000,
    "governmentRevenuePercentage": 65,
    "cashFlow": {
      "sufficient": true,
      "bondingCapacity": 10000000
    }
  }
}
```

## API Quality Requirements

### 1. Performance Standards
- **Response Time**: < 500ms for single profile retrieval
- **Availability**: 99.5% uptime during business hours
- **Rate Limiting**: Support 100 requests/minute per API key

### 2. Data Quality Standards
- **Completeness**: Profiles should have >80% of critical fields populated
- **Currency**: Data updated within 90 days
- **Validation**: All standardized fields (agencies, tech areas) use controlled vocabularies

### 3. Security Requirements
- **Authentication**: API key or OAuth 2.0
- **Authorization**: Role-based access to profile data
- **Encryption**: TLS 1.3 for data in transit
- **Audit**: Log all API access for compliance

## Standardized Data Taxonomies

### Technical Areas (Must Use Standardized List)
```
- Artificial Intelligence
- Machine Learning  
- Cybersecurity
- Software Development
- Data Analytics
- Cloud Computing
- Hardware Development
- Communications
- Simulation & Modeling
- Autonomous Systems
```

### Agency Codes (Must Use DoD Standard)
```
- ARMY
- NAVY  
- USAF
- DARPA
- DLA
- DHA
- MDA
- SOCOM
- OSD
```

### Contract Types (Must Use Standard)
```
- SBIR Phase I
- SBIR Phase II
- STTR Phase I  
- STTR Phase II
- Prime Contract
- Subcontract
```

## Integration Testing Requirements

### 1. Test Data Sets
iME should provide test profiles with:
- Complete data across all priority levels
- Partial data to test error handling
- Edge cases (new companies, international firms, etc.)

### 2. API Documentation
- OpenAPI/Swagger specification
- Code examples in multiple languages
- Error response documentation
- Rate limiting and pagination details

### 3. Sandbox Environment
- Non-production API endpoint for testing
- Realistic but anonymized test data
- Same authentication/authorization as production

## Implementation Priority

### Phase 1 (Immediate Need)
1. Basic profile retrieval endpoint
2. Critical data fields only
3. Simple authentication

### Phase 2 (Next 30 days)
1. Search and filtering capabilities
2. High priority data fields
3. Batch operations

### Phase 3 (Next 60 days)
1. Complete data model
2. Advanced search features
3. Real-time updates/webhooks

## Success Metrics

### For iME Team
- API uptime > 99.5%
- Average response time < 500ms
- Data completeness > 80% for critical fields

### For Integration Success
- Accurate opportunity matching scores (>85% relevance)
- User satisfaction with recommendations
- Reduced time to identify relevant opportunities

## Questions for iME Team

1. **Current Data Model**: How closely does your existing profile structure match our requirements?

2. **API Framework**: What technology stack are you using for API development?

3. **Authentication**: Do you have existing authentication systems we should integrate with?

4. **Data Validation**: Do you currently validate data against standardized taxonomies?

5. **Timeline**: What's your expected timeline for implementing these API endpoints?

6. **Capacity**: How many API calls per day do you anticipate handling?

## Next Steps

1. **Review Requirements**: iME team reviews this document
2. **Gap Analysis**: Identify what data is already captured vs. what needs to be added
3. **API Design**: Create detailed API specification
4. **Development Planning**: Prioritize endpoint development
5. **Testing Strategy**: Plan integration testing approach
6. **Go-Live Plan**: Coordinate deployment and monitoring

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Next Review**: 2024-02-01