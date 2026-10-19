// ビンゴを遊ぶ画面

const bingo = parseBingo(location.search);

function showBingoCount(el, count, animate) {
  el.hidden = count === 0;
  el.textContent = `${count} BINGO!`;
  if (animate) {
    // クラスを付け直してアニメーションを毎回再生する
    el.classList.remove('is-pop');
    void el.offsetWidth;
    el.classList.add('is-pop');
  }
}

if (!bingo) {
  showLoadError('ビンゴを読み込めませんでした。URLが正しいか確認してください。');
} else {
  bingo.theme = applyTheme(bingo.theme);
  document.title = `${bingo.title} | Bingo Generator`;
  document.getElementById('bingo-title').textContent = bingo.title;

  const countEl = document.getElementById('bingo-count');
  const commentInput = document.getElementById('comment');
  const commentCount = document.getElementById('comment-count');

  // 再読み込みしても○とコメントが消えないよう、このビンゴごとに端末内へ保存する
  const storageKey = `share-bingo:${buildQuery(bingo)}`;
  const marks = bingo.marks.slice();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      String(saved.m || '').split('').forEach((v, i) => {
        if (i < marks.length && v === '1') marks[i] = true;
      });
      commentInput.value = truncate(String(saved.n || ''), MAX_COMMENT_LENGTH);
    }
  } catch {
    // 保存できない環境では何もしない
  }

  function save() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ m: marks.map((m) => (m ? '1' : '0')).join(''), n: commentInput.value })
      );
    } catch {
      // 保存できない環境では何もしない
    }
  }

  function updateCommentCount() {
    commentCount.textContent = `${charLength(commentInput.value)} / ${MAX_COMMENT_LENGTH}`;
  }

  let bingoCount = countBingo(bingo.size, marks);
  showBingoCount(countEl, bingoCount, false);
  updateCommentCount();

  renderBoard(document.getElementById('board'), bingo, marks, (index) => {
    marks[index] = !marks[index];
    save();
    const next = countBingo(bingo.size, marks);
    showBingoCount(countEl, next, next > bingoCount);
    bingoCount = next;
    return marks[index];
  });

  commentInput.addEventListener('input', () => {
    const text = truncate(commentInput.value, MAX_COMMENT_LENGTH);
    if (text !== commentInput.value) commentInput.value = text;
    updateCommentCount();
    save();
  });

  document.getElementById('share-result').addEventListener('click', () => {
    const url = pageUrl('result.html', buildQuery(bingo, marks, commentInput.value.trim()));
    openShareModal(url);
  });
}
