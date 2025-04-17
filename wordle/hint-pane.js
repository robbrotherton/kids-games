// hint-pane.js: Modular hint pane logic for Wordle

window.showHintPane = function(hints, startIdx = 0) {
  if (!Array.isArray(hints) || hints.length === 0) return;
  if (document.getElementById('wordle-hint-modal')) return;
  let idx = startIdx;

  function render() {
    const modal = document.getElementById('wordle-hint-modal');
    if (!modal) return;
    const hintTextDiv = modal.querySelector('.hint-text');
    hintTextDiv.textContent = hints[idx];
    // Update dots
    const dots = modal.querySelectorAll('.hint-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
    // Disable/enable arrows
    modal.querySelector('.hint-prev').disabled = idx === 0;
    modal.querySelector('.hint-next').disabled = idx === hints.length - 1;
  }

  const modal = document.createElement('div');
  modal.id = 'wordle-hint-modal';
  modal.innerHTML = `
    <div class="hint-panel">
      <div class="hint-header">
        <span class="hint-icon">💡</span>
      </div>
      <div class="hint-content">
        <div class="hint-text">${hints[startIdx]}</div>
        <div class="hint-nav">
          <button class="hint-prev" title="Previous hint">&#8592;</button>
          <div class="hint-dots">
            ${hints.map((_, i) => `<span class="hint-dot${i === startIdx ? ' active' : ''}"></span>`).join('')}
          </div>
          <button class="hint-next" title="Next hint">&#8594;</button>
        </div>
      </div>
      <button id="close-hint" class="close-hint-button">×</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.hint-prev').onclick = () => {
    if (idx > 0) { idx--; render(); }
  };
  modal.querySelector('.hint-next').onclick = () => {
    if (idx < hints.length - 1) { idx++; render(); }
  };
  document.getElementById('close-hint').onclick = () => modal.remove();
};