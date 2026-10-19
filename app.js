const seed = {
  dmPin: 'pentecost',
  players: [
    {
      id: 'lumian',
      name: 'Lumian Lee',
      pathway: 'Hunter',
      apparent: 'Sequence 8 · Provoker',
      condition: 'Unconscious',
      hp: 0,
      maxHp: 10,
      vaultPin: '1904',
      truth: 'True sequence: Sequence 8, Provoker. Keep his stated statistics and observed condition aligned with the public ledger.'
    },
    {
      id: 'aurore',
      name: 'Aurore',
      pathway: 'Unknown',
      apparent: 'Unconfirmed',
      condition: 'Status unknown',
      hp: null,
      maxHp: null,
      vaultPin: '0813',
      truth: 'Aurore’s status remains uncertain. Keep this uncertainty out of the public-facing view until it is confirmed.'
    },
    {
      id: 'companion',
      name: 'Companion',
      pathway: 'Unrecorded',
      apparent: 'Unconfirmed',
      condition: 'Stable',
      hp: 8,
      maxHp: 10,
      vaultPin: '7724',
      truth: 'Unrecorded true sequence. Update identity and facts when established by the GM.'
    }
  ],
  dm: {
    countdown: '13 days remain until D-Day. Update this countdown as the campaign advances.',
    loop: 'Cordu’s time loop and resets are the concealed truth. Preserve continuity of what characters remember between loops.'
  }
};

const storageKey = 'pentecostalArchive';
let state = loadState();
let toastTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.players) && parsed.dm) return parsed;
  } catch (error) {
    console.warn('Archive state unavailable, reverting to default.', error);
  }
  return JSON.parse(JSON.stringify(seed));
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2400);
}

function renderHome() {
  const homeRoster = document.getElementById('homeRoster');
  const countdown = document.getElementById('countdownDisplay');
  if (!homeRoster || !countdown) return;

  homeRoster.innerHTML = state.players.map((player) => {
    const hp = Number.isFinite(player.hp) && Number.isFinite(player.maxHp) && player.maxHp > 0;
    const percent = hp ? Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) : 0;
    return `
      <article class="mini-card">
        <div class="mini-card-top">
          <strong>${escapeHtml(player.name)}</strong>
          <span class="status-pill">${escapeHtml(player.condition)}</span>
        </div>
        <span class="small-label">${escapeHtml(player.pathway)}</span>
        <div class="mini-bar">
          <span style="width:${percent}%"></span>
        </div>
        <small>${hp ? `${player.hp}/${player.maxHp} HP` : 'HP not confirmed'}</small>
      </article>
    `;
  }).join('');

  countdown.textContent = state.dm.countdown;
}

function renderRoster() {
  const grid = document.getElementById('rosterGrid');
  if (!grid) return;

  grid.innerHTML = state.players.map((player) => {
    const hp = Number.isFinite(player.hp) && Number.isFinite(player.maxHp) && player.maxHp > 0;
    const hpValue = hp ? `${player.hp}/${player.maxHp}` : 'Unconfirmed';
    const percent = hp ? Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100)) : 0;

    return `
      <article class="roster-card panel">
        <div class="card-header">
          <div>
            <p class="eyebrow">${escapeHtml(player.pathway)}</p>
            <h3>${escapeHtml(player.name)}</h3>
          </div>
          <span class="status-pill">${escapeHtml(player.condition)}</span>
        </div>

        <dl class="meta-list">
          <div>
            <dt>Apparent</dt>
            <dd>${escapeHtml(player.apparent)}</dd>
          </div>
          <div>
            <dt>HP</dt>
            <dd>${escapeHtml(hpValue)}</dd>
          </div>
        </dl>

        <div class="meter">
          <span style="width:${percent}%"></span>
        </div>

        <p class="card-note">${escapeHtml(player.truth)}</p>
      </article>
    `;
  }).join('');
}

