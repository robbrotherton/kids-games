// Settings modal logic
function showSettingsModal() {
    if (document.getElementById('wordle-settings-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'wordle-settings-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';
  
    modal.innerHTML = `
      <div class="settings-panel">
        <div class="settings-header">
          <h3 class="baumans-regular">Settings</h3>
          <button id="close-settings" class="close-button">×</button>
        </div>
        <div class="settings-content">
          <div class="setting-group">
            <label class="setting-label baumans-regular">Word Length:</label>
            <div class="setting-control">
              <label><input type="radio" name="word-length" value="3" ${wordLength===3?'checked':''}/> 3</label>
              <label style="margin-left:10px;"><input type="radio" name="word-length" value="4" ${wordLength===4?'checked':''}/> 4</label>
              <label style="margin-left:10px;"><input type="radio" name="word-length" value="5" ${wordLength===5?'checked':''}/> 5</label>
            </div>
          </div>
          <div class="setting-group">
            <label class="setting-label baumans-regular">Number of Guesses:</label>
            <div class="setting-control">
              <input type="number" id="num-guesses" min="4" max="8" value="${maxGuesses}" style="width:60px;"> (4–8)
            </div>
          </div>
          <button id="apply-settings" class="apply-button baumans-regular">Apply & Restart</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-settings').onclick = () => modal.remove();
    document.getElementById('apply-settings').onclick = () => {
      const wl = parseInt(document.querySelector('input[name="word-length"]:checked').value, 10);
      const ng = Math.max(4, Math.min(8, parseInt(document.getElementById('num-guesses').value, 10)));
      wordLength = wl;
      maxGuesses = ng;
      modal.remove();
      startGame();
    };
  }