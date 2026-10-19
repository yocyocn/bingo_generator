// ビンゴ生成画面

const form = document.getElementById('create-form');
const titleInput = document.getElementById('title');
const sizeSelect = document.getElementById('size');
const freeToggle = document.getElementById('free-toggle');
const freeField = document.getElementById('free-field');
const centerTextField = document.getElementById('center-text-field');
const centerTextInput = document.getElementById('center-text');
const itemsInput = document.getElementById('items');
const itemsCount = document.getElementById('items-count');
const itemsError = document.getElementById('items-error');
const themePicker = document.getElementById('theme-picker');
const previewTitle = document.getElementById('preview-title');
const previewBoard = document.getElementById('preview-board');

// 入力内容は端末内に保存しておき、次に開いたときに復元する
const DRAFT_KEY = 'bingo-generator:draft';

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

function saveDraft() {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title: titleInput.value,
        size: sizeSelect.value,
        free: freeToggle.checked,
        center: centerTextInput.value,
        items: itemsInput.value,
        theme,
      })
    );
  } catch {
    // 保存できない環境では何もしない
  }
}

const draft = loadDraft();
if (typeof draft.title === 'string') titleInput.value = draft.title;
if (SIZES.includes(Number(draft.size))) sizeSelect.value = String(draft.size);
if (typeof draft.free === 'boolean') freeToggle.checked = draft.free;
if (typeof draft.center === 'string') centerTextInput.value = draft.center;
if (typeof draft.items === 'string') itemsInput.value = draft.items;

let theme = applyTheme(draft.theme || DEFAULT_THEME);

THEMES.forEach((t) => {
  const label = document.createElement('label');
  label.className = 'theme-option';
  label.dataset.swatch = t.id;

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'theme';
  radio.value = t.id;
  radio.checked = t.id === theme;
  radio.addEventListener('change', () => {
    theme = applyTheme(t.id);
  });

  const swatch = document.createElement('span');
  swatch.className = 'theme-swatch';
  const name = document.createElement('span');
  name.className = 'theme-name';
  name.textContent = t.label;

  label.append(radio, swatch, name);
  themePicker.appendChild(label);
});

function getItems() {
  return itemsInput.value
    .split('\n')
    .map((s) => truncate(s.trim(), MAX_ITEM_LENGTH))
    .filter((s) => s !== '');
}

// 入力欄の内容からビンゴを組み立てる（項目は盤面に入る分だけ）
function currentBingo() {
  const size = Number(sizeSelect.value);
  const hasCenter = centerIndex(size) >= 0;
  const bingo = {
    title: titleInput.value.trim(),
    size,
    items: getItems(),
    theme,
    free: hasCenter && freeToggle.checked ? DEFAULT_FREE_TEXT : null,
    center: hasCenter && !freeToggle.checked ? truncate(centerTextInput.value.trim(), MAX_ITEM_LENGTH) : '',
  };
  bingo.items = bingo.items.slice(0, requiredCount(bingo));
  return bingo;
}

function updateStatus() {
  const size = Number(sizeSelect.value);
  const hasCenter = centerIndex(size) >= 0;

  // 4×4は中央のマスがないのでFREEの設定ごと隠す
  freeField.hidden = !hasCenter;
  // FREEにしないときは中央マスの項目を入力できる
  centerTextField.hidden = freeToggle.checked;

  const bingo = currentBingo();
  const items = getItems();
  const need = requiredCount(bingo);

  itemsCount.textContent = `${items.length} / ${need} 個`;
  itemsCount.classList.toggle('is-over', items.length > need);
  if (items.length < need) {
    itemsCount.textContent += '（足りないマスは空白になります）';
  } else if (items.length > need) {
    itemsCount.textContent += `（${need + 1}個目以降は使われません）`;
  }

  itemsError.innerHTML = '';
  itemsInput.classList.remove('is-invalid');

  // プレビュー
  previewTitle.textContent = bingo.title;
  previewTitle.hidden = !bingo.title;
  const marks = [...Array(size * size)].map((_, i) => i === freeIndex(bingo));
  renderBoard(previewBoard, bingo, marks);
}

// 入力チェックをして、問題なければビンゴを返す
function validBingo() {
  updateStatus();
  let valid = true;
  const bingo = currentBingo();

  if (bingo.items.length === 0) {
    const li = document.createElement('li');
    li.textContent = '項目を1つ以上入力してください';
    itemsError.appendChild(li);
    itemsInput.classList.add('is-invalid');
    valid = false;
  }
  if (!valid) {
    form.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return null;
  }
  return bingo;
}

[sizeSelect, freeToggle].forEach((el) => el.addEventListener('change', updateStatus));
[itemsInput, centerTextInput].forEach((el) => el.addEventListener('input', updateStatus));
titleInput.addEventListener('input', updateStatus);
// 各入力欄の処理のあとに保存する
form.addEventListener('input', saveDraft);
form.addEventListener('change', saveDraft);

document.getElementById('try-play').addEventListener('click', () => {
  const bingo = validBingo();
  if (bingo) window.open(pageUrl('play.html', buildQuery(bingo)), '_blank', 'noopener');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const bingo = validBingo();
  if (bingo) openShareModal(pageUrl('play.html', buildQuery(bingo)), 'ビンゴのURLができました');
});

updateStatus();
