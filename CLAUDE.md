# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
- `node server.js` - Start the Express backend server (port 3001)
- `npm run dev` - Same as above, alias for development
- `npm run start` - Production server start

### Frontend Development  
- `cd frontend && npm run dev` - Start Vite development server (port 5173)
- `cd frontend && npm run build` - Build React app for production
- `cd frontend && npm run lint` - Run ESLint on TypeScript/React code

### Python Environment
- `source venv/bin/activate` - Activate Python virtual environment
- `pip install -r requirements.txt` - Install Python dependencies
- `python script.py --topic <TOPIC_CODE>` - Run main scraping script
- `python discover_filters.py` - Discover available filters
- `python discover_mod_ids.py` - Discover module IDs

### Browser Automation
- `npx playwright install` - Install Playwright browsers
- `python frontend/test.py` - Interactive browser testing script

### AI Analysis Engine
- `node ai/test/testAnalysis.js` - Run complete AI analysis test suite
- `curl http://localhost:3001/api/analysis-status` - Check AI engine health
- `curl -X DELETE http://localhost:3001/api/clear-cache` - Clear analysis cache

## Project Vision

This project is evolving from a DoD SBIR/STTR scraping tool into a comprehensive **AI Copilot for Defense Industry Contract Opportunities**. The system will provide intelligent opportunity matching and insights for defense contractors.

### Strategic Roadmap

**Current State**: DoD SBIR/STTR data extraction and analysis
**Phase 1**: AI-powered opportunity matching using business profiles from iME
**Phase 2**: Intelligent agent with proposal assistance and market insights
**Phase 3**: Comprehensive defense contracting copilot across all contract types

### Integration with iME (Integrated Modernization Environment)

This tool receives business profile data from the adjacent **iME project**, which handles:
- Business profile capture and management
- Company capability databases
- Contractor information and certifications

This project focuses on:
- Opportunity intelligence and analysis
- AI-powered matching algorithms
- Market insights and recommendations
- Proposal assistance (future)

## Architecture Overview

The system consists of three main layers with planned AI integration:

### Frontend (React/TypeScript)
- **Tech Stack**: React 19, TypeScript, Vite, Material-UI, Bootstrap
- **Key Components**: 
  - `TopicsTable.tsx` - Main data display with filtering/sorting
  - `FilterPanel.tsx` - Advanced filtering controls
  - `TopicDetailModal.tsx` - Detailed topic view
  - `PaginationControls.tsx` - Data pagination
- **State Management**: Context API (`FilterContext.tsx`) + custom hooks (`useFilters.ts`)
- **Data Flow**: Frontend calls Express API → Backend executes Python scraping → Results displayed

### Backend (Node.js/Express)
- **Entry Point**: `server.js` - Express server with CORS, serves React build
- **APIs**: RESTful endpoints for triggering scrapes and fetching data
- **Port Configuration**: Backend runs on 3001, frontend dev server on 5173
- **Static Serving**: Serves built React app from `/frontend/dist`

### Python Scraping Layer
- **Main Script**: `script.py` - Playwright-based browser automation
- **Browser Config**: Chromium with minimal flags for Railway deployment
- **Data Sources**: DoD SBIR/STTR topics database at dodsbirsttr.mil
- **Discovery Scripts**: Separate utilities for exploring API endpoints and filters
- **Output**: JSON data files and PDF downloads in `/downloads`

### Data Storage
- **Configuration**: `filters.json` - Available filter options
- **Downloads**: `/downloads` directory for scraped PDFs and data
- **Session State**: Frontend maintains filter/pagination state in context

## Key Development Patterns

### Component Communication
- Props drilling for simple data passing
- Context API for cross-component state (filters, selections)
- Custom hooks for reusable logic (filtering, data fetching)

### Error Handling
- Backend: Express error middleware with detailed logging
- Frontend: Try-catch blocks with user-friendly error messages
- Python: Playwright timeout and retry mechanisms

### Browser Automation Flow
1. Launch Playwright browser with minimal configuration
2. Navigate to DoD SBIR/STTR site
3. Handle dynamic content loading with explicit waits
4. Extract structured data from search results
5. Download PDFs and save metadata

### Performance Considerations
- Frontend pagination to handle large datasets
- Backend rate limiting for API calls
- Python script uses single browser instance with context reuse
- Minimal Playwright browser flags for cloud deployment

## AI Analysis Engine Status

### ✅ COMPLETED: Phase 1 - Opportunity Analysis & Matching Engine

