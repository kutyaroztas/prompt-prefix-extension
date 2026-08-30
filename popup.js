const STORAGE_KEY = 'promptPrefixes';
const listEl = document.getElementById('list');

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function renderItem(p, i) {
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div class="row">
      <input type="text" data-field="label" data-i="${i}" value="${escapeAttr(p.label)}">
      <button class="del" data-i="${i}">Sil</button>
    </div>
    <textarea data-field="text" data-i="${i}"></textarea>
  `;
  div.querySelector('textarea').value = p.text; // XSS'siz set etmek icin value ile
  return div;
}

async function load() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const prefixes = data[STORAGE_KEY] || [];
  listEl.innerHTML = '';
  prefixes.forEach((p, i) => listEl.appendChild(renderItem(p, i)));

  listEl.querySelectorAll('.del').forEach((b) => {
    b.onclick = async () => {
      const cur = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || [];
      cur.splice(Number(b.dataset.i), 1);
      await chrome.storage.local.set({ [STORAGE_KEY]: cur });
      load();
    };
  });
}

document.getElementById('add').onclick = async () => {
  const cur = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || [];
  cur.push({ label: 'Yeni', text: '' });
  await chrome.storage.local.set({ [STORAGE_KEY]: cur });
  load();
};

document.getElementById('save').onclick = async () => {
  const cur = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || [];
  listEl.querySelectorAll('[data-field]').forEach((el) => {
    const i = Number(el.dataset.i);
    if (cur[i]) cur[i][el.dataset.field] = el.value;
  });
  await chrome.storage.local.set({ [STORAGE_KEY]: cur });
  window.close();
};

load();
