(function () {
  'use strict';

  const STORAGE_KEY = 'promptPrefixes';

  const DEFAULT_PREFIXES = [
    { label: 'Ekonomist', text: 'Finans alaninda calisan, para piyasalari konusunda 20 yillik deneyime sahip uzman bir ekonomistsin. ' },
    { label: 'Yazilim Mimari', text: 'Kidemli bir yazilim mimarisin, cevaplarini teknik ve oz ver. ' },
    { label: 'Elestirel Analist', text: 'Varsayimlari sorgulayan, karsit gorusleri de sunan elestirel bir analiz yap. ' },
  ];

  async function getPrefixes() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || DEFAULT_PREFIXES;
  }

  // Ilk calistirmada varsayilanlari storage'a yaz (popup bos gelmesin)
  (async () => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    if (!data[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_PREFIXES });
    }
  })();

  // textarea/input icin: native setter + input event (React/controlled input state'ini gunceller)
  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.selectionStart = el.selectionEnd = el.value.length;
  }

  function prependToActiveField(prefixText) {
    const el = document.activeElement;

    if (!el || el === document.body) {
      alert('Once soru kutusuna tikla (icine imleci koy), sonra butonu kullan.');
      return;
    }

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      setNativeValue(el, prefixText + el.value);
      el.focus();
      return;
    }

    if (el.isContentEditable) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(true); // imleci en basa al
      sel.removeAllRanges();
      sel.addRange(range);
      // execCommand native beforeinput/input tetikler -> ProseMirror vb. editorler yakalar
      document.execCommand('insertText', false, prefixText);
      return;
    }

    alert('Odaklanilan alan bir metin kutusu gibi gorunmuyor.\n' +
          '(Site shadow DOM kullaniyor olabilir - DevTools ile kontrol et.)');
  }

  let menuEl, wrapEl;

  async function renderMenu() {
    if (!menuEl) return;
    menuEl.innerHTML = '';
    const prefixes = await getPrefixes();
    if (prefixes.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'Kayitli prompt yok. Eklenti ikonuna tikla.';
      empty.style.cssText = 'padding:8px 10px;color:#9ca3af;font-size:12px;';
      menuEl.appendChild(empty);
      return;
    }
    prefixes.forEach((p) => {
      const item = document.createElement('div');
      item.textContent = p.label;
      item.style.cssText = 'padding:8px 10px;color:#f3f4f6;cursor:pointer;border-radius:6px;font-size:13px;';
      item.onmouseenter = () => (item.style.background = '#374151');
      item.onmouseleave = () => (item.style.background = 'transparent');
      item.onclick = () => {
        prependToActiveField(p.text);
        menuEl.style.display = 'none';
      };
      menuEl.appendChild(item);
    });
  }

  function buildUI() {
    wrapEl = document.createElement('div');
    wrapEl.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:sans-serif;';

    const btn = document.createElement('button');
    btn.textContent = '🧩 Prompt Ekle';
    btn.style.cssText = 'padding:8px 14px;border-radius:8px;border:none;background:#2563eb;' +
      'color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:13px;';

    menuEl = document.createElement('div');
    menuEl.style.cssText = 'display:none;position:absolute;bottom:40px;right:0;background:#1f2937;' +
      'border-radius:8px;padding:6px;min-width:220px;max-height:320px;overflow-y:auto;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.4);';

    btn.onclick = async () => {
      const willOpen = menuEl.style.display === 'none';
      if (willOpen) await renderMenu();
      menuEl.style.display = willOpen ? 'block' : 'none';
    };

    document.addEventListener('click', (e) => {
      if (!wrapEl.contains(e.target)) menuEl.style.display = 'none';
    });

    // Buton/menu ogeleri odaklanabilir degil (div/button) - tiklaninca tarayici
    // varsayilan olarak mevcut odagi (senin yazdigin input/contenteditable) kaldirip
    // body'e tasiyor. Bunu engelleyerek input'un odagini koruyoruz.
    wrapEl.addEventListener('mousedown', (e) => e.preventDefault());

    wrapEl.appendChild(menuEl);
    wrapEl.appendChild(btn);
    document.body.appendChild(wrapEl);
  }

  // Popup'ta liste degisirse acik menude aninda yansisin
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      renderMenu();
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    buildUI();
  } else {
    window.addEventListener('DOMContentLoaded', buildUI);
  }
})();
