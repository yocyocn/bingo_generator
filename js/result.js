// ビンゴの結果を表示する画面

const bingo = parseBingo(location.search);

if (!bingo || !bingo.hasMarks) {
  showLoadError('結果を読み込めませんでした。URLが正しいか確認してください。');
} else {
  applyTheme(bingo.theme);
  if (bingo.title) document.title = `${bingo.title}の結果 | Bingo Generator`;
  setPageTitle(document.getElementById('bingo-title'), bingo.title);
  renderBoard(document.getElementById('board'), bingo, bingo.marks);

  const count = countBingo(bingo.size, bingo.marks);
  const countEl = document.getElementById('bingo-count');
  countEl.textContent = count > 0 ? `${count} BINGO!` : 'ビンゴはありませんでした';
  countEl.classList.toggle('is-zero', count === 0);

  if (bingo.comment) {
    document.getElementById('comment-text').textContent = bingo.comment;
    document.getElementById('comment-display').hidden = false;
  }
}
