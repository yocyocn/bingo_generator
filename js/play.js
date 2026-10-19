// ビンゴを遊ぶ画面

const bingo = parseBingo(location.search);

if (!bingo) {
  showLoadError('ビンゴを読み込めませんでした。URLが正しいか確認してください。');
} else {
  bingo.theme = applyTheme(bingo.theme);
  document.title = `${bingo.title} | Share Bingo`;
  document.getElementById('bingo-title').textContent = bingo.title;

  // 再読み込みしても○が消えないよう、このビンゴごとに端末内へ保存する
  const storageKey = `share-bingo:${buildQuery(bingo)}`;
  const marks = bingo.marks.slice();
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) saved.split('').forEach((v, i) => {
      if (i < marks.length && v === '1') marks[i] = true;
    });
  } catch {
    // 保存できない環境では何もしない
  }

  renderBoard(document.getElementById('board'), bingo, marks, (index) => {
    marks[index] = !marks[index];
    try {
      localStorage.setItem(storageKey, marks.map((m) => (m ? '1' : '0')).join(''));
    } catch {
      // 保存できない環境では何もしない
    }
    return marks[index];
  });

  document.getElementById('share-result').addEventListener('click', () => {
    const url = pageUrl('result.html', buildQuery(bingo, marks));
    openShareModal(url, '結果のURLができました');
  });
}
