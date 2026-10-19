// 3ページ共通の処理（URLの読み書き、盤面の描画、ビンゴ判定、シェア用ポップアップ、テーマ）

const SIZES = [3, 4, 5];
const MAX_ITEM_LENGTH = 20;
const MAX_TITLE_LENGTH = 40;
const MAX_COMMENT_LENGTH = 100;
const DEFAULT_FREE_TEXT = 'FREE';

const THEMES = [
  { id: 'white', label: '白' },
  { id: 'black', label: '黒' },
  { id: 'blue', label: '水色' },
  { id: 'yellow', label: '黄色' },
  { id: 'pink', label: 'ピンク' },
];
const DEFAULT_THEME = 'white';

// サロゲートペア（絵文字など）も1文字として数える
function charLength(str) {
  return Array.from(str).length;
}

function truncate(str, max) {
  return Array.from(str).slice(0, max).join('');
}

function applyTheme(theme) {
  const valid = THEMES.some((t) => t.id === theme) ? theme : DEFAULT_THEME;
  document.documentElement.dataset.theme = valid;
  return valid;
}

// 中央のマスがあるのは3×3と5×5だけ
function centerIndex(size) {
  return size % 2 === 1 ? (size * size - 1) / 2 : -1;
}

// FREEマスの位置。FREEなし、または4×4のときは -1
function freeIndex(bingo) {
  return bingo.free === null ? -1 : centerIndex(bingo.size);
}

// 中央マスはFREEか中央マス専用の項目になるので、項目の数はFREEの有無に関係なく決まる
function requiredCount(bingo) {
  return bingo.size * bingo.size - (centerIndex(bingo.size) >= 0 ? 1 : 0);
}

// 盤面のマス配列を作る。中央以外に入力順で項目を入れ、足りない分は空白
function buildCells(bingo) {
  const free = freeIndex(bingo);
  const center = centerIndex(bingo.size);
  const cells = [];
  let next = 0;
  for (let i = 0; i < bingo.size * bingo.size; i++) {
    if (i === free) {
      cells.push({ free: true, text: bingo.free || DEFAULT_FREE_TEXT });
    } else if (i === center) {
      cells.push({ free: false, text: bingo.center });
    } else {
      cells.push({ free: false, text: bingo.items[next++] || '' });
    }
  }
  return cells;
}

// 縦・横・斜めで揃っている列の数
function countBingo(size, marks) {
  const lines = [];
  for (let r = 0; r < size; r++) lines.push([...Array(size)].map((_, c) => r * size + c));
  for (let c = 0; c < size; c++) lines.push([...Array(size)].map((_, r) => r * size + c));
  lines.push([...Array(size)].map((_, i) => i * size + i));
  lines.push([...Array(size)].map((_, i) => i * size + (size - 1 - i)));
  return lines.filter((line) => line.every((i) => marks[i])).length;
}

// クエリパラメータ
//   t: ビンゴ名 / s: サイズ / i: 項目（改行区切り） / c: テーマ / f: FREEマスの表示内容（なければFREEなし）
//   x: 中央マスの項目（FREEなしのとき） / m: 結果（マスごとに0か1） / n: コメント
function buildQuery({ title, size, items, theme, free, center }, marks, comment) {
  const params = new URLSearchParams();
  if (title) params.set('t', title);
  params.set('s', String(size));
  params.set('i', items.join('\n'));
  params.set('c', theme);
  if (free !== null) params.set('f', free);
  else if (center) params.set('x', center);
  if (marks) params.set('m', marks.map((m) => (m ? '1' : '0')).join(''));
  if (comment) params.set('n', comment);
  return params.toString();
}

function pageUrl(page, query) {
  const url = new URL(page, location.href);
  url.search = query;
  url.hash = '';
  return url.toString();
}

