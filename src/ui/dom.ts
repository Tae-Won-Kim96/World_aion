type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, unknown> & { class?: string; style?: string | Record<string, string | number> };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el: Element, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export const uiRoot = () => document.getElementById('ui')!;

/** 기본 화면 층만 교체 (열린 모달은 유지) */
export function clearTips(): void {
  for (const t of Array.from(document.querySelectorAll('.tip'))) t.remove();
}

export function setScreen(el: HTMLElement): void {
  clearTips();
  const root = uiRoot();
  for (const old of Array.from(root.querySelectorAll(':scope > .screen'))) old.remove();
  root.insertBefore(el, root.firstChild);
}

let modalStack: HTMLElement[] = [];

export function modal(content: Node, opts: { onClose?: () => void; closable?: boolean; wide?: boolean; className?: string } = {}): () => void {
  const close = () => {
    back.remove();
    modalStack = modalStack.filter((m) => m !== back);
    opts.onClose?.();
  };
  const back = h('div', { class: `modal-back ${opts.className ?? ''}` },
    h('div', { class: `modal panel ${opts.wide ? 'wide' : ''}` },
      opts.closable !== false ? h('button', { class: 'modal-x', onclick: close, title: '닫기' }, '✕') : null,
      content,
    ),
  );
  if (opts.closable !== false) back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  uiRoot().appendChild(back);
  modalStack.push(back);
  return close;
}

export function closeAllModals(): void {
  clearTips();
  for (const m of modalStack) m.remove();
  modalStack = [];
}

export function toast(text: string, kind: 'info' | 'warn' | 'good' = 'info'): void {
  const t = h('div', { class: `toast ${kind}` }, text);
  uiRoot().appendChild(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}

export function confirmBox(text: string, yes: string, onYes: () => void, danger = false): void {
  const close = modal(h('div', { class: 'confirm' },
    h('p', null, text),
    h('div', { class: 'row end' },
      h('button', { class: 'btn', onclick: () => close() }, '취소'),
      h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, onclick: () => { close(); onYes(); } }, yes),
    ),
  ));
}

export function tooltip(el: HTMLElement, text: string | (() => string)): HTMLElement {
  el.addEventListener('mouseenter', () => {
    const tip = h('div', { class: 'tip' }, typeof text === 'function' ? text() : text);
    document.body.appendChild(tip);
    const r = el.getBoundingClientRect();
    tip.style.left = `${Math.min(window.innerWidth - tip.offsetWidth - 8, r.left)}px`;
    tip.style.top = `${r.top - tip.offsetHeight - 6 < 0 ? r.bottom + 6 : r.top - tip.offsetHeight - 6}px`;
    const rm = () => { tip.remove(); el.removeEventListener('mouseleave', rm); el.removeEventListener('mousedown', rm); };
    el.addEventListener('mouseleave', rm);
    el.addEventListener('mousedown', rm);
  });
  return el;
}
