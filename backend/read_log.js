const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'logs', 'combined.log');

try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const bufferSize = Math.min(20000, fileSize);
    const buffer = Buffer.alloc(bufferSize);

    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
    fs.closeSync(fd);

    console.log(buffer.toString());
} catch (e) {
    console.error('Error reading log:', e.message);
}
