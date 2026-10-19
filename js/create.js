// ビンゴ生成画面

const form = document.getElementById('create-form');
const titleInput = document.getElementById('title');
const sizeSelect = document.getElementById('size');
const itemsInput = document.getElementById('items');
const titleError = document.getElementById('title-error');
const sizeHint = document.getElementById('size-hint');
const itemsCount = document.getElementById('items-count');
const itemsError = document.getElementById('items-error');
const themePicker = document.getElementById('theme-picker');

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

function requiredCount(size) {
  return size * size - (centerIndex(size) >= 0 ? 1 : 0);
}

function updateStatus() {
  const size = Number(sizeSelect.value);
  const items = getItems();
  const need = requiredCount(size);

  sizeHint.textContent =
    centerIndex(size) >= 0 ? `中央はFREEマスになります（項目は${need}個）` : `項目は${need}個`;

  itemsCount.textContent = `${items.length} / ${need} 個`;
  itemsCount.classList.toggle('is-over', items.length > need);
  if (items.length < need) {
    itemsCount.textContent += `（足りないマスは空白になります）`;
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

  return tooLong.length === 0;
}

sizeSelect.addEventListener('change', updateStatus);
itemsInput.addEventListener('input', updateStatus);
titleInput.addEventListener('input', () => {
  titleError.textContent = '';
  titleInput.classList.remove('is-invalid');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = updateStatus();

  const title = titleInput.value.trim();
  if (!title) {
    titleError.textContent = 'ビンゴ名を入力してください';
    titleInput.classList.add('is-invalid');
    valid = false;
  }
  const items = getItems();
  if (items.length === 0) {
    const li = document.createElement('li');
    li.textContent = '項目を1つ以上入力してください';
    itemsError.appendChild(li);
    itemsInput.classList.add('is-invalid');
    valid = false;
  }
  if (!valid) return;

  const size = Number(sizeSelect.value);
  const used = items.slice(0, requiredCount(size));
  const url = pageUrl('play.html', buildQuery({ title, size, items: used, theme }));
  openShareModal(url, 'ビンゴのURLができました');
});

updateStatus();