// URLからビンゴを読み込む。不正な場合は null
function parseBingo(search) {
  const params = new URLSearchParams(search);
  const title = (params.get('t') || '').trim();
  const size = Number(params.get('s'));
  const rawItems = params.get('i');
  if (!SIZES.includes(size) || rawItems === null) return null;

  const items = rawItems
    .split('\n')
    .map((s) => truncate(s.trim(), MAX_ITEM_LENGTH))
    .filter((s) => s !== '');

  const rawFree = params.get('f');
  const bingo = {
    title: truncate(title, MAX_TITLE_LENGTH),
    size,
    items,
    theme: params.get('c') || DEFAULT_THEME,
    free: rawFree === null ? null : truncate(rawFree.trim(), MAX_ITEM_LENGTH) || DEFAULT_FREE_TEXT,
    center: rawFree === null ? truncate((params.get('x') || '').trim(), MAX_ITEM_LENGTH) : '',
    comment: truncate(params.get('n') || '', MAX_COMMENT_LENGTH),
    hasMarks: params.has('m'),
  };

  const free = freeIndex(bingo);
  const rawMarks = params.get('m') || '';
  bingo.marks = [];
  for (let i = 0; i < size * size; i++) {
    bingo.marks.push(i === free || rawMarks[i] === '1');
  }
  return bingo;
}

// 盤面を描画する。onToggle を渡すとマスをクリックで切り替えられる
function renderBoard(container, bingo, marks, onToggle) {
  container.innerHTML = '';
  container.dataset.size = String(bingo.size);
  container.style.setProperty('--size', bingo.size);

  buildCells(bingo).forEach((cell, index) => {
    const el = document.createElement(onToggle && !cell.free ? 'button' : 'div');
    el.className = 'cell';
    if (cell.free) el.classList.add('is-free');
    if (!cell.text) el.classList.add('is-empty');
    if (marks[index]) el.classList.add('is-marked');

    const text = document.createElement('span');
    text.className = 'cell-text';
    text.textContent = cell.text;
    el.appendChild(text);

    if (onToggle && !cell.free) {
      el.type = 'button';
      el.setAttribute('aria-pressed', String(marks[index]));
      el.addEventListener('click', () => {
        const marked = onToggle(index);
        el.classList.toggle('is-marked', marked);
        el.setAttribute('aria-pressed', String(marked));
      });
    }
    container.appendChild(el);
  });
}

function showLoadError(message) {
  const main = document.querySelector('main');
  main.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'card error-card';
  const p = document.createElement('p');
  p.textContent = message;
  const link = document.createElement('a');
  link.className = 'button';
  link.href = 'index.html';
  link.textContent = 'ビンゴを作ってみる';
  box.append(p, link);
  main.appendChild(box);
}

// シェア用ポップアップ
async function copyText(text, input) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // http環境や古いブラウザ向けのフォールバック
    input.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

// heading を省略すると見出しなしで表示する
function openShareModal(url, heading) {
  let modal = document.getElementById('share-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-label="シェア用URL">
        <button type="button" class="modal-close" data-close aria-label="閉じる">×</button>
        <h2 class="modal-title"></h2>
        <div class="share-row">
          <input type="text" class="share-url" readonly aria-label="シェア用URL">
          <button type="button" class="button button-primary share-copy">コピー</button>
        </div>
        <p class="share-status" role="status"></p>
      </div>`;
    document.body.appendChild(modal);

    const input = modal.querySelector('.share-url');
    const status = modal.querySelector('.share-status');
    const close = () => {
      modal.hidden = true;
    };
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
    input.addEventListener('focus', () => input.select());
    modal.querySelector('.share-copy').addEventListener('click', async () => {
      const ok = await copyText(input.value, input);
      status.textContent = ok ? 'コピーしました！' : 'コピーできませんでした。URLを選択してコピーしてください。';
    });
  }

  const title = modal.querySelector('.modal-title');
  title.textContent = heading || '';
  title.hidden = !heading;
  modal.querySelector('.share-url').value = url;
  modal.querySelector('.share-status').textContent = '';
  modal.hidden = false;
  modal.querySelector('.share-copy').focus();
}
