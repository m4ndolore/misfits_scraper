# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Development Commands

### Backend Development
- `node server.js` - Start the Express backend server (port 3000)
- `npm run dev` - Same as above, alias for development
- `npm run start` - Production server start

### Frontend Development  
- `cd frontend && npm run dev` - Start Vite development server (port 5173/5174)
- `cd frontend && npm run build` - Build React app for production
- `cd frontend && npm run preview` - Preview production build

### Python Environment
- `source venv/bin/activate` - Activate Python virtual environment
- `pip install -r requirements.txt` - Install Python dependencies
- `python script.py --topic <TOPIC_CODE>` - Run main scraping script
- `python discover_filters.py` - Discover available filters
- `python discover_mod_ids.py` - Discover module IDs

### AI Analysis Testing
- `node ai/test/testAnalysis.js` - Run complete AI analysis test suite
- `curl http://localhost:3000/api/analysis-status` - Check AI engine health

## Key Development Notes

### Frontend Updates
- When updating App.tsx, ensure the API_BASE_URL matches the backend port (currently 3000)
- Download progress now shows individual file status (official PDF and details PDF)
- CORS is configured for ports 5173 and 5174

### Backend Notes
- Server binds to localhost:3000 by default
- AI analysis endpoints are mounted under /api
- Static files served from frontend/dist in production

### Common Issues
- **CORS errors**: Check that frontend port is in allowed origins in server.js
- **Port conflicts**: Ensure no other services are using ports 3000 or 5173/5174
- **PDF downloads failing**: Check backend server is running and accessible

## Architecture Overview

### Frontend (React/TypeScript)
- Single-page app in App.tsx with all components inline
- Uses Material-UI for data tables and Bootstrap for styling
- Context-based state management for filters

### Backend (Node.js/Express)
- RESTful API with CORS enabled
- Integrates Python scraper via child_process
- Serves AI analysis through dedicated routes

### Python Scraping
- Playwright-based browser automation
- Handles dynamic content and authentication
- Outputs JSON data and downloads PDFs

## AI Integration Status

### Completed
- Opportunity analysis with technical requirement extraction
- Multi-factor matching engine with weighted scoring
- Market insights generation
- RESTful API with error handling
- Comprehensive test coverage

### Pending iME Integration
- Awaiting business profile API from iME project
- Profile-based scoring and filtering ready to integrate
- See docs/iME-API-Requirements.md for specifications