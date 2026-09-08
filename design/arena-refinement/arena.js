(() => {
  const params = new URLSearchParams(location.search);
  const pick = (key, values, fallback) => values.includes(params.get(key)) ? params.get(key) : fallback;
  const state = {
    variant: pick('variant', ['a', 'b'], 'a'),
    count: Number(pick('players', ['1', '6', '12'], '6')),
    scenario: pick('state', ['solo', 'partial', 'ready', 'revealed'], 'partial'),
    theme: pick('theme', ['light', 'dark'], 'light'),
    phase: 'voting', round: 1, votes: [], confirming: false,
    menu: null, disconnected: false,
  };
  const people = [
    ['Marina Costa', 'MC'], ['Rafael Souza', 'RS'], ['João Pedro de Almeida', 'JA'],
    ['Lívia', 'L'], ['Caio', 'C'], ['Nina', 'N'], ['Otávio', 'O'], ['Bia', 'B'],
    ['Diego', 'D'], ['Aline', 'A'], ['Yasmin', 'Y'], ['Gui', 'G'],
  ];
  const cards = ['0', '½', '1', '2', '3', '5', '8', '13', '☕'];
  const $ = selector => document.querySelector(selector);
  const mobile = matchMedia('(max-width:639px)');
  let confirmTimeout;
  let toastTimeout;
  const votedCount = () => state.votes.filter(value => value !== null).length;
  const isRevealed = () => state.phase === 'revealed';
  const soloInvite = () => state.count === 1 && !isRevealed() && votedCount() === 0;
  const format = value => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  function loadScenario() {
    clearTimeout(confirmTimeout);
    state.confirming = false;
    state.menu = null;
    if (state.scenario === 'solo') state.count = 1;
    if (state.count === 1 && state.scenario === 'partial') state.scenario = 'solo';
    const seed = ['5', '8', '3', '5', '2', '8', '3', '☕', '8', '2', '5', '8'];
    state.votes = Array.from({ length: state.count }, (_, index) => {
      if (state.scenario === 'solo') return null;
      if (state.scenario === 'partial') return index > 0 && index <= 2 ? seed[index] : null;
      return seed[index];
    });
    state.phase = state.scenario === 'revealed' ? 'revealed' : 'voting';
  }

  function announce(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 2600);
  }

  function statistics() {
    const values = state.votes.filter(value => value !== null && value !== '☕')
      .map(value => value === '½' ? 0.5 : Number(value)).sort((a, b) => a - b);
    if (!values.length) return { mean: '—', median: '—', range: '—', unanimous: false };
    const middle = Math.floor(values.length / 2);
    return {
      mean: format(values.reduce((sum, value) => sum + value, 0) / values.length),
      median: format(values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2),
      range: `${format(values[0])}–${format(values.at(-1))}`,
      unanimous: values.length === state.count && values.every(value => value === values[0]),
    };
  }

  async function copyInvite() {
    const url = new URL(location.href);
    url.search = new URLSearchParams({ variant: state.variant, players: '1', state: 'solo', theme: state.theme });
    try {
      await navigator.clipboard.writeText(url.href);
      announce('Link demonstrativo da prévia copiado.');
    } catch {
      announce('Não foi possível copiar o link demonstrativo.');
    }
  }

  function roundAction() {
    if (soloInvite()) { copyInvite(); return; }
    if (!isRevealed()) {
      if (!votedCount()) return;
      state.phase = 'revealed';
      state.scenario = 'revealed';
      state.menu = null;
      render('round-button');
      return;
    }
    if (!state.confirming) {
      state.confirming = true;
      clearTimeout(confirmTimeout);
      confirmTimeout = setTimeout(() => {
        state.confirming = false;
        render();
      }, 4000);
    } else {
      clearTimeout(confirmTimeout);
      state.round += 1;
      state.votes = Array(state.count).fill(null);
      state.phase = 'voting';
      state.scenario = state.count === 1 ? 'solo' : 'partial';
      state.confirming = false;
    }
    render('round-button');
  }

  function renderSeats() {
    $('#seats').innerHTML = people.slice(0, state.count).map(([name, initials], index) => {
      const vote = state.votes[index];
      const disconnected = state.disconnected && index === state.count - 1 && state.count > 1;
      const showValue = isRevealed() && vote !== null && !disconnected;
      const label = disconnected ? 'Desconectado' : isRevealed() ? vote ?? 'Não votou' : vote !== null ? 'Votou ✓' : 'Aguardando';
      const action = index === 0 ? '' : `<button type="button" id="person-${index}" class="seat-menu-trigger" data-person="${index}" aria-label="Interagir com ${name}" aria-expanded="${state.menu === index}" aria-controls="menu-${index}">Interagir</button>`;
      const menu = state.menu === index ? `<div id="menu-${index}" class="seat-menu" role="group" aria-label="Interações demonstrativas com ${name}"><button type="button" id="reaction-${index}" class="seat-menu-option" data-react="${index}">Mandar um café ☕</button><button type="button" class="seat-menu-option" data-close-menu="${index}">Cancelar</button></div>` : '';
      return `<article class="seat ${index === 0 ? 'you' : ''}" data-testid="seat" data-player-id="${index}" data-voted="${vote !== null}" data-disconnected="${disconnected}" title="${name}">
        <span class="avatar" aria-hidden="true">${initials}</span>
        <span><span class="seat-name">${name}</span><span class="seat-meta">${index === 0 ? '<b class="you-label">Você</b><span class="host-label">Anfitrião</span>' : ''}</span></span>
        <span class="seat-value" ${showValue ? `data-vote-value="${vote}"` : ''}>${label}</span>${action}${menu}</article>`;
    }).join('');
    $('#seats').querySelectorAll('[data-person]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.person);
      state.menu = state.menu === index ? null : index;
      render(state.menu === null ? `person-${index}` : `reaction-${index}`);
    }));
    $('#seats').querySelectorAll('[data-react]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.react);
      state.menu = null;
      render(`person-${index}`);
      announce(`Café demonstrativo para ${people[index][0]}.`);
    }));
    $('#seats').querySelectorAll('[data-close-menu]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.closeMenu);
      state.menu = null;
      render(`person-${index}`);
    }));
  }

  function renderCenter() {
    let title;
    let detail;
    if (soloInvite()) {
      title = 'O próximo lugar é do seu time.';
      detail = '<p class="center-sub">Compartilhe o convite e estimem juntos.</p>';
    } else if (isRevealed()) {
      const stats = statistics();
      title = stats.unanimous ? 'O time chegou ao consenso.' : 'Hora de conversar.';
      detail = `<div class="result-panel" role="status" aria-live="polite" aria-label="Resultados da rodada"><div><strong data-stat="mean">${stats.mean}</strong><span>Média</span></div><div><strong data-stat="median">${stats.median}</strong><span>Mediana</span></div><div><strong data-stat="range">${stats.range}</strong><span>Intervalo</span></div></div>`;
    } else {
      title = votedCount() === state.count ? 'Tudo pronto para revelar.' : state.votes[0] !== null ? 'Sua estimativa está na mesa.' : 'Qual é a sua estimativa?';
      detail = `<p class="center-sub">${votedCount() === state.count ? 'Todos participaram. Vamos comparar.' : 'Os votos ficam privados até a revelação.'}</p>`;
    }
    $('#center-copy').innerHTML = `<div class="center-title">${title}</div>${detail}`;
    const button = $('#round-button');
    button.disabled = !isRevealed() && !votedCount() && !soloInvite();
    button.dataset.confirming = String(state.confirming);
    button.textContent = soloInvite() ? 'Copiar convite' : isRevealed() ? state.confirming ? 'Confirmar nova rodada?' : 'Nova rodada' : 'Revelar votos';
    button.setAttribute('aria-keyshortcuts', soloInvite() ? '' : isRevealed() ? 'N' : 'R');
    $('#round-hint').textContent = soloInvite() ? 'Sem cadastro. É só entrar.' : isRevealed() ? state.confirming ? 'Toque de novo para confirmar · Esc cancela.' : 'Limpa votos e reinicia o timer · N' : votedCount() ? 'Revelar com os votos atuais · R' : 'Aguardando o primeiro voto.';
    (mobile.matches ? $('#mobile-actions') : $('.table-center')).append($('.round-action'));
  }

  function renderDeck() {
    const selected = state.votes[0];
    const scroll = $('#deck').scrollLeft;
    $('#deck').innerHTML = cards.map((value, index) => `<button type="button" id="card-${index}" class="card ${value === '☕' ? 'coffee' : ''} ${selected === value ? 'selected' : ''}" data-card="${value}" aria-pressed="${selected === value}" aria-label="Votar ${value === '☕' ? 'café' : value}" ${isRevealed() ? 'disabled' : ''}>${value}</button>`).join('');
    $('#deck').scrollLeft = scroll;
    $('#deck').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      state.votes[0] = button.dataset.card;
      state.menu = null;
      render(button.id);
    }));
    $('#deck-feedback').textContent = isRevealed() ? 'Rodada revelada. Compare os votos com o time.' : selected !== null ? `Você escolheu ${selected}. Pode mudar até a revelação.` : 'Escolha uma carta para votar.';
  }

  function render(focusId) {
    const focused = focusId || document.activeElement?.id;
    document.body.classList.toggle('dark', state.theme === 'dark');
    $('.stage').dataset.variant = state.variant;
    $('#players').value = String(state.count);
    $('#scenario').value = state.scenario;
    $('#disconnected').disabled = state.count === 1;
    $('#progress').textContent = `${votedCount()} de ${state.count}`;
    $('#round-number').textContent = String(state.round).padStart(2, '0');
    $('#timer-value').textContent = '60s';
    $('#theme-toggle').textContent = state.theme === 'light' ? 'Tema escuro' : 'Tema claro';
    $('#theme-toggle').setAttribute('aria-pressed', String(state.theme === 'dark'));
    document.querySelectorAll('button[data-variant]').forEach(button => {
      const active = button.dataset.variant === state.variant;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderSeats();
    renderCenter();
    renderDeck();
    const url = new URL(location.href);
    url.search = new URLSearchParams({variant: state.variant, players: String(state.count), state: state.scenario, theme: state.theme});
    history.replaceState(null, '', url);
    if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
  }

  document.querySelectorAll('button[data-variant]').forEach(button => button.addEventListener('click', () => {
    state.variant = button.dataset.variant;
    state.menu = null;
    render();
  }));
  $('#players').addEventListener('change', event => {
    state.count = Number(event.target.value);
    if (state.count !== 1 && state.scenario === 'solo') state.scenario = 'partial';
    loadScenario();
    render();
  });
  $('#scenario').addEventListener('change', event => { state.scenario = event.target.value; loadScenario(); render(); });
  $('#disconnected').addEventListener('change', event => { state.disconnected = event.target.checked; render(); });
  $('#theme-toggle').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; render(); });
  $('#invite').addEventListener('click', copyInvite);
  $('#round-button').addEventListener('click', roundAction);
  mobile.addEventListener('change', () => { state.menu = null; render(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (state.menu !== null) { const index = state.menu; state.menu = null; render(`person-${index}`); }
      if (state.confirming) { state.confirming = false; clearTimeout(confirmTimeout); render(); }
      return;
    }
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if ((key === 'r' && !isRevealed() && !soloInvite()) || (key === 'n' && isRevealed())) {
      event.preventDefault();
      roundAction();
    }
  });
  document.addEventListener('click', event => {
    if (state.menu !== null && !event.target.closest('.seat')) { state.menu = null; render(); }
  });
  loadScenario();
  render();
})();
