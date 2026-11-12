'use strict';

const authCard = document.getElementById('authCard');
const dashboard = document.getElementById('dashboard');
const setupForm = document.getElementById('setupForm');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const contentForm = document.getElementById('contentForm');
const contentList = document.getElementById('contentList');
let csrfToken = '';
let items = [];
let toastTimer;

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (['POST','PUT','PATCH','DELETE'].includes(options.method)) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  let body = {};
  try { body = await response.json(); } catch {}
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function announce(message, element = authMessage) { element.textContent = message || ''; }
function toast(message) {
  const box = document.getElementById('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
}

function showAuth(setup) {
  authCard.hidden = false;
  dashboard.hidden = true;
  setupForm.hidden = !setup;
  loginForm.hidden = setup;
  document.getElementById('authTitle').textContent = setup ? 'Create your primary admin' : 'Admin sign in';
  document.getElementById('authHint').textContent = setup ? 'This one-time setup creates the owner account. Choose a strong password and keep it private.' : 'Manage your website content securely.';
  announce('');
}

async function showDashboard(username) {
  authCard.hidden = true;
  dashboard.hidden = false;
  document.getElementById('signedInAs').textContent = `Signed in as ${username}`;
  await Promise.all([loadSettings(), loadContent()]);
}

async function refreshAuth() {
  const setup = await fetch('/api/setup-status', { cache: 'no-store' }).then(r => r.json());
  const session = await fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin' }).then(r => r.json());
  if (session.authenticated) {
    csrfToken = session.csrf;
    await showDashboard(session.username);
  } else showAuth(setup.needsSetup);
}

setupForm.addEventListener('submit', async event => {
  event.preventDefault();
  announce('Creating account…');
  const data = Object.fromEntries(new FormData(setupForm));
  try {
    const result = await api('/api/setup', { method: 'POST', body: JSON.stringify(data) });
    csrfToken = result.csrf;
    await showDashboard(result.username);
    toast('Primary admin account created.');
  } catch (error) { announce(error.message); }
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  announce('Signing in…');
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const result = await api('/api/login', { method: 'POST', body: JSON.stringify(data) });
    csrfToken = result.csrf;
    await showDashboard(result.username);
  } catch (error) { announce(error.message); }
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST', body: JSON.stringify({ csrf: csrfToken }) }); }
  finally { csrfToken = ''; showAuth(false); }
});

document.querySelectorAll('.side-link').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.side-link').forEach(link => link.classList.toggle('active', link === button));
  document.getElementById('contentPanel').hidden = button.dataset.tab !== 'content';
  document.getElementById('settingsPanel').hidden = button.dataset.tab !== 'settings';
}));

function resetContentForm() {
  contentForm.reset();
  contentForm.elements.id.value = '';
  contentForm.elements.sort_order.value = '0';
  contentForm.elements.published.checked = true;
  document.getElementById('editorTitle').textContent = 'Add content';
  announce('', document.getElementById('formMessage'));
}

document.getElementById('newContentButton').addEventListener('click', () => {
  resetContentForm();
  contentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  contentForm.elements.kind.focus();
});
document.getElementById('clearFormButton').addEventListener('click', resetContentForm);
document.getElementById('kindFilter').addEventListener('change', renderContentList);

contentForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(contentForm));
  data.id = data.id || undefined;
  data.tags = String(data.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  data.published = contentForm.elements.published.checked;
  data.sort_order = Number(data.sort_order || 0);
  const id = contentForm.elements.id.value;
  const url = id ? `/api/admin/content/${id}` : '/api/admin/content';
  const method = id ? 'PUT' : 'POST';
  const message = document.getElementById('formMessage');
  announce('Saving…', message);
  try {
    await api(url, { method, body: JSON.stringify(data) });
    resetContentForm();
    await loadContent();
    toast(id ? 'Changes saved.' : 'Content added to the site.');
  } catch (error) { announce(error.message, message); }
});

async function loadContent() {
  items = await api('/api/admin/content');
  renderContentList();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function renderContentList() {
  const filter = document.getElementById('kindFilter').value;
  const list = filter ? items.filter(item => item.kind === filter) : items;
  if (!list.length) {
    contentList.innerHTML = '<p class="muted">No content in this section yet. Use “Add content” to create one.</p>';
    return;
  }
  contentList.innerHTML = list.map(item => `
    <article class="content-row">
      <div class="content-row-top"><div><h3>${escapeHtml(item.title_en || item.title_ar)}</h3><p>${escapeHtml(item.kind)}${item.source === 'github' ? ' · GitHub' : ''}</p></div><span class="pill ${item.published ? '' : 'draft'}">${item.published ? 'Published' : 'Draft'}</span></div>
      <div class="row-actions">${item.source === 'github' ? '<span class="muted">Synced from GitHub</span>' : `<button type="button" data-edit="${item.id}">Edit</button><button type="button" class="delete" data-delete="${item.id}">Delete</button>`}</div>
    </article>`).join('');
  contentList.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => editItem(Number(button.dataset.edit))));
  contentList.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteItem(Number(button.dataset.delete))));
}

function editItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  for (const name of ['id','kind','title_ar','title_en','summary_ar','summary_en','body_ar','body_en','image_url','link_url','language','price','duration','sort_order']) {
    if (contentForm.elements[name]) contentForm.elements[name].value = item[name] ?? '';
  }
  contentForm.elements.tags.value = (item.tags || []).join(', ');
  contentForm.elements.published.checked = Boolean(item.published);
  document.getElementById('editorTitle').textContent = 'Edit content';
  contentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item || !confirm(`Delete “${item.title_en || item.title_ar}”? This cannot be undone.`)) return;
  try {
    await api(`/api/admin/content/${id}`, { method: 'DELETE' });
    if (contentForm.elements.id.value === String(id)) resetContentForm();
    await loadContent();
    toast('Content deleted.');
  } catch (error) { toast(error.message); }
}

const settingsFields = ['name_ar','name_en','headline_ar','headline_en','bio_ar','bio_en','education_ar','education_en','university_ar','university_en','profile_image','email','phone','whatsapp','github_username','facebook','instagram','tiktok','availability_ar','availability_en'];
async function loadSettings() {
  const settings = await api('/api/admin/settings');
  const form = document.getElementById('settingsForm');
  for (const key of settingsFields) if (form.elements[key]) form.elements[key].value = settings[key] || '';
  updateGithubStatus(settings);
}

function updateGithubStatus(settings) {
  const status = document.getElementById('githubStatus');
  if (settings.github_last_error) status.textContent = `Last sync issue: ${settings.github_last_error}`;
  else if (settings.github_last_sync) status.textContent = `Last synced: ${new Date(settings.github_last_sync).toLocaleString()}`;
  else status.textContent = settings.github_username ? 'No successful sync yet.' : 'Add your public GitHub username and save to enable automatic sync.';
}

document.getElementById('settingsForm').addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const message = document.getElementById('settingsMessage');
  announce('Saving…', message);
  try {
    const settings = await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
    announce('Settings saved.', message);
    updateGithubStatus(settings);
    toast('Website settings saved.');
  } catch (error) { announce(error.message, message); }
});

document.getElementById('syncGithubButton').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Syncing…';
  try {
    const result = await api('/api/admin/github-sync', { method: 'POST', body: '{}' });
    toast(`${result.synced} public repositories synced.`);
    await Promise.all([loadContent(), loadSettings()]);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = 'Sync now'; }
});

refreshAuth().catch(error => showAuth(true));
