# Quick Start Guide - Defense Contract Intelligence Platform

Get up and running with the AI-powered opportunity analysis engine in minutes.

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone https://github.com/m4ndolore/misfits_scraper.git
cd misfits_scraper

# Install backend dependencies
npm install

# Install frontend dependencies  
cd frontend && npm install && cd ..

# Setup Python environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Install Playwright browsers
npx playwright install
```

### 2. Start Development Servers
```bash
# Terminal 1: Start backend (includes AI engine)
npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **AI Analysis**: http://localhost:3001/api/analysis-status

## 🧪 Test the AI Engine

### Run Complete Test Suite
```bash
node ai/test/testAnalysis.js
```

**Expected Output:**
```
✅ Opportunity Analysis: PASSED (3/3 opportunities analyzed)
✅ Matching Engine: PASSED (Scores: 0.83, 0.76, 0.58)  
✅ API Compatibility: PASSED (Valid JSON structure)

🎉 ALL TESTS PASSED! The Analysis Engine is ready for integration.
```

### Test Individual API Endpoints

**1. Analyze Opportunities**
```bash
curl -X POST http://localhost:3001/api/analyze-opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "opportunities": [
      {
        "topicId": "TEST001",
        "topicCode": "A24-001", 
        "topicTitle": "AI for Autonomous Systems",
        "component": "ARMY",
        "objective": "Develop machine learning algorithms for autonomous navigation"
      }
    ]
  }'
```

**2. Match Against Business Profile**
```bash
curl -X POST http://localhost:3001/api/match-opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "opportunities": [/* opportunity data */],
    "businessProfile": {
      "companyInfo": { "name": "Test Company", "size": "small" },
      "capabilities": { "technicalAreas": ["AI/ML", "Software Development"] },
      "preferences": { "agencyPreferences": ["ARMY"], "riskTolerance": "medium" }
    }
  }'
```

**3. Get Market Insights**
```bash
curl -X POST http://localhost:3001/api/market-insights \
  -H "Content-Type: application/json" \
  -d '{ "opportunities": [/* opportunity data */] }'
```

## 🔍 Using the Current System

### 1. Search for Opportunities
- Open http://localhost:5173
- Use the search bar to find SBIR/STTR opportunities
- Apply filters by agency, technology area, or status
- Use advanced filters for precise targeting

### 2. Analyze Opportunities
The AI engine automatically analyzes opportunities for:
- **Technical Requirements**: What capabilities are needed
- **Difficulty Score**: Complexity rating (1-10)
- **Competition Level**: Expected competition (low/medium/high)
- **Risk Factors**: Security clearance, regulatory requirements
- **Budget Indicators**: Estimated funding levels

### 3. Export and Download
- Select opportunities of interest
- Download PDFs with full opportunity details
- Export filtered lists for further analysis

## 🔗 iME Integration (Pending)

### Current Status
- **✅ AI Engine**: Production ready
- **✅ API Endpoints**: Fully implemented
- **✅ Requirements Doc**: Delivered to iME team
- **🔄 Integration**: Awaiting iME business profile API

### When iME Integration is Complete
1. **Personalized Matching**: Opportunities will be scored against your company profile
2. **Smart Recommendations**: AI will suggest best-fit opportunities
3. **Strategic Insights**: Market analysis based on your capabilities
4. **Competitive Intelligence**: Identify your advantages for each opportunity

## 🛠 Development Workflow

### Adding New Features

1. **Opportunity Analysis Enhancements**
   - Edit `ai/services/opportunityAnalyzer.js`
   - Add new analysis functions
   - Update test cases in `ai/test/testAnalysis.js`

2. **Matching Algorithm Improvements**
   - Modify `ai/services/matchingEngine.js`
   - Adjust scoring weights or add new factors
   - Test with sample business profiles

3. **New API Endpoints**
   - Add routes to `ai/routes/analysisRoutes.js`
   - Follow existing pattern for error handling
   - Update API documentation

### Testing Your Changes
```bash
# Test AI engine
node ai/test/testAnalysis.js

# Test frontend
cd frontend && npm run lint

# Test full application
npm run dev  # Start backend
cd frontend && npm run dev  # Start frontend
```

### Committing Changes
```bash
git add .
git commit -m "feature: your enhancement description"
git push
```

## 📚 Key Files to Know

### Core AI Engine
- `ai/services/opportunityAnalyzer.js` - Main analysis engine
- `ai/services/matchingEngine.js` - Business profile matching
- `ai/routes/analysisRoutes.js` - API endpoints

### Frontend Components  
- `frontend/src/App.tsx` - Main application component
- `frontend/src/components/TopicsTable.tsx` - Opportunity display
- `frontend/src/components/FilterPanel.tsx` - Advanced filtering

### Configuration
- `server.js` - Backend server with AI routes
- `package.json` - Dependencies and scripts
- `CLAUDE.md` - Developer guidance
- `docs/iME-API-Requirements.md` - Integration specifications

## 🆘 Troubleshooting

### Common Issues

**AI Tests Failing**
```bash
# Clear analysis cache
curl -X DELETE http://localhost:3001/api/clear-cache

# Check service status
curl http://localhost:3001/api/analysis-status
```

**Frontend Not Loading**
- Ensure backend is running on port 3001
- Check CORS configuration in `server.js`
- Verify frontend dependencies: `cd frontend && npm install`

**Python Script Issues**
- Activate virtual environment: `source venv/bin/activate`
- Install missing dependencies: `pip install -r requirements.txt`
- Update Playwright: `npx playwright install`

### Getting Help

1. **Check Documentation**: Review `CLAUDE.md` and API requirements
2. **Run Tests**: Use `node ai/test/testAnalysis.js` to validate system
3. **Check Logs**: Backend logs show detailed error information
4. **Review Code**: AI engine is well-commented for understanding

## 🎯 Next Steps

1. **Explore the UI**: Familiarize yourself with the opportunity browser
2. **Test AI Features**: Run analysis on sample opportunities  
3. **Review iME Requirements**: Understand the integration roadmap
4. **Plan Enhancements**: Consider UI improvements for displaying AI insights

The system is production-ready for opportunity analysis and awaiting iME integration for personalized matching. Start exploring and building on this foundation!