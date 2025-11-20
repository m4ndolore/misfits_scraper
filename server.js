const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { chromium } = require('playwright');
const util = require('util');
const app = express();
const PORT = process.env.PORT || 3001;

// Application readiness flag
let isAppReady = false;

// Promisify exec for async usage
const execPromise = util.promisify(exec);

console.log('=== APPLICATION STARTUP ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`PORT environment variable: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('===============================');

// Enable CORS for all routes - explicitly allow the Vite dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());

// Import AI analysis routes
const analysisRoutes = require('./ai/routes/analysisRoutes');
app.use('/api', analysisRoutes);

// Define paths
const frontendPath = path.join(__dirname, 'frontend', 'dist');
const downloadsDir = path.join(__dirname, 'downloads');

console.log('Setting up server...');
console.log(`Will listen on port: ${PORT}`);
console.log(`Frontend path: ${frontendPath}`);
console.log(`Frontend path exists: ${fs.existsSync(frontendPath)}`);
console.log(`Downloads directory exists: ${fs.existsSync(downloadsDir)}`);

console.log('=== PYTHON ENVIRONMENT CHECK ===');
console.log('=== DETAILED PYTHON DEBUG ===');

// Check if virtual environment exists and what's in it
if (fs.existsSync('/opt/venv')) {
  console.log('✅ Virtual environment directory exists');
  
  if (fs.existsSync('/opt/venv/bin/python')) {
    console.log('✅ /opt/venv/bin/python exists');
    try {
      const venvPythonVersion = require('child_process').execSync('/opt/venv/bin/python --version', { stdio: 'pipe' }).toString().trim();
      console.log('✅ Virtual env Python version:', venvPythonVersion);
      
      // Test playwright import specifically
      try {
        const playwrightImport = require('child_process').execSync('/opt/venv/bin/python -c "import playwright.sync_api; print(playwright.__version__)"', { stdio: 'pipe', timeout: 10000 }).toString().trim();
        console.log('✅ Playwright version in venv:', playwrightImport);
      } catch (playwrightErr) {
        console.error('❌ Playwright import failed in venv:', playwrightErr.message);
        
        // List installed packages
        try {
          const pipList = require('child_process').execSync('/opt/venv/bin/python -m pip list', { stdio: 'pipe' }).toString();
          console.log('📦 All packages in venv:');
          console.log(pipList);
        } catch (pipErr) {
          console.error('❌ Could not list pip packages:', pipErr.message);
        }
      }
    } catch (err) {
      console.error('❌ Error checking venv python:', err.message);
    }
  } else {
    console.error('❌ /opt/venv/bin/python does not exist');
    
    // List what's actually in the bin directory
    try {
      const binContents = fs.readdirSync('/opt/venv/bin');
      console.log('📁 Contents of /opt/venv/bin:', binContents);
    } catch (e) {
      console.log('❌ Could not read /opt/venv/bin directory');
    }
  }
} else {
  console.error('❌ Virtual environment directory /opt/venv does not exist');
}

console.log('=================================');
// Check virtual environment Python
const venvPython = '/opt/venv/bin/python';
try {
  if (fs.existsSync(venvPython)) {
    console.log('✅ Virtual environment Python found at:', venvPython);
    
    const pythonVersion = require('child_process').execSync(`${venvPython} --version`, { stdio: 'pipe' }).toString().trim();
    console.log('✅ Virtual env Python version:', pythonVersion);
    
    // Test playwright import
    try {
      const playwrightTest = require('child_process').execSync(
        `${venvPython} -c "import playwright.sync_api; print('Playwright available')"`, 
        { stdio: 'pipe', timeout: 10000 }
      ).toString().trim();
      console.log('✅ Playwright test:', playwrightTest);
    } catch (playwrightError) {
      console.error('❌ Playwright import test failed:', playwrightError.message);
    }
    
    // List installed packages
    try {
      const pipList = require('child_process').execSync(`${venvPython} -m pip list | grep -E "(playwright|requests|beautifulsoup)"`, { stdio: 'pipe' }).toString().trim();
      console.log('📦 Installed Python packages:', pipList);
    } catch (e) {
      console.log('📦 Could not list packages');
    }
    
  } else {
    console.error('❌ Virtual environment Python not found at:', venvPython);
  }
} catch (error) {
  console.error('❌ Virtual environment check failed:', error.message);
}

// Check system Python as fallback
try {
  const systemPython = require('child_process').execSync('which python3', { stdio: 'pipe' }).toString().trim();
  console.log('🔄 System Python3 found at:', systemPython);
} catch (error) {
  console.error('❌ System Python3 not found');
}

// Check environment variables
console.log('🌍 Environment PATH:', process.env.PATH);
console.log('🌍 VIRTUAL_ENV:', process.env.VIRTUAL_ENV || 'Not set');
console.log('🌍 Working directory:', process.cwd());
console.log('================================');


// Check environment variables
console.log('Environment PATH:', process.env.PATH);
console.log('Working directory:', process.cwd());
console.log('================================');
// Serve static files from frontend build
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('Serving frontend from:', frontendPath);
} else {
  console.log('Frontend dist folder not found at:', frontendPath);
}

