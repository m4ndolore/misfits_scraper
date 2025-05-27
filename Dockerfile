FROM node:18-slim

# Install system dependencies required for Playwright AND Python
RUN apt-get update && apt-get install -y \
    # Playwright dependencies
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxcb1 \
    libxkbcommon0 \
    libasound2 \
    fonts-liberation \
    libdrm2 \
    libgtk-3-0 \
    wget \
    ca-certificates \
    # Python and pip
    python3 \
    python3-pip \
    python3-venv \
    python3-full \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package files first for better caching
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Install Node.js Playwright browsers
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copy requirements.txt and install Python dependencies
COPY requirements.txt* ./

# Install Python dependencies with explicit error handling
RUN if [ -f requirements.txt ]; then \
    echo "Installing Python packages from requirements.txt..." && \
    pip install --no-cache-dir -r requirements.txt && \
    echo "Python packages installed successfully" && \
    pip list | grep -E "(playwright|requests|beautifulsoup)" \
    ; else \
    echo "No requirements.txt found" \
    ; fi

# Install Python Playwright browsers with explicit error handling
RUN if command -v playwright > /dev/null 2>&1; then \
    echo "Installing Python Playwright browsers..." && \
    playwright install chromium && \
    echo "Python Playwright browsers installed successfully" \
    ; else \
    echo "Python Playwright CLI not available" \
    ; fi

# Verify installations with detailed output
RUN echo "=== VERIFICATION ==="
RUN npx playwright --version
RUN python --version
RUN pip --version
RUN echo "=== PYTHON PACKAGES ==="
RUN pip list
RUN echo "=== PLAYWRIGHT TEST ==="
RUN python -c "import playwright.sync_api; print('✅ Python Playwright import successful')" || echo "❌ Python Playwright import failed"
RUN echo "===================="

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Create directories that might be needed
RUN mkdir -p /app/downloads

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]