**Core AI Services Implemented:**
- **OpportunityAnalyzer**: AI-powered semantic analysis extracting technical requirements, difficulty scoring (1-10), competition assessment, and risk identification
- **MatchingEngine**: Multi-factor scoring algorithm with 6 weighted components:
  - Technical Alignment (35%): Capability-requirement matching
  - Experience Match (25%): Past performance and agency history
  - Risk Tolerance (15%): Company risk comfort vs opportunity complexity
  - Budget Fit (10%): Financial capacity alignment
  - Strategic Value (10%): Alignment with business goals
  - Competitive Advantage (5%): Unique positioning factors

**Production-Ready Features:**
- Batch opportunity analysis with caching
- Personalized scoring against business profiles
- Market insights generation with trend analysis
- RESTful API endpoints with error handling
- Comprehensive test suite (all tests passing)

### 🔄 IN PROGRESS: iME Integration
- **API Requirements**: Complete specification document delivered
- **Data Models**: Business profile schema with priority levels defined
- **Test Data**: Sample profiles and validation scripts ready
- **Status**: Awaiting iME API implementation

### 📋 NEXT: Phase 2 - Enhanced Intelligence
- **LLM Integration**: Replace rule-based analysis with GPT/Claude API
- **Historical Data**: Integrate award databases for competition analysis
- **Predictive Analytics**: Timeline optimization and success probability modeling
- **UI Enhancement**: Display match scores and insights in existing interface

### 🚀 FUTURE: Phase 3 - AI Copilot Features  
- **Proposal Assistance**: AI-guided proposal development
- **Strategic Planning**: Long-term opportunity pipeline recommendations
- **Network Analysis**: Identify potential teaming partners
- **Compliance Checking**: Automated requirement validation

## Data Integration Points

### Input from iME
```typescript
interface BusinessProfileInput {
  companyInfo: CompanyDetails
  capabilities: TechnicalCapabilities
  preferences: ContractPreferences
  pastPerformance: ContractHistory[]
}
```

### Enhanced Opportunity Data
```typescript
interface EnhancedOpportunity {
  // Existing SBIR/STTR data
  ...existingFields
  
  // AI-generated insights
  matchScore: number
  technicalAlignment: string[]
  competitionLevel: 'low' | 'medium' | 'high'
  recommendationReason: string
  riskFactors: string[]
}
```

### ✅ IMPLEMENTED API Endpoints
- `POST /api/analyze-opportunities` - AI analysis of opportunity requirements and risks
- `POST /api/match-opportunities` - Score opportunities against business profiles  
- `POST /api/analyze-single` - Analyze individual opportunity with AI insights
- `POST /api/market-insights` - Generate market trend analysis and recommendations
- `GET /api/analysis-status` - Health check and cache status monitoring
- `DELETE /api/clear-cache` - Clear analysis cache for fresh processing

### 🔄 PENDING iME Integration Endpoints
- `GET /api/recommendations/:profileId` - Get personalized recommendations (requires iME profile API)
- Profile-specific scoring and filtering (awaiting business profile data)

## AI Analysis Testing

### Test Results Summary
```
✅ Opportunity Analysis: PASSED (3/3 opportunities analyzed)
✅ Matching Engine: PASSED (Scores: 0.83, 0.76, 0.58)  
✅ API Compatibility: PASSED (Valid JSON structure)

Sample Results:
- Army AI Navigation (A24-001): 83% match - Highly Recommended
- Air Force Materials (AF24-087): 76% match - Recommended  
- Navy Cybersecurity (N24-042): 58% match - Conditional
```

### Running Tests
```bash
# Run complete AI analysis test suite
node ai/test/testAnalysis.js

# Test individual components
node -e "require('./ai/services/opportunityAnalyzer').test()"
```

## iME Integration Requirements

### Priority 1: Critical Data for Basic Matching
- Company technical capabilities and certifications
- Past performance history with DoD agencies
- Business preferences (agencies, budget, risk tolerance)

### Priority 2: Enhanced Matching Data  
- Key personnel and security clearances
- Unique capabilities and competitive advantages
- Strategic focus areas and business goals

### Required iME API Endpoints
```
GET  /api/business-profiles/{id}        - Single profile retrieval
POST /api/business-profiles/search     - Profile discovery and filtering
GET  /api/business-profiles/{id}/capabilities - Quick capability summary
POST /api/business-profiles/batch      - Bulk profile retrieval
```

**Documentation**: See `docs/iME-API-Requirements.md` for complete specification