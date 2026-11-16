/* =====================================================================
   dc-runtime — a small, standalone renderer for the design-canvas
   template format used by src/ui/*.html, so the exact same template and
   logic class run on any static host (GitHub Pages) without the
   Claude Design runtime.

   Supported template features (the subset the UI actually uses):
     {{a.b.c}}                       dotted lookup (text & attributes)
     <sc-for list="{{xs}}" as="x">   repeat children, x in scope
     <sc-if value="{{flag}}">        render children when truthy
     onClick / onChange / …          event attributes bound to functions
     style="--var: {{v}}; …"         style strings incl. custom properties
   ===================================================================== */
import React from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;

const EVENTS = {
  onclick: 'onClick', ondblclick: 'onDoubleClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit',
  onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onfocus: 'onFocus', onblur: 'onBlur',
  onmousemove: 'onMouseMove', onmouseleave: 'onMouseLeave', onmouseenter: 'onMouseEnter', onmousedown: 'onMouseDown', onmouseup: 'onMouseUp',
  onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp', onpointerleave: 'onPointerLeave',
  ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd', onwheel: 'onWheel', onscroll: 'onScroll', ontoggle: 'onToggle',
  oncontextmenu: 'onContextMenu', onpaste: 'onPaste', ondragover: 'onDragOver', ondrop: 'onDrop'
};
const ATTRS = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength',
  inputmode: 'inputMode', autocomplete: 'autoComplete', autofocus: 'autoFocus', spellcheck: 'spellCheck', enterkeyhint: 'enterKeyHint',
  contenteditable: 'contentEditable', crossorigin: 'crossOrigin', novalidate: 'noValidate', colspan: 'colSpan', rowspan: 'rowSpan',
  datetime: 'dateTime', accesskey: 'accessKey', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace'
};
const BOOLS = new Set(['disabled', 'checked', 'selected', 'readOnly', 'required', 'autoFocus', 'multiple', 'hidden', 'open', 'noValidate']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const NO_TEXT = new Set(['select', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'colgroup', 'textarea']);
const FORM_CTRL = new Set(['input', 'textarea', 'select']);

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/* ---------- compile: DOM → plain tree ---------- */

function literal(src) {
  if (src === 'true') return { v: true };
  if (src === 'false') return { v: false };
  if (src === 'null') return { v: null };
  if (/^-?\d+(\.\d+)?$/.test(src)) return { v: Number(src) };
  const q = /^(['"])(.*)\1$/.exec(src);
  if (q) return { v: q[2] };
  return null;
}

function parseExpr(src) {
  const lit = literal(src);
  return lit ? { lit: lit.v } : { path: src.split('.') };
}

/** "a {{b}} c" → { parts:[...], single: expr|null } */
function parseValue(str) {
  const parts = [];
  let last = 0, m, holes = 0;
  HOLE.lastIndex = 0;
  while ((m = HOLE.exec(str))) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push(parseExpr(m[1]));
    holes++;
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  if (!holes) return { static: str };
  if (parts.length === 1) return { single: parts[0] };
  return { parts };
}

function compileChildren(nodeList, parentTag) {
  const out = [];
  nodeList.forEach((n) => {
    const c = compileNode(n, parentTag);
    if (c !== null) out.push(c);
  });
  return out;
}

function compileNode(n, parentTag) {
  if (n.nodeType === 3) {
    const txt = n.nodeValue;
    if (!/\S/.test(txt)) return NO_TEXT.has(parentTag) ? null : { k: 'text', v: { static: ' ' } };
    return { k: 'text', v: parseValue(txt) };
  }
  if (n.nodeType !== 1) return null;
  const tag = n.localName;
  if (tag === 'sc-for') {
    const list = parseValue(n.getAttribute('list') || '');
    return { k: 'for', list, as: n.getAttribute('as') || 'item', kids: compileChildren(n.childNodes, parentTag) };
  }
  if (tag === 'sc-if') {
    return { k: 'if', test: parseValue(n.getAttribute('value') || ''), kids: compileChildren(n.childNodes, parentTag) };
  }
  const svg = n.namespaceURI === SVG_NS;
  const attrs = [];
  for (const a of Array.from(n.attributes)) {
    const raw = a.name;
    if (raw.startsWith('hint-placeholder')) continue;
    const lower = raw.toLowerCase();
    let name, kind = 'attr';
    if (EVENTS[lower]) { name = EVENTS[lower]; kind = 'event'; }
    else if (lower === 'style') { name = 'style'; kind = 'style'; }
    else if (ATTRS[lower]) name = ATTRS[lower];
    else if (lower.startsWith('aria-') || lower.startsWith('data-')) name = lower;
    else if (svg && raw.includes('-')) name = camel(raw);
    else name = raw;
    attrs.push({ name, kind, val: parseValue(a.value) });
  }
  const kids = VOID.has(tag) || tag === 'textarea' ? [] : compileChildren(n.childNodes, tag);
  return { k: 'el', tag, attrs, kids, ctrl: FORM_CTRL.has(tag) };
}

export function compileTemplate(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return compileChildren(t.content.childNodes, '#root');
}

/* ---------- render: tree + values → React elements ---------- */

function lookup(expr, sc) {
  if ('lit' in expr) return expr.lit;
  const p = expr.path;
  let cur = p[0] in sc.loc ? sc.loc[p[0]] : sc.vals[p[0]];
  for (let i = 1; i < p.length; i++) {
    if (cur == null) return undefined;
    cur = cur[p[i]];
  }
  return cur;
}

const toText = (v) => (v == null || v === false || v === true ? '' : typeof v === 'object' ? '' : String(v));

function evalValue(val, sc, raw) {
  if ('static' in val) return val.static;
  if (val.single) {
    const v = lookup(val.single, sc);
    return raw ? v : toText(v);
  }
  let s = '';
  for (const part of val.parts) s += typeof part === 'string' ? part : toText(lookup(part, sc));
  return s;
}

const styleCache = new Map();
function parseStyle(str) {
  let o = styleCache.get(str);
  if (o) return o;
  o = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || value === '') continue;
    o[prop.startsWith('--') ? prop : camel(prop)] = value;
  }
  if (styleCache.size > 4000) styleCache.clear();
  styleCache.set(str, o);
  return o;
}

const noop = () => {};

function renderEl(node, sc, key) {
  const props = { key };
  let hasChange = false;
  for (const a of node.attrs) {
    if (a.kind === 'event') {
      const fn = evalValue(a.val, sc, true);
      if (typeof fn === 'function') { props[a.name] = fn; if (a.name === 'onChange' || a.name === 'onInput') hasChange = true; }
      continue;
    }
    if (a.kind === 'style') { const s = evalValue(a.val, sc, false); if (s) props.style = parseStyle(s); continue; }
    let v = evalValue(a.val, sc, true);
    if (BOOLS.has(a.name)) v = 'static' in a.val ? true : !!v;
    else if (a.name === 'value') v = v == null ? '' : v;
    else if (v === undefined || v === null) continue;
    else if (typeof v === 'object' || typeof v === 'function') v = toText(v);
    props[a.name] = v;
  }
  if (node.ctrl && ('value' in props || 'checked' in props) && !hasChange) {
    if (node.tag === 'select') props.onChange = noop; else props.readOnly = true;
  }
  if (!node.kids.length) return React.createElement(node.tag, props);
  return React.createElement(node.tag, props, ...renderKids(node.kids, sc));
}

function renderKids(kids, sc) {
  const out = [];
  for (let i = 0; i < kids.length; i++) {
    const r = renderNode(kids[i], sc, i);
    if (r !== null && r !== '') out.push(r);
  }
  return out;
}

function renderNode(node, sc, key) {
  switch (node.k) {
    case 'text': return evalValue(node.v, sc, false);
    case 'el': return renderEl(node, sc, key);
    case 'if': {
      if (!evalValue(node.test, sc, true)) return null;
      return React.createElement(React.Fragment, { key }, ...renderKids(node.kids, sc));
    }
    case 'for': {
      const list = evalValue(node.list, sc, true);
      if (!list || typeof list.length !== 'number' || !list.length) return null;
      const items = [];
      for (let i = 0; i < list.length; i++) {
        const loc = Object.create(sc.loc);
        loc[node.as] = list[i];
        items.push(React.createElement(React.Fragment, { key: i }, ...renderKids(node.kids, { vals: sc.vals, loc })));
      }
      return React.createElement(React.Fragment, { key }, items);
    }
    default: return null;
  }
}

export function renderTemplate(tree, vals) {
  return renderKids(tree, { vals: vals || {}, loc: Object.create(null) });
}

/* ---------- DCLogic base class ---------- */

let TREE = null;
let SOURCE = '';
export function setTemplate(html) { SOURCE = html; TREE = null; }

export class DCLogic extends React.Component {
  render() {
    if (!TREE) TREE = compileTemplate(SOURCE);
    return React.createElement(React.Fragment, null, ...renderTemplate(TREE, this.renderVals()));
  }
}