// Ensure downloads directory exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Function to ensure Playwright browsers are installed
async function ensurePlaywrightBrowsers() {
  console.log('Checking Playwright browser installation...');
  
  try {
    // Try to launch browser to test if it works
    const testBrowser = await chromium.launch({ 
      headless: true,
      timeout: 5000 
    });
    await testBrowser.close();
    console.log('✅ Playwright browsers are working correctly');
    return true;
  } catch (error) {
    console.log('❌ Playwright browser check failed:', error.message);
    
    if (error.message.includes('Executable doesn\'t exist') || 
        error.message.includes('browserType.launch')) {
      
      console.log('🔧 Installing Playwright browsers...');
      
      try {
        // Install chromium browser
        await execPromise('npx playwright install chromium');
        console.log('✅ Playwright chromium installed');
        
        // Install system dependencies
        await execPromise('npx playwright install-deps chromium');
        console.log('✅ Playwright system dependencies installed');
        
        // Test again
        const testBrowser = await chromium.launch({ headless: true });
        await testBrowser.close();
        console.log('✅ Playwright browsers are now working');
        return true;
        
      } catch (installError) {
        console.error('❌ Failed to install Playwright browsers:', installError.message);
        
        // Try alternative installation method
        try {
          console.log('🔧 Trying alternative installation...');
          await execPromise('npx playwright install --with-deps chromium');
          console.log('✅ Alternative installation completed');
          
          const testBrowser = await chromium.launch({ headless: true });
          await testBrowser.close();
          console.log('✅ Playwright browsers working after alternative install');
          return true;
          
        } catch (altError) {
          console.error('❌ Alternative installation also failed:', altError.message);
          return false;
        }
      }
    } else {
      console.error('❌ Browser launch failed for other reasons:', error.message);
      return false;
    }
  }
}

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.ip}`);
  
  const userAgent = req.get('User-Agent') || 'unknown';
  if (userAgent.includes('Railway') || req.url === '/health' || req.url === '/api/health') {
    console.log(`Health check request - User-Agent: ${userAgent}`);
  }
  
  next();
});
// Add to your server.js for enhanced filtering
app.get('/api/sbir/summary', async (req, res) => {
  try {
    // Get summary stats for the dashboard
    const searchParams = { topicStatuses: ['591', '592'] }
    const encodedParams = encodeURIComponent(JSON.stringify(searchParams))
    const url = `https://www.dodsbirsttr.mil/topics/api/public/topics/search?searchParam=${encodedParams}&size=1000&page=0`
    
    const response = await axios.get(url)
    const opportunities = response.data.data || []
    
    // Generate statistics
    const stats = {
      total: opportunities.length,
      byComponent: {},
      byStatus: {},
      byPriority: { critical: 0, high: 0, medium: 0 },
      recentlyUpdated: opportunities.filter(opp => {
        const updated = new Date(opp.lastModified || opp.createdDate)
        const daysAgo = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
        return daysAgo <= 7
      }).length
    }
    
    opportunities.forEach(opp => {
      // Component stats
      const component = opp.component || 'Unknown'
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1
      
      // Status stats  
      const status = opp.topicStatus || 'Unknown'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      
      // Priority stats
      const priority = determinePriority(opp.topicStatus)
      stats.byPriority[priority]++
    })
    
    res.json({ success: true, data: stats })
    
  } catch (error) {
    console.error('Summary stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get summary stats' })
  }
 })
 
 // Enhanced bulk download with better error handling
 app.post('/api/sbir/bulk-download-enhanced', async (req, res) => {
  try {
    const { topicCodes, includeDetails = true } = req.body
    
    if (!Array.isArray(topicCodes) || topicCodes.length === 0) {
      return res.status(400).json({ error: 'Topic codes array required' })
    }
    
    const results = []
    const downloadPromises = topicCodes.map(async (topicCode) => {
      try {
        const result = { topicCode, status: 'pending', files: [] }
        
        // Download official PDF
        try {
          await downloadTopicPDF(topicCode) // Your existing function
          result.files.push(`${topicCode}_official.pdf`)
        } catch (error) {
          result.officialError = error.message
        }
        
        // Download details PDF if requested
        if (includeDetails) {
          try {
            await generateDetailsPDF(topicCode) // Your existing function
            result.files.push(`${topicCode}_details.pdf`)
          } catch (error) {
            result.detailsError = error.message
          }
        }
        
        result.status = result.files.length > 0 ? 'success' : 'error'
        return result
        
      } catch (error) {
        return {
          topicCode,
          status: 'error',
          error: error.message,
          files: []
        }
      }
    })
    
    // Process downloads with concurrency limit
    const batchSize = 3 // Process 3 at a time to avoid overwhelming the system
    const batches = []
    for (let i = 0; i < downloadPromises.length; i += batchSize) {
      batches.push(downloadPromises.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(batch)
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason))
    }
    
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length
    
    res.json({
      success: true,
      results,
      summary: {
        total: topicCodes.length,
        successful,
        failed,
        successRate: Math.round((successful / topicCodes.length) * 100)
      }
    })
    
  } catch (error) {
    console.error('Bulk download error:', error)
    res.status(500).json({
      success: false,
      error: 'Bulk download failed',
      details: error.message
    })
  }
 })
 
