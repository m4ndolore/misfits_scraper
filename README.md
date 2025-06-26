# DoD SBIR/STTR AI Opportunity Intelligence Platform

An AI-powered platform for discovering, analyzing, and matching DoD SBIR/STTR opportunities with business capabilities.

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- Python 3.8+ with virtual environment
- Chrome/Chromium browser

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd misfits_scraper
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Set up Python environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
npx playwright install chromium
```

### Running the Application

1. **Start the backend server** (port 3000)
```bash
node server.js
```

2. **Start the frontend development server** (port 5173/5174)
```bash
cd frontend
npm run dev
```

3. **Access the application**
- Open http://localhost:5173 (or the port shown in terminal)
- The UI will display DoD SBIR/STTR opportunities with filtering and search

## Key Features

- **Smart Filtering**: Filter by agency, program phase, topic status, and keywords
- **AI Analysis**: Each opportunity is analyzed for technical requirements, difficulty, and risks
- **PDF Downloads**: Download both official PDFs and AI-generated detailed analysis
- **Bulk Operations**: Select multiple topics for batch downloads
- **Real-time Search**: Instant filtering as you type

## AI Analysis Engine

The platform includes a production-ready AI analysis engine that provides:

- **Opportunity Analysis**: Extracts technical requirements, assesses difficulty (1-10 scale), identifies risks
- **Match Scoring**: Scores opportunities against business profiles with 6 weighted factors
- **Market Insights**: Generates strategic recommendations based on historical data

### API Endpoints

- `POST /api/analyze-opportunities` - Batch analysis of opportunities
- `POST /api/match-opportunities` - Score opportunities against profiles
- `POST /api/analyze-single` - Analyze individual opportunity
- `POST /api/market-insights` - Generate market intelligence
- `GET /api/analysis-status` - Health check

## Project Structure

```
misfits_scraper/
├── server.js           # Express backend server
├── script.py           # Playwright web scraper
├── frontend/           # React TypeScript UI
│   ├── src/
│   │   └── App.tsx    # Main application component
│   └── dist/          # Production build
├── ai/                # AI analysis engine
│   ├── services/      # Core AI services
│   ├── routes/        # API endpoints
│   └── test/          # Test suite
└── downloads/         # Downloaded PDFs
```

## Development Commands

See [CLAUDE.md](./CLAUDE.md) for detailed development commands and Claude Code integration.

## Future Roadmap

See [BACKLOG.md](./BACKLOG.md) for planned features and improvements.

## License

Proprietary - All rights reserved