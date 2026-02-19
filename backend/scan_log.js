const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'logs', 'combined.log');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('Printing last 50 lines of logs:');
    const lines = content.split('\n');
    console.log(lines.slice(-50).join('\n'));
} catch (e) {
    console.error('Error reading log:', e.message);
}
