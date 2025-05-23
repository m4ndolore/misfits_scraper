const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5174', 'http://127.0.0.1:5174'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.static('public'));

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// PDF download endpoint
app.post('/api/download-pdf', async (req, res) => {
    console.log('Received download request with body:', req.body);
    const { topicCode } = req.body;
    
    if (!topicCode) {
      console.error('No topicCode provided in request');
      return res.status(400).json({ error: 'Topic Code is required' });
    }

    console.log(`Processing PDF generation for topic code: ${topicCode}`);
  
    try {
      const scriptPath = path.join(__dirname, '..', '..', 'frontend', 'script.py');
      console.log(`Using script at: ${scriptPath}`);
      
      if (!fs.existsSync(scriptPath)) {
        const errorMsg = `Script not found at path: ${scriptPath}`;
        console.error(errorMsg);
        return res.status(500).json({ 
          error: 'Python script not found',
          details: {
            scriptPath,
            currentDirectory: process.cwd(),
            directoryContents: fs.readdirSync(path.dirname(scriptPath))
          }
        });
      }
      
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      const command = `python3 ${scriptPath} --topic ${topicCode}`;
      console.log(`Executing: ${command}`);
      console.log(`Working directory: ${path.dirname(scriptPath)}`);
      
      const child = exec(command, { 
        cwd: path.dirname(scriptPath),
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
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

// Start server - modify this part
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
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