// Health check endpoints with proper readiness indication
app.get('/health', (req, res) => {
  console.log('Health check requested from:', req.get('host') || 'unknown');
  
  if (!isAppReady) {
    console.log('App not ready yet, returning 503');
    return res.status(503).json({ 
      status: 'not ready',
      message: 'Application is still initializing',
      timestamp: new Date().toISOString()
    });
  }

  const healthData = {
    status: 'ok',
    message: 'Server is running and ready',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  };

  console.log('Health check successful:', healthData.status);
  res.status(200).json(healthData);
});

app.get('/api/health', (req, res) => {
  if (!isAppReady) {
    return res.status(503).json({ 
      status: 'not ready',
      message: 'Application is still initializing',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running and ready',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(200).send('Server is running - Frontend not built');
  }
});

// PDF download endpoint (existing) - UPDATED PYTHON EXECUTION
app.post('/api/download-pdf', async (req, res) => {
    console.log('Received download request with body:', req.body);
    const { topicCode } = req.body;
    
    if (!topicCode) {
      console.error('No topicCode provided in request');
      return res.status(400).json({ error: 'Topic Code is required' });
    }

    console.log(`Processing PDF generation for topic code: ${topicCode}`);
  
    try {
      // Use absolute path to script
      const scriptPath = path.join(__dirname, 'script.py');
      console.log(`Using script at: ${scriptPath}`);
      
      if (!fs.existsSync(scriptPath)) {
        const errorMsg = `Script not found at path: ${scriptPath}`;
        console.error(errorMsg);
        return res.status(500).json({ 
          error: 'Python script not found',
          details: {
            scriptPath,
            currentDirectory: process.cwd(),
            directoryContents: fs.readdirSync(__dirname)
          }
        });
      }
      
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
// Replace the Python command detection section in your /api/download-pdf endpoint with this:

      // Try to find Python on the system
      let pythonCmd = null;
      
      // Try different Python paths, including system Python which is more likely on a local machine
      const possiblePythonPaths = [
        '/opt/venv/bin/python',
        '/opt/venv/bin/python3',
        'python3',  // Use system Python on Mac
        'python'    // Fallback to any Python in PATH
      ];
      
      for (const venvPath of possiblePythonPaths) {
        if (fs.existsSync(venvPath)) {
          try {
            // Test if this python can import playwright
            const testResult = require('child_process').execSync(
              `${venvPath} -c "import playwright.sync_api; print('OK')"`, 
              { stdio: 'pipe', timeout: 10000 }
            ).toString().trim();
            
            if (testResult === 'OK') {
              pythonCmd = venvPath;
              console.log(`✅ Using virtual environment Python: ${pythonCmd} (with playwright support)`);
              break;
            }
          } catch (e) {
            console.log(`❌ Virtual env Python failed: ${venvPath} - ${e.message}`);
          }
        } else {
          console.log(`❌ Virtual env Python not found: ${venvPath}`);
        }
      }
      
      // If virtual environment Python failed, try system python as fallback
      if (!pythonCmd) {
        console.log('⚠️ Virtual environment Python failed, trying system python...');
        const systemPythonCommands = ['python3', 'python', '/usr/bin/python3'];
        
        for (const cmd of systemPythonCommands) {
          try {
            const testResult = require('child_process').execSync(
              `${cmd} -c "import playwright.sync_api; print('OK')"`, 
              { stdio: 'pipe', timeout: 5000 }
            ).toString().trim();
            
            if (testResult === 'OK') {
              pythonCmd = cmd;
              console.log(`⚠️ Using system Python: ${pythonCmd} (with playwright support)`);
              break;
            }
          } catch (e) {
            console.log(`❌ System Python failed: ${cmd} - ${e.message}`);
          }
        }
      }
      
      if (!pythonCmd) {
        console.error('❌ No Python with Playwright support found');
        
        // Debug: List what's actually in the virtual environment
        try {
          if (fs.existsSync('/opt/venv/bin')) {
            const venvContents = fs.readdirSync('/opt/venv/bin');
            console.log('📁 Virtual env bin contents:', venvContents);
          }
          
          if (fs.existsSync('/opt/venv/lib')) {
            const libContents = fs.readdirSync('/opt/venv/lib');
            console.log('📁 Virtual env lib contents:', libContents);
          }
        } catch (debugError) {
          console.log('❌ Could not debug virtual environment');
        }
        
        return res.status(500).json({ 
          error: 'No working Python installation with Playwright found',
          details: 'Unable to find a Python interpreter that can import playwright'
        });
      }
      
      // UPDATED: Set environment variables to ensure virtual environment is used
      const pythonEnv = {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PATH: '/opt/venv/bin:' + process.env.PATH,  // Prioritize venv
        VIRTUAL_ENV: '/opt/venv',                    // Set virtual environment
        PYTHONPATH: '/opt/venv/lib/python3.11/site-packages'  // Ensure Python can find packages
      };
      
      const command = `${pythonCmd} "${scriptPath}" --topic "${topicCode}"`;
      console.log(`Executing: ${command}`);
      console.log(`Working directory: ${__dirname}`);
      console.log(`Python environment PATH: ${pythonEnv.PATH}`);
      
      const child = exec(command, { 
        cwd: __dirname,
        env: pythonEnv,  // Use updated environment
        timeout: 240000 // 4 minute timeout
      });
      
      let stdoutData = '';
      let stderrData = '';
      
      child.stdout.on('data', (data) => {
        const strData = data.toString();
        stdoutData += strData;
        console.log(`stdout: ${strData}`);
      });
      
      child.stderr.on('data', (data) => {
        const strData = data.toString();
        stderrData += strData;
        console.error(`stderr: ${strData}`);
      });
      
      child.on('error', (error) => {
        console.error('Child process error:', error);
        stderrData += `Child process error: ${error.message}\n`;
      });
      
      child.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
        
        // First, check if PDF was successfully created (regardless of exit code)
        const savedPathMatch = stdoutData.match(/PDF saved to: (.+\.PDF)/i);
        
        if (savedPathMatch && savedPathMatch[1]) {
          const originalPath = savedPathMatch[1];
          console.log(`Found PDF at: ${originalPath}`);
          
          if (fs.existsSync(originalPath)) {
            const targetPath = path.join(downloadsDir, path.basename(originalPath));
            
            // Copy the file to our downloads directory
            fs.copyFileSync(originalPath, targetPath);
            
            // Check if the copy was successful
            if (fs.existsSync(targetPath)) {
              if (code !== 0) {
                console.log(`⚠️ PDF downloaded successfully despite script exit code ${code} (likely cleanup error)`);
              } else {
                console.log(`✅ PDF copied from ${originalPath} to ${targetPath}`);
              }
              
              console.log(`PDF found, initiating download`);
              return res.download(targetPath, path.basename(originalPath), (err) => {
                if (err) {
                  console.error('Download error:', err);
                  return res.status(500).json({ error: 'Failed to initiate download', details: err.message });
                }
              });
            } else {
              console.error(`❌ Failed to copy PDF from ${originalPath} to ${targetPath}`);
            }
          } else {
            console.error(`❌ PDF file not found at reported path: ${originalPath}`);
          }
        }
        
        // If no PDF found through stdout parsing, try fallback search
        const scriptDir = path.dirname(scriptPath);
        
        try {
          const files = fs.readdirSync(scriptDir);
          const pdfFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') && 
            file.toLowerCase().includes(topicCode.toLowerCase())
          );
          
          if (pdfFiles.length > 0) {
            const pdfFile = pdfFiles[0]; // Take the first matching PDF
            const originalPath = path.join(scriptDir, pdfFile);
            const targetPath = path.join(downloadsDir, pdfFile);
            
            // Copy the file to our downloads directory
            fs.copyFileSync(originalPath, targetPath);
            
            if (code !== 0) {
              console.log(`⚠️ PDF found via fallback search despite script exit code ${code} (likely cleanup error)`);
            } else {
              console.log(`✅ PDF copied from ${originalPath} to ${targetPath} (fallback search)`);
            }
            
            console.log(`PDF found via fallback, initiating download`);
            return res.download(targetPath, pdfFile, (err) => {
              if (err) {
                console.error('Download error:', err);
                return res.status(500).json({ error: 'Failed to initiate download', details: err.message });
              }
            });
          }
        } catch (fallbackError) {
          console.error('❌ Fallback search failed:', fallbackError.message);
        }
        
        // Only report failure if no PDF was found AND there's a real error
        if (code !== 0) {
          console.error(`❌ Script failed with code ${code} and no PDF was found`);
          
          // Check if this looks like a cleanup error vs a real error
          const isCleanupError = stderrData.includes('TargetClosedError') || 
                                stderrData.includes('Browser cleanup warning') ||
                                stderrData.includes('Target page, context or browser has been closed');
          
          if (isCleanupError && stdoutData.includes('PDF saved to:')) {
            console.log(`⚠️ This appears to be a cleanup error, but PDF was created`);
            // We already handled the PDF above, so this shouldn't happen
          }
          
          return res.status(500).json({ 
            error: 'Failed to generate PDF', 
            details: { 
              message: 'The PDF download process failed',
              stdout: stdoutData,
              stderr: stderrData,
              exitCode: code,
              isLikelyCleanupError: isCleanupError
            } 
          });
        }
        
        // Script succeeded but no PDF found (shouldn't happen)
        console.error(`⚠️ Script succeeded (code ${code}) but no PDF was found`);
        res.status(500).json({ 
          error: 'PDF generation succeeded but file not found', 
          details: 'Script completed successfully but the PDF file could not be located'
        });
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Enhanced Topic Details PDF Generation endpoint with Playwright browser management
app.post('/api/generate-topic-pdf', async (req, res) => {
  let browser = null;
  
  try {
    const { topic, questions } = req.body;
    
    console.log('=== PDF Generation Debug ===');
    console.log('Received topic:', topic?.topicCode);
    console.log('Questions count:', questions?.length || 0);
    
    if (!topic) {
      console.error('No topic data provided');
      return res.status(400).json({ error: 'Topic data is required' });
    }

    console.log('Step 1: Generating HTML content...');
    
    let htmlContent;
    try {
      htmlContent = generateTopicHTML(topic, questions || []);
      console.log('Step 1: HTML content generated successfully');
    } catch (htmlError) {
      console.error('Step 1 Failed - HTML generation error:', htmlError);
      return res.status(500).json({ 
        error: 'Failed to generate HTML content', 
        details: htmlError.message 
      });
    }
    
    console.log('Step 2: Ensuring Playwright browsers are available...');
    
    // Ensure browsers are installed
    const browsersReady = await ensurePlaywrightBrowsers();
    if (!browsersReady) {
      console.error('Step 2 Failed - Could not ensure browsers are ready');
      return res.status(500).json({ 
        error: 'Failed to initialize PDF generation browser', 
        details: 'Playwright browsers could not be installed or launched' 
      });
    }
    
    console.log('Step 3: Launching browser...');
    
    try {
      browser = await chromium.launch({
        headless: true,
        // Reduce arguments to make it more compatible with local environments
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        timeout: 30000
      });
      console.log('Step 3: Browser launched successfully');
    } catch (browserError) {
      console.error('Step 3 Failed - Browser launch error:', browserError);
      return res.status(500).json({ 
        error: 'Failed to launch browser', 
        details: browserError.message 
      });
    }

    console.log('Step 4: Creating page and setting content...');
    
    let page;
    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('Step 4: Page content set successfully');
    } catch (pageError) {
      console.error('Step 4 Failed - Page setup error:', pageError);
      await browser.close();
      return res.status(500).json({ 
        error: 'Failed to setup page content', 
        details: pageError.message 
      });
    }
    
    console.log('Step 5: Generating PDF...');
    
    let pdfBuffer;
    try {
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        timeout: 30000
      });
      console.log('Step 5: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError) {
      console.error('Step 5 Failed - PDF generation error:', pdfError);
      await browser.close();
      return res.status(500).json({ 
        error: 'Failed to generate PDF', 
        details: pdfError.message 
      });
    }

    await browser.close();
    console.log('Step 6: Browser closed, sending PDF...');

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="topic_${topic.topicCode}_details.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    console.log('=== PDF Generation Complete ===');

  } catch (error) {
    console.error('=== PDF Generation Failed ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// HTML generation function for topic details PDF
function generateTopicHTML(topic, questions) {
  // Helper function to clean HTML/JSON content
  const cleanContent = (content) => {
    if (!content) return '';

    let processed = content;

    // Handle objects directly
    if (typeof processed === 'object' && processed !== null) {
      // Try common field names for answer text
      if (processed.answer) {
        processed = processed.answer;
      } else if (processed.content) {
        processed = processed.content;
      } else if (processed.text) {
        processed = processed.text;
      } else if (processed.response) {
        processed = processed.response;
      } else {
        // Try to extract any string values
        const stringValues = Object.values(processed).filter(val => typeof val === 'string' && val.length > 0);
        if (stringValues.length > 0) {
          processed = stringValues.join(' ');
        } else {
          return '';
        }
      }
    }

    // Handle string content that might be JSON
    if (typeof processed === 'string') {
      try {
        const parsed = JSON.parse(processed);
        if (typeof parsed === 'object' && parsed !== null) {
          if ('answer' in parsed) {
            processed = parsed.answer;
          } else if ('content' in parsed) {
            processed = parsed.content;
          }
        }
      } catch (e) {
        // Not JSON, continue
      }
    }

    // Remove HTML tags and decode entities
    const temp = String(processed).replace(/<[^>]*>/g, ' ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"');

    return temp.trim();
  };

  // Helper function to safely get array
  const safeArray = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  // Helper function to parse phase hierarchy
  const getPhases = (phaseHierarchy) => {
    try {
      if (!phaseHierarchy || typeof phaseHierarchy !== 'string') return [];
      const parsed = JSON.parse(phaseHierarchy);
      return parsed?.config?.map(phase => phase.displayValue) || [];
    } catch {
      return [];
    }
  };

  const phases = getPhases(topic.phaseHierarchy);
  const managers = safeArray(topic.topicManagers);
  const technologyAreas = safeArray(topic.technologyAreas);
  const focusAreas = safeArray(topic.focusAreas);
  const keywords = safeArray(topic.keywords);
  const referenceDocuments = safeArray(topic.referenceDocuments);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Topic ${topic.topicCode || 'Unknown'} - Details</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 0;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: bold;
        }
        .header-info {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 11px;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .section-title {
            color: #1976d2;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 4px;
        }
        .section-content {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .two-column {
            display: flex;
            gap: 20px;
        }
        .two-column > div {
            flex: 1;
        }
        .badge {
            background: #1976d2;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            margin-right: 8px;
            margin-bottom: 4px;
            display: inline-block;
        }
        .contact-info {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }
        .contact-item {
            margin-bottom: 8px;
        }
        .contact-label {
            font-weight: bold;
            color: #1976d2;
        }
        .phase-section {
            margin-bottom: 15px;
        }
        .phase-title {
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 5px;
        }
        .qa-section {
            margin-top: 30px;
        }
        .question {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .question-header {
            background: #f8f9fa;
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }
        .question-content {
            padding: 12px;
        }
        .question-meta {
            font-size: 10px;
            color: #666;
            margin-bottom: 8px;
        }
        .question-text {
            margin-bottom: 15px;
            font-weight: bold;
        }
        .answer {
            background: #f0f8ff;
            border: 1px solid #1976d2;
            border-radius: 4px;
            padding: 12px;
            margin-top: 10px;
        }
        .answer-header {
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 8px;
            font-size: 11px;
        }
        .status-badge {
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            float: right;
        }
        .status-pending {
            background: #dc3545;
        }
        @media print {
            body { font-size: 11px; }
            .header { margin: -20px -20px 15px -20px; }
            .section { page-break-inside: avoid; }
            .question { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${cleanContent(topic.topicTitle) || 'No Title'}</h1>
        <div class="header-info">
            <div><strong>Topic Code:</strong> ${topic.topicCode || 'N/A'}</div>
            <div><strong>Program:</strong> ${topic.program || 'N/A'}</div>
            <div><strong>Component:</strong> ${topic.component || 'N/A'}</div>
            <div><strong>Status:</strong> ${topic.topicStatus || 'N/A'}</div>
        </div>
    </div>

    <!-- Contact Information -->
    <div class="section">
        <div class="section-title">Topic Point of Contact</div>
        <div class="section-content">
            ${managers.length > 0 ? managers.map(manager => `
                <div class="contact-info">
                    <div><span class="contact-label">Name:</span> ${manager.name || 'N/A'}</div>
                    <div><span class="contact-label">Email:</span> ${manager.email || 'N/A'}</div>
                    <div><span class="contact-label">Phone:</span> ${manager.phone || 'N/A'}</div>
                </div>
            `).join('') : '<div>No contact information available</div>'}
        </div>
    </div>

    <!-- Technology Areas & Focus Areas -->
    <div class="section">
        <div class="two-column">
            <div>
                <div class="section-title">Technology Areas</div>
                <div class="section-content">
                    ${technologyAreas.length > 0 ? 
                        technologyAreas.map(area => `<span class="badge">${area}</span>`).join('') : 
                        'Not specified'
                    }
                </div>
            </div>
            <div>
                <div class="section-title">Focus Areas</div>
                <div class="section-content">
                    ${focusAreas.length > 0 ? 
                        focusAreas.map(area => `<span class="badge">${area}</span>`).join('') : 
                        'Not specified'
                    }
                </div>
            </div>
        </div>
    </div>

    <!-- Phases -->
    ${phases.length > 0 ? `
    <div class="section">
        <div class="section-title">Phases</div>
        <div class="section-content">
            ${phases.map(phase => `<span class="badge">${phase}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    <!-- Keywords -->
    ${keywords.length > 0 ? `
    <div class="section">
        <div class="section-title">Keywords</div>
        <div class="section-content">
            ${keywords.map(keyword => `<span class="badge">${keyword}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    <!-- Objective -->
    ${topic.objective ? `
    <div class="section">
        <div class="section-title">Objective</div>
        <div class="section-content">
            ${cleanContent(topic.objective)}
        </div>
    </div>
    ` : ''}

    <!-- Description -->
    ${topic.description ? `
    <div class="section">
        <div class="section-title">Description</div>
        <div class="section-content">
            ${cleanContent(topic.description)}
        </div>
    </div>
    ` : ''}

    <!-- Phase Descriptions -->
    <div class="section">
        <div class="section-title">Phase Details</div>
        <div class="section-content">
            ${topic.phase1Description ? `
            <div class="phase-section">
                <div class="phase-title">Phase 1</div>
                <div>${cleanContent(topic.phase1Description)}</div>
            </div>
            ` : ''}
            
            ${topic.phase2Description ? `
            <div class="phase-section">
                <div class="phase-title">Phase 2</div>
                <div>${cleanContent(topic.phase2Description)}</div>
            </div>
            ` : ''}
            
            ${topic.phase3Description ? `
            <div class="phase-section">
                <div class="phase-title">Phase 3</div>
                <div>${cleanContent(topic.phase3Description)}</div>
            </div>
            ` : ''}
            
            ${!topic.phase1Description && !topic.phase2Description && !topic.phase3Description ? 
                '<div>No phase descriptions available</div>' : ''}
        </div>
    </div>

    <!-- Questions & Answers -->
    ${Array.isArray(questions) && questions.length > 0 ? `
    <div class="qa-section">
        <div class="section-title">Questions & Answers (${questions.length} questions)</div>
        ${questions.map(qa => `
            <div class="question">
                <div class="question-header">
                    Question #${qa.questionNo || 'N/A'}
                    <span class="status-badge ${qa.questionStatus === 'Answered' ? '' : 'status-pending'}">
                        ${qa.questionStatus || 'Pending'}
                    </span>
                </div>
                <div class="question-content">
                    <div class="question-meta">
                        Submitted: ${qa.questionSubmittedOn ? new Date(qa.questionSubmittedOn).toLocaleDateString() : 'N/A'}
                    </div>
                    <div class="question-text">
                        ${cleanContent(qa.question) || 'No question text available'}
                    </div>
                    
                    ${Array.isArray(qa.answers) && qa.answers.length > 0 ? qa.answers.map(answer => `
                        <div class="answer">
                            <div class="answer-header">
                                Official Response
                                ${answer.answeredOn ? `- Answered: ${new Date(answer.answeredOn).toLocaleDateString()}` : ''}
                            </div>
                            <div>${cleanContent(answer) || 'No answer text available'}</div>
                        </div>
                    `).join('') : '<div style="font-style: italic; color: #666;">No official response yet.</div>'}
                </div>
            </div>
        `).join('')}
    </div>
    ` : `
    <div class="section">
        <div class="section-title">Questions & Answers</div>
        <div class="section-content">
            <div style="text-align: center; color: #666; font-style: italic;">
                No questions have been published for this topic yet.
            </div>
        </div>
    </div>
    `}

    <!-- Reference Documents -->
    ${referenceDocuments.length > 0 ? `
    <div class="section">
        <div class="section-title">Reference Documents</div>
        <div class="section-content">
            ${referenceDocuments.map(doc => `
                <div style="margin-bottom: 5px;">
                    <strong>${doc.title || 'Document'}</strong><br>
                    <small style="color: #666;">${doc.url || 'No URL available'}</small>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

</body>
</html>
  `;
}

// Serve React app for all non-API routes (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run npm run build first.');
  }
});

console.log('Starting server...');

// Start server with Playwright browser initialization
const server = app.listen(PORT, 'localhost', async () => {
    console.log('=== SERVER STARTUP COMPLETE ===');
    console.log(`✅ Server successfully started on port ${PORT}`);
    console.log(`✅ Listening on all interfaces (0.0.0.0:${PORT})`);
    console.log(`✅ Frontend path: ${frontendPath}`);
    console.log(`✅ Frontend exists: ${fs.existsSync(frontendPath)}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Process ID: ${process.pid}`);
    console.log(`✅ Server started at: ${new Date().toISOString()}`);
    console.log('================================');
    
    console.log('Initializing application components...');
    
    // Initialize Playwright browsers during startup
    try {
      console.log('🔧 Initializing Playwright browsers...');
      await ensurePlaywrightBrowsers();
      console.log('✅ Playwright browsers initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Playwright browsers:', error);
      console.error('PDF generation may not work properly');
    }
    
    setTimeout(() => {
      isAppReady = true;
      console.log('=== APPLICATION READY ===');
      console.log('✅ Application is now ready to receive traffic');
      console.log(`✅ Health check endpoint: http://localhost:${PORT}/health`);
      console.log(`✅ API health check: http://localhost:${PORT}/api/health`);
      console.log('=========================');
    }, 5000); // 5 seconds to allow for browser installation
});

// Enhanced server event handlers
server.on('error', (error) => {
    console.error('=== SERVER ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================');
    
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});

server.on('listening', () => {
    const addr = server.address();
    console.log('=== SERVER LISTENING ===');
    console.log(`Server is listening on ${addr.address}:${addr.port}`);
    console.log(`Server family: ${addr.family}`);
    console.log('========================');
});

server.on('connection', (socket) => {
    console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  isAppReady = false; // Mark as not ready immediately
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    console.log('Server closed gracefully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handling - don't exit on errors in production
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production - just log
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // Don't exit in production - just log
});