FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    # Playwright system dependencies
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    libglib2.0-0 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxcb1 \
    libxkbcommon0 \
    fonts-liberation \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install Node.js Playwright browsers
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Install Python packages directly (no requirements.txt needed)
RUN echo "Installing Python packages..."
RUN pip install --no-cache-dir playwright==1.40.0
RUN pip install --no-cache-dir requests beautifulsoup4 lxml urllib3 html5lib reportlab

# Install Python Playwright browsers
RUN echo "Installing Python Playwright browsers..."
RUN playwright install chromium

# Verify installations with detailed output
RUN echo "=== VERIFICATION ==="
RUN echo "Node Playwright version:"
RUN npx playwright --version
RUN echo "Python version:"
RUN python --version
RUN echo "Pip version:"
RUN pip --version
RUN echo "Installed Python packages:"
RUN pip list | grep -E "(playwright|requests|beautifulsoup)"
RUN echo "Python Playwright test:"
RUN python -c "import playwright.sync_api; print('✅ Python Playwright import successful')"
RUN echo "===================="

# Copy app code
COPY . .

# Build frontend
RUN npm run build

# Create downloads directory
RUN mkdir -p /app/downloads

EXPOSE 8080
CMD ["npm", "start"]