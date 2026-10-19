// ビンゴの結果を表示する画面

const bingo = parseBingo(location.search);

if (!bingo || !bingo.hasMarks) {
  showLoadError('結果を読み込めませんでした。URLが正しいか確認してください。');
} else {
  applyTheme(bingo.theme);
  document.title = `${bingo.title}の結果 | Share Bingo`;
  document.getElementById('bingo-title').textContent = bingo.title;
  renderBoard(document.getElementById('board'), bingo, bingo.marks);
}