function setupConsolePage() {
  const form = document.getElementById('dmForm');
  const lockPanel = document.getElementById('consoleLock');
  const contentPanel = document.getElementById('consoleContent');
  const countdownInput = document.getElementById('countdownInput');
  const loopInput = document.getElementById('loopInput');
  const pinFormWrap = document.getElementById('pinFormWrap');

  if (!form || !lockPanel || !contentPanel || !countdownInput || !loopInput) return;

  countdownInput.value = state.dm.countdown;
  loopInput.value = state.dm.loop;

  const unlock = () => {
    lockPanel.classList.add('hidden');
    contentPanel.classList.remove('hidden');
  };

  const lock = () => {
    contentPanel.classList.add('hidden');
    lockPanel.classList.remove('hidden');
    form.reset();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('dmPin');
    if (input.value !== state.dmPin) {
      showToast('Passcode not recognized');
      return;
    }
    input.value = '';
    unlock();
  });

  document.getElementById('lockConsole').addEventListener('click', lock);

  document.getElementById('saveDmState').addEventListener('click', () => {
    state.dm.countdown = countdownInput.value.trim() || state.dm.countdown;
    state.dm.loop = loopInput.value.trim() || state.dm.loop;
    saveState();
    showToast('GM ledger updated');
  });

  document.getElementById('saveDmPin').addEventListener('click', () => {
    pinFormWrap.classList.toggle('hidden');
  });

  document.getElementById('confirmDmPin').addEventListener('click', () => {
    const a = document.getElementById('newDmPin').value;
    const b = document.getElementById('newDmPin2').value;
    if (!a || a !== b) {
      showToast('Enter matching non-empty passcodes');
      return;
    }
    state.dmPin = a;
    saveState();
    document.getElementById('newDmPin').value = '';
    document.getElementById('newDmPin2').value = '';
    pinFormWrap.classList.add('hidden');
    showToast('Passcode updated');
  });
}

function setupVaultsPage() {
  const lockPanel = document.getElementById('vaultLock');
  const contentPanel = document.getElementById('vaultContent');
  const form = document.getElementById('vaultForm');
  const selector = document.getElementById('characterSelect');

  if (!lockPanel || !contentPanel || !form || !selector) return;

  selector.innerHTML = state.players.map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join('');

  const unlockVault = (player) => {
    lockPanel.classList.add('hidden');
    contentPanel.classList.remove('hidden');
    contentPanel.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">Private folio</p>
          <h2>${escapeHtml(player.name)}</h2>
        </div>
        <button id="relockVault" class="button secondary" type="button">Relock</button>
      </div>

      <div class="vault-grid">
        <div class="vault-block">
          <h3>True identity</h3>
          <p><strong>Pathway:</strong> ${escapeHtml(player.pathway)}</p>
          <p><strong>Apparent:</strong> ${escapeHtml(player.apparent)}</p>
          <p><strong>Condition:</strong> ${escapeHtml(player.condition)}</p>
        </div>
        <div class="vault-block">
          <h3>Private notes</h3>
          <p>${escapeHtml(player.truth)}</p>
        </div>
      </div>
    `;

    document.getElementById('relockVault').addEventListener('click', () => {
      contentPanel.classList.add('hidden');
      lockPanel.classList.remove('hidden');
      form.reset();
    });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selectedId = selector.value;
    const player = state.players.find((entry) => entry.id === selectedId);
    const pin = document.getElementById('vaultPin').value;

    if (!player || pin !== player.vaultPin) {
      showToast('PIN not recognized');
      return;
    }
    document.getElementById('vaultPin').value = '';
    unlockVault(player);
  });
}

function initializePage() {
  const page = document.body.dataset.page;

  if (page === 'home') {
    renderHome();
  }

  if (page === 'roster') {
    renderRoster();
  }

  if (page === 'console') {
    setupConsolePage();
  }

  if (page === 'vaults') {
    setupVaultsPage();
  }
}

document.addEventListener('DOMContentLoaded', initializePage);
