const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { chromium } = require('playwright');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Serve static files from frontend build
const frontendPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('Serving frontend from:', frontendPath);
} else {
  console.log('Frontend dist folder not found at:', frontendPath);
}

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// PDF download endpoint (existing)
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
      
      // Try different Python commands
      const pythonCommands = ['python3', 'python', '/usr/bin/python3'];
      let pythonCmd = 'python3';
      
      // Find working Python command
      for (const cmd of pythonCommands) {
        try {
          require('child_process').execSync(`${cmd} --version`, { stdio: 'pipe' });
          pythonCmd = cmd;
          console.log(`Using Python command: ${pythonCmd}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      const command = `${pythonCmd} "${scriptPath}" --topic "${topicCode}"`;
      console.log(`Executing: ${command}`);
      console.log(`Working directory: ${__dirname}`);
      
      const child = exec(command, { 
        cwd: __dirname,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
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
      
      // Add error event handler
      child.on('error', (error) => {
        console.error('Child process error:', error);
        stderrData += `Child process error: ${error.message}\n`;
      });
      
      child.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
        
        if (code !== 0) {
          console.error(`Script failed with code ${code}`);
          return res.status(500).json({ 
            error: 'Failed to generate PDF', 
            details: { 
              message: 'The PDF download process failed',
              stdout: stdoutData,
              stderr: stderrData
            } 
          });
        }
        
        // Look for the saved file path in the stdout
        const savedPathMatch = stdoutData.match(/PDF saved to: (.+\.PDF)/i);
        
        if (savedPathMatch && savedPathMatch[1]) {
          const originalPath = savedPathMatch[1];
          console.log(`Found PDF at: ${originalPath}`);
          
          if (fs.existsSync(originalPath)) {
            const targetPath = path.join(downloadsDir, path.basename(originalPath));
            
            // Copy the file to our downloads directory (using copy instead of move)
            fs.copyFileSync(originalPath, targetPath);
            console.log(`PDF copied from ${originalPath} to ${targetPath}`);
            
            console.log(`PDF found, initiating download`);
            res.download(targetPath, path.basename(originalPath), (err) => {
              if (err) {
                console.error('Download error:', err);
                return res.status(500).json({ error: 'Failed to initiate download', details: err.message });
              }
            });
          } else {
            console.error(`PDF file not found at reported path: ${originalPath}`);
            res.status(500).json({ 
              error: 'Failed to generate PDF', 
              details: 'Output file not found at reported path' 
            });
          }
        } else {
          // Fallback to searching for any PDF file in the script directory
          const scriptDir = path.dirname(scriptPath);
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
            console.log(`PDF copied from ${originalPath} to ${targetPath}`);
            
            console.log(`PDF found, initiating download`);
            res.download(targetPath, pdfFile, (err) => {
              if (err) {
                console.error('Download error:', err);
                return res.status(500).json({ error: 'Failed to initiate download', details: err.message });
              }
            });
          } else {
            console.error(`No PDF files found in the script directory matching topic code: ${topicCode}`);
            res.status(500).json({ 
              error: 'Failed to generate PDF', 
              details: 'Output file not found' 
            });
          }
        }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// NEW: Topic Details PDF Generation endpoint
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
    
    // Create HTML content
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
    
    console.log('Step 2: Launching browser...');
    
    // Launch Playwright browser
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      console.log('Step 2: Browser launched successfully');
    } catch (browserError) {
      console.error('Step 2 Failed - Browser launch error:', browserError);
      return res.status(500).json({ 
        error: 'Failed to launch browser', 
        details: browserError.message 
      });
    }

    console.log('Step 3: Creating page and setting content...');
    
    let page;
    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle' });
      console.log('Step 3: Page content set successfully');
    } catch (pageError) {
      console.error('Step 3 Failed - Page setup error:', pageError);
      await browser.close();
      return res.status(500).json({ 
        error: 'Failed to setup page content', 
        details: pageError.message 
      });
    }
    
    console.log('Step 4: Generating PDF...');
    
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
        }
      });
      console.log('Step 4: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    } catch (pdfError) {
      console.error('Step 4 Failed - PDF generation error:', pdfError);
      await browser.close();
      return res.status(500).json({ 
        error: 'Failed to generate PDF', 
        details: pdfError.message 
      });
    }

    await browser.close();
    console.log('Step 5: Browser closed, sending PDF...');

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
    
    try {
      const parsed = JSON.parse(processed);
      if (typeof parsed === 'object' && parsed !== null) {
        if ('content' in parsed) {
          processed = parsed.content;
        } else if ('answer' in parsed) {
          processed = parsed.answer;
        }
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    // Remove HTML tags and decode entities
    const temp = processed.replace(/<[^>]*>/g, ' ')
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
                            <div>${cleanContent(answer.answer) || 'No answer text available'}</div>
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend served from: ${frontendPath}`);
});

// Serve React app for all non-API routes (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run npm run build first.');
  }
});

// Add these event listeners to better understand server status
server.on('error', (error) => {
    console.error('Server error:', error);
});

server.on('listening', () => {
    console.log('Server is listening and ready to accept connections');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});