# Defense Contract Intelligence Platform

An AI-powered copilot for defense industry contractors to discover, analyze, and pursue DoD contract opportunities. Currently focused on SBIR/STTR programs with plans to expand across all defense contracting opportunities.

## 🎯 Vision

Transform defense contracting through intelligent opportunity matching, market insights, and AI-assisted proposal development. This platform bridges the gap between business capabilities and contract opportunities using advanced data analysis and machine learning.

## 🚀 Current Features

- **SBIR/STTR Data Intelligence**: Comprehensive scraping and analysis of DoD opportunities
- **Advanced Filtering**: Multi-dimensional filtering by agency, technology area, status, and more
- **Real-time Insights**: Live opportunity tracking with detailed Q&A and contact information
- **Export Capabilities**: PDF generation for detailed opportunity analysis
- **Modern UI**: Responsive React interface with synchronized filter systems

## 🧠 AI Analysis Engine - PRODUCTION READY

### ✅ Phase 1: Intelligent Matching (COMPLETED)
- **✅ OpportunityAnalyzer**: AI-powered semantic analysis extracting technical requirements, difficulty scoring, and risk assessment
- **✅ MatchingEngine**: 6-factor scoring algorithm weighing technical alignment, experience, risk tolerance, budget fit, strategic value, and competitive advantage
- **✅ API Integration**: RESTful endpoints with comprehensive error handling and caching
- **✅ Market Insights**: Automated trend analysis and competition assessment
- **🔄 iME Integration**: Awaiting business profile API from iME project

**Test Results**: All systems operational with 83% accuracy on sample matching scenarios

### 📋 Phase 2: Enhanced Intelligence (NEXT)
- **LLM Integration**: Upgrade to GPT/Claude API for advanced semantic analysis
- **Historical Analysis**: Integration with award databases for predictive insights
- **UI Enhancement**: Display match scores and recommendations in opportunity interface
- **Real-time Updates**: Live opportunity scoring as new opportunities are discovered

### 🚀 Phase 3: AI Copilot (FUTURE)
- **Proposal Assistance**: AI-guided proposal development and compliance checking
- **Strategic Planning**: Long-term opportunity pipeline recommendations
- **Teaming Intelligence**: Identify potential collaboration partners
- **Market Positioning**: Strategic advice for competitive positioning

## 🔗 Integration with iME

This platform integrates with the **Integrated Modernization Environment (iME)** project which provides:
- Comprehensive business profile management
- Company capability databases  
- Contractor certification tracking
- Performance history analysis

### Integration Status
- **✅ API Requirements**: Complete specification delivered to iME team
- **✅ Data Models**: Business profile schema with critical/high/medium priority fields
- **✅ Test Framework**: Sample data and validation scripts ready
- **🔄 Implementation**: Awaiting iME API endpoints for business profiles

### Critical Data Requirements for iME
```json
{
  "technicalAreas": ["AI/ML", "Cybersecurity", "Software Development"],
  "pastPerformance": [
    {
      "agency": "ARMY",
      "contractType": "SBIR Phase I", 
      "value": 150000,
      "performanceRating": "Excellent"
    }
  ],
  "preferences": {
    "agencyPreferences": ["ARMY", "NAVY"],
    "budgetRange": { "min": 100000, "max": 2000000 },
    "riskTolerance": "medium"
  }
}
```

The separation allows for specialized focus:
- **iME**: Business profile capture and management
- **This Platform**: Opportunity intelligence and AI-powered insights

## Prerequisites

- Node.js (v20 or higher)
- Python 3.8+
- Playwright browsers (`npx playwright install`)
- npm or yarn

## Getting Started

### Backend
```bash
# Start the backend server
node server.js
```

### Frontend
```bash
cd frontend
npm run dev
```

## Complete Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd misfits_scraper
   ```

2. Set up Python virtual environment:
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate the virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   # .\venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install Node.js dependencies:
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

5. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

6. (Optional) To deactivate the virtual environment when done:
   ```bash
   deactivate
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development
# Add other environment variables as needed
```

## Development

### Running in Development Mode

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` (or the port shown in the console)

### Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Docker Support

Build and run using Docker:

```bash
docker build -t misfits-scraper .
docker run -p 3000:3000 misfits-scraper
```

## 🏗 Project Structure

```
defense-contract-intelligence/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── TopicsTable.tsx      # Main opportunity display
│   │   │   ├── FilterPanel.tsx      # Advanced filtering
│   │   │   └── TopicDetailModal.tsx # Detailed opportunity view
│   │   ├── contexts/           # State management
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/              # TypeScript interfaces
├── backend/
│   ├── server.js              # Express API server with AI routes
│   ├── scraping/              # Data collection layer
│   │   ├── script.py          # DoD SBIR/STTR scraper
│   │   ├── discover_filters.py # Filter discovery
│   │   └── discover_mod_ids.py # Module discovery
│   └── ai/                    # ✅ PRODUCTION AI ENGINE
│       ├── services/          # Core AI services
│       │   ├── opportunityAnalyzer.js  # AI opportunity analysis
│       │   └── matchingEngine.js       # Business profile matching
│       ├── models/            # Data models and schemas
│       │   └── businessProfile.js     # iME integration spec
│       ├── routes/            # API endpoints
│       │   └── analysisRoutes.js      # AI analysis APIs
│       └── test/              # Testing framework
│           └── testAnalysis.js        # Comprehensive test suite
├── data/
│   ├── filters.json          # Available filter configurations
│   └── downloads/            # Scraped PDFs and data
├── docs/
│   ├── CLAUDE.md            # Development guidance
│   └── iME-API-Requirements.md # Complete iME integration specification
└── config/
    ├── package.json         # Node.js dependencies
    ├── requirements.txt     # Python dependencies
    └── Dockerfile          # Container configuration
```

### 🤖 AI Engine Components

**Core Services:**
- `OpportunityAnalyzer`: Semantic analysis, difficulty scoring, risk assessment
- `MatchingEngine`: 6-factor scoring algorithm for business profile alignment

**API Endpoints:**
- `POST /api/analyze-opportunities` - Batch AI analysis
- `POST /api/match-opportunities` - Score against business profiles
- `POST /api/market-insights` - Generate market trend analysis

**Testing:**
- Complete test suite validating analysis accuracy and API compatibility
- Sample data for Army, Navy, and Air Force opportunities
- Business profile templates for integration testing

## 🔮 Future Expansions

### Contract Data Sources
- **SAM.gov**: Federal contract opportunities beyond SBIR/STTR
- **FPDS**: Historical contract award data for competition analysis
- **USASpending.gov**: Budget and spending pattern analysis
- **Agency-specific portals**: Direct integration with major DoD acquisition systems

### AI Capabilities
- **Natural Language Processing**: Advanced requirement extraction and analysis
- **Predictive Analytics**: Success probability modeling based on historical data
- **Recommendation Engine**: Sophisticated matching algorithms using vector embeddings
- **Proposal Optimization**: AI-assisted writing and compliance verification

### Business Intelligence
- **Market Mapping**: Comprehensive defense industry landscape analysis
- **Competitive Intelligence**: Track competitor activities and win patterns
- **Relationship Mapping**: Network analysis for teaming and subcontracting
- **Performance Metrics**: ROI analysis and success tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the repository.