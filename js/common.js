// 3ページ共通の処理（URLの読み書き、盤面の描画、シェア用ポップアップ、テーマ）

const SIZES = [3, 4, 5];
const MAX_ITEM_LENGTH = 20;
const MAX_TITLE_LENGTH = 40;

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

function applyTheme(theme) {
  const valid = THEMES.some((t) => t.id === theme) ? theme : DEFAULT_THEME;
  document.documentElement.dataset.theme = valid;
  return valid;
}

// 3×3と5×5は中央をFREEマスにする
function centerIndex(size) {
  return size % 2 === 1 ? (size * size - 1) / 2 : -1;
}

// 盤面のマス配列を作る。FREEマス以外に入力順で項目を入れ、足りない分は空白
function buildCells(size, items) {
  const center = centerIndex(size);
  const cells = [];
  let next = 0;
  for (let i = 0; i < size * size; i++) {
    if (i === center) {
      cells.push({ free: true, text: 'FREE' });
    } else {
      cells.push({ free: false, text: items[next++] || '' });
    }
  }
  return cells;
}

// クエリパラメータ
//   t: ビンゴ名 / s: サイズ / i: 項目（改行区切り） / c: テーマ / m: 結果（マスごとに0か1）
function buildQuery({ title, size, items, theme }, marks) {
  const params = new URLSearchParams();
  params.set('t', title);
  params.set('s', String(size));
  params.set('i', items.join('\n'));
  params.set('c', theme);
  if (marks) params.set('m', marks.map((m) => (m ? '1' : '0')).join(''));
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
  const title = params.get('t');
  const size = Number(params.get('s'));
  const rawItems = params.get('i');
  if (!title || !SIZES.includes(size) || rawItems === null) return null;

  const items = rawItems
    .split('\n')
    .map((s) => Array.from(s.trim()).slice(0, MAX_ITEM_LENGTH).join(''))
    .filter((s) => s !== '');

  const theme = params.get('c') || DEFAULT_THEME;

  const center = centerIndex(size);
  const rawMarks = params.get('m') || '';
  const marks = [];
  for (let i = 0; i < size * size; i++) {
    marks.push(i === center || rawMarks[i] === '1');
  }

  return {
    title: Array.from(title).slice(0, MAX_TITLE_LENGTH).join(''),
    size,
    items,
    theme,
    marks,
    hasMarks: params.has('m'),
  };
}

// 盤面を描画する。onToggle を渡すとマスをクリックで切り替えられる
function renderBoard(container, bingo, marks, onToggle) {
  container.innerHTML = '';
  container.dataset.size = String(bingo.size);
  container.style.setProperty('--size', bingo.size);

  buildCells(bingo.size, bingo.items).forEach((cell, index) => {
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
  link.textContent = 'ビンゴを作る';
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

function openShareModal(url, heading) {
  let modal = document.getElementById('share-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <button type="button" class="modal-close" data-close aria-label="閉じる">×</button>
        <h2 id="share-modal-title"></h2>
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

  modal.querySelector('#share-modal-title').textContent = heading;
  modal.querySelector('.share-url').value = url;
  modal.querySelector('.share-status').textContent = '';
  modal.hidden = false;
  modal.querySelector('.share-copy').focus();
}
