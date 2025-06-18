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

## 🧠 AI Integration Roadmap

### Phase 1: Intelligent Matching (In Development)
- **Business Profile Integration**: Connect with iME (Integrated Modernization Environment) for contractor profiles
- **Semantic Analysis**: AI-powered opportunity requirement extraction
- **Match Scoring**: Automated scoring based on business capabilities vs opportunity requirements
- **Personalized Recommendations**: Tailored opportunity suggestions

### Phase 2: Market Intelligence
- **Competition Analysis**: Historical award patterns and competition assessment
- **Timing Optimization**: Predict optimal application windows
- **Technology Trends**: Identify emerging areas and budget allocation patterns
- **Risk Assessment**: Probability scoring for successful proposals

### Phase 3: AI Copilot
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
│   ├── server.js              # Express API server
│   ├── scraping/
│   │   ├── script.py          # DoD SBIR/STTR scraper
│   │   ├── discover_filters.py # Filter discovery
│   │   └── discover_mod_ids.py # Module discovery
│   └── ai/                    # AI integration (planned)
│       ├── opportunity_analyzer.js
│       ├── matching_engine.js
│       └── market_insights.js
├── data/
│   ├── filters.json          # Available filter configurations
│   └── downloads/            # Scraped PDFs and data
├── docs/
│   ├── CLAUDE.md            # Development guidance
│   └── api-integration.md   # iME integration specs
└── config/
    ├── package.json         # Node.js dependencies
    ├── requirements.txt     # Python dependencies
    └── Dockerfile          # Container configuration
```

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