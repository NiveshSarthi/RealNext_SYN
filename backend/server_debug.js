const { exec } = require('child_process');
const fs = require('fs');

console.log('--- STARTING SERVER DEBUG ---');
const serverProcess = exec('node server.js');

serverProcess.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data}`);
    fs.appendFileSync('server_debug.log', data);
});

serverProcess.stderr.on('data', (data) => {
    console.error(`STDERR: ${data}`);
    fs.appendFileSync('server_debug.log', `ERROR: ${data}\n`);
});

serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    fs.appendFileSync('server_debug.log', `--- EXIT CODE: ${code} ---\n`);
});
