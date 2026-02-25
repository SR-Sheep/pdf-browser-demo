#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

// 설정 파일 읽기
let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('설정 파일을 찾을 수 없습니다. config.example.json을 복사하여 config.json을 만들어주세요.');
    process.exit(1);
}

const PORT = config.server.port;
const HOST = config.server.host;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - File Not Found');
            } else {
                res.writeHead(500);
                res.end('500 - Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 서버가 시작되었습니다!`);
    console.log(`📍 주소: http://${HOST}:${PORT}`);
    console.log(`⏹️  종료하려면 Ctrl+C를 누르세요.`);
});
