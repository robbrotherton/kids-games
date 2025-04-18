// endgame-modal.js: Modal for win/lose with etymology and headscratcher

window.showEndgameModal = function({
  word, win, etymologyEntries = [], headscratcher, onPlayAgain
}) {
  if (document.getElementById('wordle-endgame-modal')) return;
  let idx = 0;
  // Build sections: each etymology entry is its own page
  const sections = [];
  if (Array.isArray(etymologyEntries) && etymologyEntries.length > 0) {
    etymologyEntries.forEach(entry => {
      sections.push({ label: 'Word History', content: entry });
    });
  }
  if (headscratcher) {
    sections.push({ label: 'Headscratcher', content: headscratcher });
  }
  const noInfo = sections.length === 0;
  if (noInfo) sections.push({ label: '', content: '' });

  function render() {
    const modal = document.getElementById('wordle-endgame-modal');
    if (!modal) return;
    // Hide label/content if no info
    const labelDiv = modal.querySelector('.eg-section-label');
    const contentDiv = modal.querySelector('.eg-section-content');
    const navDiv = modal.querySelector('.eg-nav');
    if (noInfo) {
      labelDiv.style.display = 'none';
      contentDiv.style.display = 'none';
      navDiv.style.display = 'none';
    } else {
      labelDiv.style.display = '';
      contentDiv.style.display = '';
      navDiv.style.display = '';
      labelDiv.textContent = sections[idx].label;
      contentDiv.textContent = sections[idx].content;
      // Update nav
      modal.querySelector('.eg-prev').disabled = idx === 0;
      modal.querySelector('.eg-next').disabled = idx === sections.length - 1;
      // Update dots
      const dots = modal.querySelectorAll('.eg-dot');
      dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
    }
  }

  const modal = document.createElement('div');
  modal.id = 'wordle-endgame-modal';
  modal.innerHTML = `
    <div class="eg-modal-panel">
      <div class="eg-word-row">
        ${word.split('').map(l => `<span class="eg-cell ${win ? 'eg-win' : 'eg-lose'}">${l.toUpperCase()}</span>`).join('')}
      </div>
      <div class="eg-section">
        <div class="eg-section-label">${sections[0].label}</div>
        <div class="eg-section-content">${sections[0].content}</div>
        <div class="eg-nav">
          <button class="eg-prev" title="Previous" ${idx === 0 ? 'disabled' : ''}>&#8592;</button>
          <div class="eg-dots">
            ${sections.map((_, i) => `<span class="eg-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
          </div>
          <button class="eg-next" title="Next" ${idx === sections.length - 1 ? 'disabled' : ''}>&#8594;</button>
        </div>
      </div>
      <button class="eg-play-again replay-button">Play Again <img src="../assets/refresh-button.png" alt="Play Again"></button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.eg-prev').onclick = () => { if (idx > 0) { idx--; render(); } };
  modal.querySelector('.eg-next').onclick = () => { if (idx < sections.length - 1) { idx++; render(); } };
  modal.querySelector('.eg-play-again').onclick = () => {
    modal.remove();
    if (typeof onPlayAgain === 'function') onPlayAgain();
  };
  render();
};