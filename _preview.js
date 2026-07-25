// 本地预览服务器：把 /xuewaiyu/* 重写到仓库根目录，使页面引用的
// /xuewaiyu/assets/common.js 与 /xuewaiyu/public/js/*.js 能正确解析。
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8080;
const PREFIX = '/xuewaiyu';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || '/';
  if (p === '/') p = '/home.html';
  const fp = path.join(root, p);
  fs.readFile(fp, (e, buf) => {
    if (e) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + p);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(port, () => {
  console.log('AILOS preview running at http://localhost:' + port + '/xuewaiyu/home');
});
