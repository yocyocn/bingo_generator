// ビンゴ生成画面

const form = document.getElementById('create-form');
const titleInput = document.getElementById('title');
const sizeSelect = document.getElementById('size');
const freeToggle = document.getElementById('free-toggle');
const freeHint = document.getElementById('free-hint');
const freeTextField = document.getElementById('free-text-field');
const freeTextInput = document.getElementById('free-text');
const itemsInput = document.getElementById('items');
const titleError = document.getElementById('title-error');
const itemsCount = document.getElementById('items-count');
const itemsError = document.getElementById('items-error');
const themePicker = document.getElementById('theme-picker');
const previewTitle = document.getElementById('preview-title');
const previewBoard = document.getElementById('preview-board');

let theme = applyTheme(DEFAULT_THEME);

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
    .map((s) => s.trim())
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
    free: hasCenter && freeToggle.checked ? freeTextInput.value.trim() || DEFAULT_FREE_TEXT : null,
  };
  bingo.items = bingo.items.slice(0, requiredCount(bingo));
  return bingo;
}

function updateStatus() {
  const size = Number(sizeSelect.value);
  const hasCenter = centerIndex(size) >= 0;

  // 4×4は中央のマスがないのでFREEを選べない
  freeToggle.disabled = !hasCenter;
  freeHint.textContent = hasCenter ? '' : '4×4には中央のマスがないため、FREEマスは使えません';
  freeTextField.hidden = !hasCenter || !freeToggle.checked;

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

  // 20文字を超える行を表示
  itemsError.innerHTML = '';
  const tooLong = items
    .map((text, i) => ({ text, line: i + 1, len: charLength(text) }))
    .filter((it) => it.len > MAX_ITEM_LENGTH);
  tooLong.forEach((it) => {
    const li = document.createElement('li');
    li.textContent = `${it.line}個目「${it.text}」が${it.len}文字です（20文字まで）`;
    itemsError.appendChild(li);
  });
  itemsInput.classList.toggle('is-invalid', tooLong.length > 0);

  // プレビュー
  previewTitle.textContent = bingo.title || 'ビンゴ名';
  previewTitle.classList.toggle('is-placeholder', !bingo.title);
  const marks = [...Array(size * size)].map((_, i) => i === freeIndex(bingo));
  renderBoard(previewBoard, bingo, marks);

  return tooLong.length === 0;
}

// 入力チェックをして、問題なければビンゴを返す
function validBingo() {
  let valid = updateStatus();
  const bingo = currentBingo();

  if (!bingo.title) {
    titleError.textContent = 'ビンゴ名を入力してください';
    titleInput.classList.add('is-invalid');
    valid = false;
  }
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
[itemsInput, freeTextInput].forEach((el) => el.addEventListener('input', updateStatus));
titleInput.addEventListener('input', () => {
  titleError.textContent = '';
  titleInput.classList.remove('is-invalid');
  updateStatus();
});

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
