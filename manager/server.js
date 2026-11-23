// Portfolio Manager: a tiny local app for editing docs/data.json and publishing.
// Start it by double-clicking "Portfolio Manager.bat" (or: node manager/server.js).
// No npm install needed; uses only Node's built-in modules.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'docs');
const DATA = path.join(SITE, 'data.json');
const UPLOADS = path.join(SITE, 'uploads');
const PUBLIC = path.join(__dirname, 'public');
const BACKUPS = path.join(__dirname, 'backups');
const CONFIG_FILE = path.join(__dirname, 'config.json');

const config = Object.assign({ port: 4545, siteUrl: '' }, readJson(CONFIG_FILE, {}));
const PORT = Number(process.env.PORT || config.port);
const MAX_BODY = 40 * 1024 * 1024; // 40 MB (uploads arrive base64-encoded)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8'
};
const UPLOAD_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.pdf', '.mp4', '.webm']);

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function send(res, status, body, type) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  res.writeHead(status, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(buf);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('File too large (max ~25 MB).')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// Serve a file from `base`, refusing anything that escapes it.
function serveStatic(res, base, rel) {
  let p;
  try { p = decodeURIComponent(rel.split('?')[0]); } catch (e) { return send(res, 400, 'Bad path', 'text/plain'); }
  if (p === '' || p.endsWith('/')) p += 'index.html';
  const file = path.resolve(base, '.' + path.sep + p);
  if (file !== base && !file.startsWith(base + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, buf, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
}

function backupData() {
  try {
    fs.mkdirSync(BACKUPS, { recursive: true });
    if (!fs.existsSync(DATA)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(DATA, path.join(BACKUPS, `data-${stamp}.json`));
    const all = fs.readdirSync(BACKUPS).filter((f) => f.startsWith('data-')).sort();
    all.slice(0, Math.max(0, all.length - 30)).forEach((f) => fs.unlinkSync(path.join(BACKUPS, f)));
  } catch (e) { console.warn('Backup failed:', e.message); }
}

function saveData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Data must be an object');
  backupData();
  const tmp = DATA + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, DATA);
}

function safeName(name) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, path.extname(name))
    .normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'file';
  return { base, ext };
}

function saveUpload(name, dataUrl) {
  const { base, ext } = safeName(String(name || 'file'));
  if (!UPLOAD_EXT.has(ext)) throw new Error(`File type ${ext || '(none)'} not allowed. Use images, PDF or mp4/webm.`);
  const m = /^data:[^;,]*(;base64)?,(.*)$/s.exec(String(dataUrl || ''));
  if (!m) throw new Error('Bad upload data');
  const buf = m[1] ? Buffer.from(m[2], 'base64') : Buffer.from(decodeURIComponent(m[2]));
  fs.mkdirSync(UPLOADS, { recursive: true });
  let fname = base + ext, i = 1;
  while (fs.existsSync(path.join(UPLOADS, fname))) fname = `${base}-${++i}${ext}`;
  fs.writeFileSync(path.join(UPLOADS, fname), buf);
  return 'uploads/' + fname;
}

function git(args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd: ROOT, windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? err.code : 0, out: (stdout || '') + (stderr || '') });
    });
  });
}

async function status() {
  const isRepo = (await git(['rev-parse', '--is-inside-work-tree'])).ok;
  if (!isRepo) return { isRepo: false, pending: false, siteUrl: config.siteUrl };
  const st = await git(['status', '--porcelain', '--', 'docs']);
  const remote = await git(['remote', 'get-url', 'origin']);
  return {
    isRepo: true,
    pending: st.out.trim().length > 0,
    changes: st.out.trim().split('\n').filter(Boolean).length,
    hasRemote: remote.ok,
    siteUrl: config.siteUrl
  };
}

async function publish(message) {
  const log = [];
  const run = async (args) => { const r = await git(args); log.push('$ git ' + args.join(' ') + '\n' + r.out.trim()); return r; };
  const st = await status();
  if (!st.isRepo) throw new Error('This folder is not a git repository, so there is nowhere to publish to yet.');
  await run(['add', '-A', '--', 'docs']);
  const diff = await git(['diff', '--cached', '--quiet', '--', 'docs']);
  if (!diff.ok) {
    const c = await run(['commit', '-m', message || 'Update portfolio content', '--', 'docs']);
    if (!c.ok) throw Object.assign(new Error('Commit failed'), { log });
  } else {
    log.push('No new content changes to commit; pushing anything not yet uploaded.');
  }
  const p = await run(['push']);
  if (!p.ok) throw Object.assign(new Error('Push failed. Check your internet connection or GitHub login (run "gh auth login").'), { log });
  return { log: log.join('\n\n'), siteUrl: config.siteUrl };
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';
  try {
    if (req.method === 'GET' && url.startsWith('/api/schema')) return send(res, 200, require('./schema'));
    if (req.method === 'GET' && url.startsWith('/api/data')) return send(res, 200, readJson(DATA, {}));
    if (req.method === 'GET' && url.startsWith('/api/status')) return send(res, 200, await status());
    if (req.method === 'POST' && url === '/api/data') {
      const body = await readBody(req);
      saveData(body.data);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url === '/api/upload') {
      const body = await readBody(req);
      return send(res, 200, { ok: true, path: saveUpload(body.name, body.data) });
    }
    if (req.method === 'POST' && url === '/api/publish') {
      const body = await readBody(req);
      try { return send(res, 200, Object.assign({ ok: true }, await publish(body.message))); }
      catch (e) { return send(res, 500, { ok: false, error: e.message, log: (e.log || []).join('\n\n') }); }
    }
    if (req.method === 'GET' && (url === '/preview' )) { res.writeHead(302, { Location: '/preview/' }); return res.end(); }
    if (req.method === 'GET' && url.startsWith('/preview/')) return serveStatic(res, SITE, url.slice('/preview/'.length));
    if (req.method === 'GET') return serveStatic(res, PUBLIC, url.slice(1));
    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 400, { ok: false, error: e.message });
  }
});

function openBrowser(u) {
  if (process.env.NO_BROWSER) return;
  const cmd = process.platform === 'win32' ? `start "" "${u}"` : process.platform === 'darwin' ? `open "${u}"` : `xdg-open "${u}"`;
  exec(cmd, () => {});
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Portfolio Manager is already running. Opening http://localhost:${PORT}`);
    openBrowser(`http://localhost:${PORT}`);
    setTimeout(() => process.exit(0), 500);
  } else { console.error(e); process.exit(1); }
});

server.listen(PORT, '127.0.0.1', () => {
  const u = `http://localhost:${PORT}`;
  console.log('');
  console.log('  Portfolio Manager is running:  ' + u);
  console.log('  Local preview of your site:    ' + u + '/preview/');
  if (config.siteUrl) console.log('  Live site:                     ' + config.siteUrl);
  console.log('');
  console.log('  Keep this window open while you edit. Close it when you are done.');
  openBrowser(u);
});
