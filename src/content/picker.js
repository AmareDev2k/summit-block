// Element picker – injected on demand (popup button / context menu).
// Hover to highlight, click to select, then confirm. The selector is stored per-site and the
// cosmetic engine hides it on every future visit. Press Esc to cancel.

(() => {
  'use strict';
  if (window.__summitPicker) window.__summitPicker.stop();

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });

  function el(tag, styles, text) {
    const n = document.createElement(tag);
    Object.assign(n.style, styles || {});
    if (text) n.textContent = text;
    return n;
  }

  const box = el('div', {
    position: 'fixed', display: 'none', pointerEvents: 'none', boxSizing: 'border-box',
    border: '2px solid #6366f1', background: 'rgba(99,102,241,.18)', borderRadius: '4px'
  });

  const bar = el('div', {
    position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
    pointerEvents: 'auto', background: '#0b1020', color: '#e6e9f5', padding: '12px 14px',
    borderRadius: '12px', font: '13px/1.4 system-ui,sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,.45)',
    border: '1px solid #312e81', maxWidth: '90vw', display: 'flex', gap: '10px', alignItems: 'center'
  });
  const label = el('span', { maxWidth: '50vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    'Summit Block: hover an element and click it. Esc to cancel.');

  function button(text, bg, onClick) {
    const b = el('button', {
      all: 'unset', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
      background: bg, color: '#fff', font: '600 12px system-ui,sans-serif'
    }, text);
    b.addEventListener('click', onClick);
    return b;
  }

  const hideBtn = button('Hide it', '#4f46e5', confirm);
  const parentBtn = button('Parent ↑', '#374151', () => { if (current && current.parentElement) select(current.parentElement); });
  const cancelBtn = button('Cancel', '#374151', stop);
  hideBtn.style.display = parentBtn.style.display = 'none';
  bar.append(label, hideBtn, parentBtn, cancelBtn);
  shadow.append(box, bar);

  let current = null;
  let locked = false;

  function place(r) {
    Object.assign(box.style, {
      display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px'
    });
  }

  function cssPath(node) {
    if (node.id) {
      const s = '#' + CSS.escape(node.id);
      if (document.querySelectorAll(s).length === 1) return s;
    }
    const parts = [];
    let n = node;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      let part = n.localName;
      const classes = [...n.classList].filter((c) => !/\d{3,}/.test(c)).slice(0, 2);
      part += classes.map((c) => '.' + CSS.escape(c)).join('');
      const parent = n.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.matches(part));
        if (same.length > 1) part += `:nth-child(${[...parent.children].indexOf(n) + 1})`;
      }
      parts.unshift(part);
      const sel = parts.join(' > ');
      try { if (document.querySelectorAll(sel).length === 1) return sel; } catch { /* keep climbing */ }
      n = parent;
    }
    return parts.join(' > ');
  }

  function select(node) {
    current = node;
    locked = true;
    place(node.getBoundingClientRect());
    label.textContent = cssPath(node);
    hideBtn.style.display = parentBtn.style.display = 'inline-block';
  }

  function confirm() {
    if (!current) return;
    const selector = cssPath(current);
    chrome.runtime.sendMessage({ type: 'addSelector', selector }).catch(() => {});
    current.style.setProperty('display', 'none', 'important');
    stop();
  }

  const swallow = (e) => {
    if (e.target === host) return; // clicks on our own toolbar
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const onMove = (e) => {
    if (locked) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if (!t || t === host || t === document.documentElement || t === document.body) return;
    current = t;
    place(t.getBoundingClientRect());
  };

  const onClick = (e) => {
    if (e.target === host) return;
    swallow(e);
    if (!locked && current) select(current);
  };

  const onKey = (e) => { if (e.key === 'Escape') stop(); };

  const swallowed = ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'contextmenu'];
  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
  swallowed.forEach((t) => document.addEventListener(t, swallow, true));
  document.documentElement.appendChild(host);

  function stop() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    swallowed.forEach((t) => document.removeEventListener(t, swallow, true));
    host.remove();
    window.__summitPicker = null;
  }

  window.__summitPicker = { stop };
})();
