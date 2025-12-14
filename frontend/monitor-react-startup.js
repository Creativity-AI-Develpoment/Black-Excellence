const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

console.log('=== React Startup Monitor ===');

let serverStarted = false;
let portChecked = false;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port in use
      } else {
        resolve(false); // Other error
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port available
    });
    
    server.listen(port);
  });
}

async function monitorReact() {
  console.log('Checking port availability...');
  const port3000Available = await checkPort(3000);
  const port3001Available = await checkPort(3001);
  
  console.log(`Port 3000 available: ${port3000Available}`);
  console.log(`Port 3001 available: ${port3001Available}`);
  
  console.log('Starting React process...');
  
  const react = spawn('npm', ['start'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: '3001', BROWSER: 'none' }
  });
  
  react.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[STDOUT] ${output}`);
    
    // Look for specific React startup indicators
    if (output.includes('Compiled successfully') || output.includes('webpack compiled')) {
      console.log(' React compilation completed');
    }
    
    if (output.includes('http://localhost') || output.includes('Local:')) {
      console.log(' React server URL detected');
      serverStarted = true;
    }
    
    if (output.includes('error') || output.includes('Error') || output.includes('ERR!')) {
      console.error(' Error detected in output');
    }
  });
  
  react.stderr.on('data', (data) => {
    console.error(`[STDERR] ${data}`);
  });
  
  react.on('close', (code) => {
    console.log(`React process exited with code: ${code}`);
    if (code !== 0) {
      console.error('React process exited with error code');
    }
  });
  
  // Check if server actually binds after 10 seconds
  setTimeout(async () => {
    if (!serverStarted) {
      console.log('Server not detected after 10 seconds, checking manually...');
      const is3001Listening = await checkPort(3001);
      console.log(`Port 3001 listening: ${is3001Listening}`);
    }
  }, 10000);
}

monitorReact().catch(console.error);
