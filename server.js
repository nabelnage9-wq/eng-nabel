'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'site.sqlite'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    summary_ar TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    body_ar TEXT NOT NULL DEFAULT '',
    body_en TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    link_url TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    language TEXT NOT NULL DEFAULT '',
    price TEXT NOT NULL DEFAULT '',
    duration TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'manual',
    source_id TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(source, source_id)
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY(admin_id) REFERENCES admins(id)
  );
`);

const DEFAULT_SETTINGS = {
  name_ar: 'نبيل ناجي نبيل',
  name_en: 'Nabil Nagy Nabil',
  headline_ar: 'طالب بكلية الحاسبات والمعلومات | مهتم بتطوير الويب وتطبيقاته وقواعد البيانات',
  headline_en: 'Computer Science student | Interested in web development, web apps, and databases',
  bio_ar: 'أنا نبيل ناجي نبيل، طالب بكلية الحاسبات والمعلومات في جامعة الزقازيق. أتعلم تطوير مواقع الويب وتطبيقات الويب وقواعد البيانات، وأسعى إلى تنمية مهاراتي من خلال تنفيذ مشاريع عملية ومشاركة أعمالي.',
  bio_en: 'I’m Nabil Nagy Nabil, a Computer Science student at Zagazig University. I’m learning web development, web applications, and databases, and building practical projects to grow my skills.',
  education_ar: 'كلية الحاسبات والمعلومات',
  education_en: 'Faculty of Computers and Information',
  university_ar: 'جامعة الزقازيق',
  university_en: 'Zagazig University',
  profile_image: 'profile.jpg',
  email: 'nabelnage9@gmail.com',
  phone: '01070436543',
  whatsapp: '201070436543',
  facebook: 'https://www.facebook.com/nabel.nage.2025',
  instagram: 'https://www.instagram.com/nage.nabel/',
  tiktok: 'https://www.tiktok.com/@nabelnage',
  github_username: '',
  availability_ar: 'متاح لفرص التدريب والعمل والتعاون',
  availability_en: 'Open to training, work, and collaboration'
};

const now = () => new Date().toISOString();
const sessions = new Map();
const loginAttempts = new Map();
const CONTENT_KINDS = new Set(['projects', 'courses', 'certificates', 'articles', 'videos', 'services', 'experiences', 'skills']);
const PUBLIC_FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/script.js', ['script.js', 'text/javascript; charset=utf-8']],
  ['/profile.jpg', ['profile.jpg', 'image/jpeg']],
  ['/admin', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.html', ['admin.html', 'text/html; charset=utf-8']],
  ['/admin.css', ['admin.css', 'text/css; charset=utf-8']],
  ['/admin.js', ['admin.js', 'text/javascript; charset=utf-8']]
]);

for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  db.prepare('INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)').run(key, value);
}

const skillCount = db.prepare("SELECT COUNT(*) AS n FROM content WHERE kind = 'skills' AND source = 'manual'").get().n;
if (!skillCount) {
  const addSkill = db.prepare(`INSERT INTO content(kind,title_ar,title_en,summary_ar,summary_en,published,source,source_id,sort_order,created_at,updated_at)
    VALUES ('skills',?,?,?, ?,1,'manual',?,?,?,?)`);
  const initialSkills = [
    ['HTML', 'HTML', 'قيد التعلم', 'Learning', 1], ['CSS', 'CSS', 'قيد التعلم', 'Learning', 2],
    ['JavaScript', 'JavaScript', 'قيد التعلم', 'Learning', 3], ['SQL', 'SQL', 'قيد التعلم', 'Learning', 4],
    ['Python', 'Python', 'قيد التعلم', 'Learning', 5]
  ];
  for (const [ar, en, summaryAr, summaryEn, order] of initialSkills) {
    addSkill.run(ar, en, summaryAr, summaryEn, `skill-${order}`, order, now(), now());
  }
}

function settingObject() {
  const out = {};
  for (const row of db.prepare('SELECT key, value FROM settings').all()) out[row.key] = row.value;
  return out;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return cookies;
}

function getSession(req) {
  const sid = parseCookies(req).nabil_session;
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session || session.expires < Date.now()) {
    sessions.delete(sid);
    return null;
  }
  session.expires = Date.now() + 12 * 60 * 60 * 1000;
  return { sid, ...session };
}

function setSessionCookie(res, sid, req) {
  const secure = Boolean(req.socket.encrypted) || (process.env.TRUST_PROXY === '1' && req.headers['x-forwarded-proto'] === 'https');
  res.setHeader('Set-Cookie', `nabil_session=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`);
}

function clearSessionCookie(res, req) {
  const secure = Boolean(req.socket.encrypted) || (process.env.TRUST_PROXY === '1' && req.headers['x-forwarded-proto'] === 'https');
  res.setHeader('Set-Cookie', `nabil_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`);
}

function originIsLocal(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

async function readJson(req, maxBytes = 512 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

function cleanText(value, max = 5000) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanUrl(value) {
  const raw = cleanText(value, 1500);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch { return ''; }
}

function normalizeContent(input, existing = {}) {
  const kind = CONTENT_KINDS.has(input.kind) ? input.kind : existing.kind;
  if (!kind) throw Object.assign(new Error('Choose a content type.'), { status: 400 });
  const titleAr = cleanText(input.title_ar ?? existing.title_ar, 180);
  const titleEn = cleanText(input.title_en ?? existing.title_en, 180);
  if (!titleAr && !titleEn) throw Object.assign(new Error('Add a title in Arabic or English.'), { status: 400 });
  let tags = input.tags ?? existing.tags ?? [];
  if (typeof tags === 'string') tags = tags.split(',');
  if (!Array.isArray(tags)) tags = [];
  tags = tags.map(t => cleanText(t, 40)).filter(Boolean).slice(0, 12);
  return {
    kind,
    title_ar: titleAr || titleEn,
    title_en: titleEn || titleAr,
    summary_ar: cleanText(input.summary_ar ?? existing.summary_ar, 500),
    summary_en: cleanText(input.summary_en ?? existing.summary_en, 500),
    body_ar: cleanText(input.body_ar ?? existing.body_ar, 12000),
    body_en: cleanText(input.body_en ?? existing.body_en, 12000),
    image_url: cleanUrl(input.image_url ?? existing.image_url),
    link_url: cleanUrl(input.link_url ?? existing.link_url),
    tags: JSON.stringify(tags),
    language: cleanText(input.language ?? existing.language, 50),
    price: cleanText(input.price ?? existing.price, 50),
    duration: cleanText(input.duration ?? existing.duration, 80),
    published: input.published === undefined ? (existing.published === undefined ? 1 : existing.published) : (input.published ? 1 : 0),
    sort_order: Number.isFinite(Number(input.sort_order ?? existing.sort_order)) ? Math.trunc(Number(input.sort_order ?? existing.sort_order)) : 0
  };
}

function contentRow(row) {
  return { ...row, tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(), published: Boolean(row.published) };
}

function audit(adminId, action, entity, entityId = '') {
  db.prepare('INSERT INTO audit_log(admin_id,action,entity,entity_id,created_at) VALUES (?,?,?,?,?)')
    .run(adminId, action, entity, String(entityId), now());
}

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function passwordValid(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 200 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

function adminCount() { return db.prepare('SELECT COUNT(*) AS n FROM admins').get().n; }

function rateLimited(key) {
  const recent = (loginAttempts.get(key) || []).filter(t => Date.now() - t < 15 * 60 * 1000);
  if (recent.length >= 8) return true;
  recent.push(Date.now());
  loginAttempts.set(key, recent);
  return false;
}

function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session) { sendJson(res, 401, { error: 'Please sign in again.' }); return null; }
  return session;
}

async function syncGithub(username) {
  const cleanUsername = cleanText(username, 39);
  if (!/^[A-Za-z0-9-]{1,39}$/.test(cleanUsername) || cleanUsername.startsWith('-') || cleanUsername.endsWith('-')) {
    throw new Error('Enter a valid public GitHub username in Settings first.');
  }
  const allRepos = [];
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?type=owner&sort=updated&per_page=100&page=${page}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Nabil-Portfolio-Site' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(response.status === 404 ? 'GitHub username was not found.' : `GitHub returned status ${response.status}.`);
    const repos = await response.json();
    allRepos.push(...repos);
    if (repos.length < 100) break;
  }
  const visible = allRepos.filter(repo => !repo.private && !repo.fork && !repo.disabled);
  const upsert = db.prepare(`INSERT INTO content(kind,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,link_url,tags,language,published,source,source_id,sort_order,created_at,updated_at)
    VALUES ('projects',?,?,?,?,?,?,?,?,?,1,'github',?,?,?,?)
    ON CONFLICT(source,source_id) DO UPDATE SET title_ar=excluded.title_ar,title_en=excluded.title_en,summary_ar=excluded.summary_ar,summary_en=excluded.summary_en,link_url=excluded.link_url,tags=excluded.tags,language=excluded.language,published=1,updated_at=excluded.updated_at`);
  const seen = new Set();
  for (const repo of visible) {
    const id = String(repo.id);
    seen.add(id);
    const description = cleanText(repo.description || `GitHub repository: ${repo.name}`, 500);
    const tags = JSON.stringify((repo.topics || []).slice(0, 12));
    upsert.run(repo.name, repo.name, description, description, description, description, cleanUrl(repo.html_url), tags, cleanText(repo.language || '', 50), `github:${id}`, Number(repo.stargazers_count || 0), now(), now());
  }
  const oldRepos = db.prepare("SELECT id,source_id FROM content WHERE source='github'").all();
  const hide = db.prepare("UPDATE content SET published=0,updated_at=? WHERE id=?");
  for (const row of oldRepos) if (!seen.has(row.source_id.replace(/^github:/, ''))) hide.run(now(), row.id);
  db.prepare("INSERT INTO settings(key,value) VALUES ('github_last_sync',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(now());
  db.prepare("INSERT INTO settings(key,value) VALUES ('github_last_error','') ON CONFLICT(key) DO UPDATE SET value=''").run();
  return { synced: visible.length, ignored: allRepos.length - visible.length, username: cleanUsername };
}

async function automaticGithubSync() {
  const username = settingObject().github_username;
  if (!username) return;
  try { await syncGithub(username); }
  catch (error) {
    db.prepare("INSERT INTO settings(key,value) VALUES ('github_last_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(cleanText(error.message, 300));
    console.error('GitHub sync failed:', error.message);
  }
}

function secureHeaders(res, req) {
  const secure = Boolean(req.socket.encrypted) || (process.env.TRUST_PROXY === '1' && req.headers['x-forwarded-proto'] === 'https');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if (secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
}

async function handleApi(req, res, url) {
  const method = req.method;
  const route = url.pathname;
  if (method === 'GET' && route === '/api/health') return sendJson(res, 200, { ok: true });
  if (method === 'GET' && route === '/api/setup-status') return sendJson(res, 200, { needsSetup: adminCount() === 0 });
  if (method === 'GET' && route === '/api/public/settings') return sendJson(res, 200, settingObject());
  if (method === 'GET' && route === '/api/public/content') {
    const kind = url.searchParams.get('kind');
    if (kind && !CONTENT_KINDS.has(kind)) return sendJson(res, 400, { error: 'Unknown content type.' });
    const rows = kind
      ? db.prepare('SELECT * FROM content WHERE published=1 AND kind=? ORDER BY sort_order ASC, updated_at DESC').all(kind)
      : db.prepare('SELECT * FROM content WHERE published=1 ORDER BY kind ASC, sort_order ASC, updated_at DESC').all();
    return sendJson(res, 200, rows.map(contentRow));
  }
  if (method === 'POST' && route === '/api/setup') {
    if (!originIsLocal(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    if (adminCount() !== 0) return sendJson(res, 409, { error: 'Setup is already complete.' });
    const input = await readJson(req, 20 * 1024);
    const username = cleanText(input.username, 40);
    const email = cleanText(input.email, 160).toLowerCase();
    const password = String(input.password || '');
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) return sendJson(res, 400, { error: 'Username must be 3–40 letters, numbers, dots, underscores, or hyphens.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, { error: 'Enter a valid email address.' });
    if (!passwordValid(password)) return sendJson(res, 400, { error: 'Use at least 12 characters with uppercase, lowercase, and a number.' });
    if (input.password !== input.confirmPassword) return sendJson(res, 400, { error: 'Passwords do not match.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const result = db.prepare('INSERT INTO admins(username,email,password_hash,password_salt,created_at) VALUES (?,?,?,?,?)').run(username, email, passwordHash(password, salt), salt, now());
    const adminId = Number(result.lastInsertRowid);
    audit(adminId, 'create', 'primary-admin', adminId);
    const sid = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(24).toString('hex');
    sessions.set(sid, { adminId, username, csrf, expires: Date.now() + 12 * 60 * 60 * 1000 });
    setSessionCookie(res, sid, req);
    return sendJson(res, 201, { authenticated: true, username, csrf });
  }
  if (method === 'POST' && route === '/api/login') {
    if (!originIsLocal(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    const ip = req.socket.remoteAddress || 'local';
    if (rateLimited(ip)) return sendJson(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const input = await readJson(req, 20 * 1024);
    const identity = cleanText(input.identity, 180).toLowerCase();
    const admin = db.prepare('SELECT * FROM admins WHERE lower(username)=? OR lower(email)=? LIMIT 1').get(identity, identity);
    const salt = admin?.password_salt || 'invalid-user-salt';
    const candidate = Buffer.from(passwordHash(String(input.password || ''), salt), 'hex');
    const expected = Buffer.from(admin?.password_hash || crypto.randomBytes(64).toString('hex'), 'hex');
    if (!admin || candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected)) return sendJson(res, 401, { error: 'The username/email or password is incorrect.' });
    loginAttempts.delete(ip);
    const sid = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(24).toString('hex');
    sessions.set(sid, { adminId: admin.id, username: admin.username, csrf, expires: Date.now() + 12 * 60 * 60 * 1000 });
    setSessionCookie(res, sid, req);
    audit(admin.id, 'login', 'admin', admin.id);
    return sendJson(res, 200, { authenticated: true, username: admin.username, csrf });
  }
  if (method === 'GET' && route === '/api/admin/session') {
    const session = getSession(req);
    return sendJson(res, 200, session ? { authenticated: true, username: session.username, csrf: session.csrf } : { authenticated: false });
  }
  if (method === 'POST' && route === '/api/logout') {
    if (!originIsLocal(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    const session = requireAdmin(req, res);
    if (!session) return;
    const input = await readJson(req, 20 * 1024);
    if (input.csrf !== session.csrf) return sendJson(res, 403, { error: 'Request token expired. Sign in again.' });
    sessions.delete(session.sid);
    clearSessionCookie(res, req);
    audit(session.adminId, 'logout', 'admin', session.adminId);
    return sendJson(res, 200, { ok: true });
  }

  if (!route.startsWith('/api/admin/')) return sendJson(res, 404, { error: 'Not found.' });
  if (!originIsLocal(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
  const session = requireAdmin(req, res);
  if (!session) return;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = req.headers['x-csrf-token'];
    if (!csrf || csrf !== session.csrf) return sendJson(res, 403, { error: 'Request token expired. Sign in again.' });
  }

  if (method === 'GET' && route === '/api/admin/content') {
    const kind = url.searchParams.get('kind');
    if (kind && !CONTENT_KINDS.has(kind)) return sendJson(res, 400, { error: 'Unknown content type.' });
    const rows = kind ? db.prepare('SELECT * FROM content WHERE kind=? ORDER BY sort_order,updated_at DESC').all(kind)
      : db.prepare('SELECT * FROM content ORDER BY kind,sort_order,updated_at DESC').all();
    return sendJson(res, 200, rows.map(contentRow));
  }
  if (method === 'GET' && route === '/api/admin/settings') return sendJson(res, 200, settingObject());
  if (method === 'PUT' && route === '/api/admin/settings') {
    const input = await readJson(req, 80 * 1024);
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const updates = {};
    for (const key of allowed) if (input[key] !== undefined) updates[key] = cleanText(input[key], key.includes('bio') ? 4000 : 1000);
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) return sendJson(res, 400, { error: 'Enter a valid contact email.' });
    if (updates.github_username && !/^[A-Za-z0-9-]{1,39}$/.test(updates.github_username)) return sendJson(res, 400, { error: 'Enter a valid GitHub username.' });
    const stmt = db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const [key, value] of Object.entries(updates)) stmt.run(key, value);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    audit(session.adminId, 'update', 'settings', Object.keys(updates).join(','));
    if (Object.hasOwn(updates, 'github_username')) automaticGithubSync();
    return sendJson(res, 200, settingObject());
  }
  if (method === 'POST' && route === '/api/admin/github-sync') {
    const settings = settingObject();
    try {
      const result = await syncGithub(settings.github_username || '');
      audit(session.adminId, 'sync', 'github', result.username);
      return sendJson(res, 200, result);
    } catch (error) {
      db.prepare("INSERT INTO settings(key,value) VALUES ('github_last_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(cleanText(error.message, 300));
      return sendJson(res, 502, { error: cleanText(error.message, 300) });
    }
  }
  if (method === 'POST' && route === '/api/admin/content') {
    const input = await readJson(req);
    const item = normalizeContent(input);
    const time = now();
    const result = db.prepare(`INSERT INTO content(kind,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,image_url,link_url,tags,language,price,duration,published,source,source_id,sort_order,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'manual',?,?,?,?)`).run(item.kind,item.title_ar,item.title_en,item.summary_ar,item.summary_en,item.body_ar,item.body_en,item.image_url,item.link_url,item.tags,item.language,item.price,item.duration,item.published,`manual:${crypto.randomUUID()}`,item.sort_order,time,time);
    const id = Number(result.lastInsertRowid);
    audit(session.adminId, 'create', item.kind, id);
    return sendJson(res, 201, contentRow(db.prepare('SELECT * FROM content WHERE id=?').get(id)));
  }
  const contentMatch = route.match(/^\/api\/admin\/content\/(\d+)$/);
  if (contentMatch && method === 'PUT') {
    const id = Number(contentMatch[1]);
    const existing = db.prepare('SELECT * FROM content WHERE id=?').get(id);
    if (!existing || existing.source === 'github') return sendJson(res, 404, { error: 'Editable item not found.' });
    const input = await readJson(req);
    const item = normalizeContent(input, existing);
    db.prepare(`UPDATE content SET kind=?,title_ar=?,title_en=?,summary_ar=?,summary_en=?,body_ar=?,body_en=?,image_url=?,link_url=?,tags=?,language=?,price=?,duration=?,published=?,sort_order=?,updated_at=? WHERE id=?`)
      .run(item.kind,item.title_ar,item.title_en,item.summary_ar,item.summary_en,item.body_ar,item.body_en,item.image_url,item.link_url,item.tags,item.language,item.price,item.duration,item.published,item.sort_order,now(),id);
    audit(session.adminId, 'update', item.kind, id);
    return sendJson(res, 200, contentRow(db.prepare('SELECT * FROM content WHERE id=?').get(id)));
  }
  if (contentMatch && method === 'DELETE') {
    const id = Number(contentMatch[1]);
    const existing = db.prepare('SELECT * FROM content WHERE id=?').get(id);
    if (!existing || existing.source === 'github') return sendJson(res, 404, { error: 'Editable item not found.' });
    db.prepare('DELETE FROM content WHERE id=?').run(id);
    audit(session.adminId, 'delete', existing.kind, id);
    return sendJson(res, 200, { ok: true });
  }
  return sendJson(res, 404, { error: 'Not found.' });
}

function serveStatic(req, res, pathname) {
  const entry = PUBLIC_FILES.get(pathname);
  if (!entry) return sendJson(res, 404, { error: 'Not found.' });
  const [fileName, type] = entry;
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) return sendJson(res, 404, { error: 'File not found.' });
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': fileName.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  secureHeaders(res, req);
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); }
  catch { return sendJson(res, 400, { error: 'Invalid URL.' }); }
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = error.status || 500;
    if (!res.headersSent) sendJson(res, status, { error: status < 500 ? error.message : 'An unexpected server error occurred.' });
    if (status >= 500) console.error('Request failed:', error.message);
  }
});

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`Nabil website is running at http://${host}:${port}`);
  console.log('Open /admin to set up the primary admin account.');
});
setInterval(automaticGithubSync, 10 * 60 * 1000).unref();

process.on('SIGINT', () => { try { db.close(); } finally { process.exit(0); } });
process.on('SIGTERM', () => { try { db.close(); } finally { process.exit(0); } });
