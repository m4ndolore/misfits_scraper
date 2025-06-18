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

## AI Integration Roadmap

### Phase 1: Opportunity Matching (Next Development Phase)
- **Business Profile Integration**: Consume business profiles from iME via API
- **Semantic Analysis**: Extract and analyze opportunity requirements using LLM
- **Matching Algorithm**: Score opportunities based on business capabilities and preferences
- **Enhanced UI**: Add match scores, recommendations, and insights to existing interface

### Phase 2: Intelligent Insights
- **Market Analysis**: Identify trending technology areas and budget patterns
- **Competition Assessment**: Analyze historical awards and competition levels
- **Timing Intelligence**: Predict optimal application timing based on agency patterns
- **Risk Assessment**: Evaluate probability of success for each opportunity

### Phase 3: AI Copilot Features
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

### API Endpoints to Implement
- `POST /api/analyze-opportunities` - Analyze opportunities against business profile
- `GET /api/recommendations/:profileId` - Get personalized recommendations
- `POST /api/market-insights` - Generate market analysis reports
- `GET /api/opportunity-scores` - Bulk scoring for opportunity lists