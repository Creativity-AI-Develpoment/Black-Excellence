const { spawn } = require('child_process');
const net = require('net');

console.log('=== React Exit Diagnostic ===\n');

// Check port availability first
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function diagnoseReact() {
  console.log('🔍 Checking port availability...');
  const port3001Available = await checkPort(3001);
  console.log(`Port 3001 available: ${port3001Available}\n`);
  
  console.log('🚀 Starting React process...\n');
  
  const startTime = Date.now();
  let compiledTime = null;
  let exitTime = null;
  
  const react = spawn('npm', ['start'], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd(),
    env: { 
      ...process.env, 
      PORT: '3001', 
      BROWSER: 'none',
      CI: 'false'
    }
  });
  
  console.log(`Process started with PID: ${react.pid}`);
  console.log(`Parent PID: ${process.pid}\n`);
  
  react.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(`[${new Date().toISOString()}] [STDOUT] ${output}`);
    
    if (output.includes('Compiled successfully')) {
      compiledTime = Date.now();
      console.log(`\n⏱️  Compilation took: ${compiledTime - startTime}ms\n`);
    }
    
    if (output.includes('http://localhost:3001')) {
      console.log('\n📡 Server URL detected! Checking actual port binding...\n');
      
      setTimeout(async () => {
        const isListening = !(await checkPort(3001));
        console.log(`Port 3001 is ${isListening ? 'LISTENING ✅' : 'NOT LISTENING ❌'}`);
        
        if (!isListening) {
          console.log('\n🔴 ISSUE FOUND: Server claims to be running but port is not bound!\n');
        }
      }, 2000);
    }
  });
  
  react.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('DeprecationWarning')) {
      process.stderr.write(`[${new Date().toISOString()}] [STDERR] ${output}`);
    }
  });
  
  react.on('exit', (code, signal) => {
    exitTime = Date.now();
    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🛑 PROCESS EXITED`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Exit code: ${code}`);
    console.log(`Signal: ${signal}`);
    console.log(`Total runtime: ${exitTime - startTime}ms`);
    if (compiledTime) {
      console.log(`Time from compilation to exit: ${exitTime - compiledTime}ms`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    if (code === 0) {
      console.log('⚠️  Process exited cleanly (code 0) - this is abnormal for a dev server!');
      console.log('This suggests the server starts, compiles, then immediately exits.\n');
    }
  });
  
  react.on('error', (error) => {
    console.error(`\n❌ Process error: ${error}\n`);
  });
  
  // Keep checking for child processes
  const checkInterval = setInterval(() => {
    const { execSync } = require('child_process');
    try {
      const processes = execSync(`wmic process where "ParentProcessId=${react.pid}" get ProcessId,CommandLine /format:list`, { encoding: 'utf-8' });
      if (processes.includes('node')) {
        console.log(`\n👶 Child process detected:\n${processes}\n`);
      }
    } catch (e) {
      // Ignore errors
    }
  }, 3000);
  
  // Clean exit after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    react.kill();
    console.log('\n⏹️  Terminated after 30 seconds for diagnostic purposes\n');
    process.exit(0);
  }, 30000);
}

diagnoseReact().catch(console.error);
