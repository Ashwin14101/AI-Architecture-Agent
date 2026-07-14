/* ═══════════════════════════════════════════════════
   Aetheria AI — App Controller (app.js)
   Matches redesigned Whimsical-style HTML + CSS
═══════════════════════════════════════════════════ */

// ── App State ──────────────────────────────────────
const state = {
  boards:           [...INITIAL_BOARDS],
  activeBoard:      null,
  activeNodeId:     null,
  sidebarCollapsed: false,
  currentFilter:    'all',
};

// ── SVG Diagram Previews for board cards ───────────
const BOARD_PREVIEWS = {
  "aws-ecommerce": `
    <svg width="100%" height="100%" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="130" fill="#f5f3ff"/>
      <rect x="15" y="45" width="44" height="32" rx="6" fill="#7c3aed" fill-opacity="0.15" stroke="#7c3aed" stroke-width="1.5"/>
      <rect x="88" y="18" width="44" height="32" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-width="1.5"/>
      <rect x="88" y="72" width="44" height="32" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="160" y="45" width="44" height="32" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
      <path d="M59 61 H80 V34 H88" stroke="#c4b5fd" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <path d="M59 61 H80 V88 H88" stroke="#c4b5fd" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <path d="M132 34 H146 V61 H160" stroke="#c4b5fd" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <path d="M132 88 H146 V61" stroke="#c4b5fd" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <text x="37" y="66" text-anchor="middle" font-size="7" fill="#7c3aed" font-family="Inter" font-weight="600">API GW</text>
      <text x="110" y="38" text-anchor="middle" font-size="7" fill="#3b82f6" font-family="Inter" font-weight="600">Auth</text>
      <text x="110" y="92" text-anchor="middle" font-size="7" fill="#f59e0b" font-family="Inter" font-weight="600">Lambda</text>
      <text x="182" y="66" text-anchor="middle" font-size="7" fill="#10b981" font-family="Inter" font-weight="600">DynamoDB</text>
    </svg>`,

  "analytics-pipeline": `
    <svg width="100%" height="100%" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="130" fill="#fef3c7"/>
      <rect x="12" y="49" width="44" height="32" rx="6" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="1.5"/>
      <rect x="95" y="49" width="44" height="32" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="178" y="49" width="44" height="32" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
      <path d="M56 65 H95" stroke="#fca5a5" stroke-width="1.5" fill="none"/>
      <path d="M139 65 H178" stroke="#fca5a5" stroke-width="1.5" fill="none"/>
      <circle cx="75.5" cy="65" r="4" fill="#ef4444" fill-opacity="0.5"/>
      <circle cx="158.5" cy="65" r="4" fill="#f59e0b" fill-opacity="0.5"/>
      <text x="34" y="69" text-anchor="middle" font-size="6.5" fill="#ef4444" font-family="Inter" font-weight="600">Kinesis</text>
      <text x="117" y="69" text-anchor="middle" font-size="6.5" fill="#f59e0b" font-family="Inter" font-weight="600">Processor</text>
      <text x="200" y="69" text-anchor="middle" font-size="6.5" fill="#10b981" font-family="Inter" font-weight="600">S3 Lake</text>
    </svg>`,

  "serverless-chat": `
    <svg width="100%" height="100%" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="130" fill="#ecfdf5"/>
      <rect x="12" y="35" width="44" height="32" rx="6" fill="#7c3aed" fill-opacity="0.12" stroke="#7c3aed" stroke-width="1.5"/>
      <rect x="95" y="12" width="44" height="32" rx="6" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="178" y="35" width="44" height="32" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
      <path d="M56 51 H72 V28 H95" stroke="#a78bfa" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <path d="M139 28 H160 V51 H178" stroke="#a78bfa" stroke-width="1.5" fill="none" stroke-dasharray="3 2"/>
      <text x="34" y="55" text-anchor="middle" font-size="6.5" fill="#7c3aed" font-family="Inter" font-weight="600">WS GW</text>
      <text x="117" y="32" text-anchor="middle" font-size="6.5" fill="#f59e0b" font-family="Inter" font-weight="600">Handler</text>
      <text x="200" y="55" text-anchor="middle" font-size="6.5" fill="#10b981" font-family="Inter" font-weight="600">Messages</text>
    </svg>`,

  "multi-region-sql": `
    <svg width="100%" height="100%" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="130" fill="#eff6ff"/>
      <rect x="12" y="45" width="44" height="32" rx="6" fill="#7c3aed" fill-opacity="0.12" stroke="#7c3aed" stroke-width="1.5"/>
      <rect x="95" y="18" width="44" height="32" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
      <rect x="95" y="72" width="44" height="32" rx="6" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.5"/>
      <path d="M56 61 H76 V34 H95" stroke="#c4b5fd" stroke-width="1.5" fill="none"/>
      <path d="M56 61 H76 V88 H95" stroke="#c4b5fd" stroke-width="1.5" fill="none"/>
      <text x="34" y="65" text-anchor="middle" font-size="6.5" fill="#7c3aed" font-family="Inter" font-weight="600">Route 53</text>
      <text x="117" y="38" text-anchor="middle" font-size="6.5" fill="#10b981" font-family="Inter" font-weight="600">Primary</text>
      <text x="117" y="92" text-anchor="middle" font-size="6.5" fill="#10b981" font-family="Inter" font-weight="600">Replica</text>
    </svg>`,

  default: `
    <svg width="100%" height="100%" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="130" fill="#f5f3ff"/>
      <rect x="20" y="45" width="44" height="32" rx="6" fill="#7c3aed" fill-opacity="0.15" stroke="#7c3aed" stroke-width="1.5"/>
      <rect x="172" y="45" width="44" height="32" rx="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-width="1.5"/>
      <path d="M64 61 H172" stroke="#c4b5fd" stroke-width="1.5" stroke-dasharray="4 3"/>
      <circle cx="118" cy="61" r="5" fill="#a78bfa" fill-opacity="0.5"/>
    </svg>`
};

// ── Node icon SVGs by type ──────────────────────────
function getNodeIcon(type) {
  const icons = {
    gateway:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 3h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M6 13v8"/><path d="M18 13v8"/></svg>`,
    security:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    compute:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    database:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
    storage:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    streaming: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    default:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`
  };
  return icons[type] || icons.default;
}

// ── Canvas node positions ───────────────────────────
const NODE_POSITIONS = {
  "api-gateway":    { x: 80,  y: 200 },
  "auth-cognito":   { x: 370, y: 80  },
  "users-lambda":   { x: 370, y: 320 },
  "users-db":       { x: 660, y: 320 },
  "kinesis-stream": { x: 80,  y: 220 },
  "process-lambda": { x: 370, y: 220 },
  "s3-lake":        { x: 660, y: 220 },
  "ws-gateway":     { x: 80,  y: 220 },
  "chat-lambda":    { x: 370, y: 220 },
  "chat-db":        { x: 660, y: 220 },
  "route53":        { x: 80,  y: 250 },
  "rds-primary":    { x: 380, y: 120 },
  "rds-replica":    { x: 380, y: 350 },
};

const DEFAULT_POSITIONS = [
  { x: 80, y: 220 }, { x: 370, y: 120 },
  { x: 370, y: 340 }, { x: 660, y: 220 }
];

// ── DOM Refs ────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  sidebar:             $('sidebar'),
  sidebarToggleBtn:    $('sidebar-toggle-btn'),
  btnCreateBoard:      $('btn-create-board'),
  sidebarSearchInput:  $('sidebar-search-input'),
  teamBoardsList:      $('team-boards-list'),
  privateBoardsList:   $('private-boards-list'),

  headerTeamName:      $('header-team-name'),
  boardTitleDisplay:   $('board-title-display'),
  boardTitleEdit:      $('board-title-edit'),
  btnEditTitle:        $('btn-edit-title'),
  btnShare:            $('btn-share'),
  btnAskAi:            $('btn-ask-ai'),
  collaboratorsStack:  $('collaborators-stack'),
  fabAskBtn:           $('fab-ask-btn'),

  viewDashboard:       $('view-dashboard'),
  viewBoardEditor:     $('view-board-editor'),
  boardsGridList:      $('boards-grid-list'),
  dashboardSearch:     $('dashboard-search'),

  canvasNodesContainer: $('canvas-nodes-container'),
  canvasConnectionsSvg: $('canvas-connections-svg'),

  panelAskAi:          $('panel-ask-ai'),
  btnCloseAskAi:       $('btn-close-ask-ai'),
  chatHistoryContainer: $('chat-history-container'),
  chatInputForm:       $('chat-input-form'),
  chatInputBox:        $('chat-input-box'),
  btnSendChat:         $('btn-send-chat'),

  panelAgentDetail:    $('panel-agent-detail'),
  btnCloseAgentDetail: $('btn-close-agent-detail'),
  agentTypeBadge:      $('agent-type-badge'),
  agentDetailName:     $('agent-detail-name'),
  overviewTech:        $('overview-tech'),
  overviewVersion:     $('overview-version'),
  overviewRegion:      $('overview-region'),
  overviewDesc:        $('overview-desc'),
  overviewConnectionsList: $('overview-connections-list'),
  agentRoutesList:     $('agent-routes-list'),
  terraformCodeViewer: $('terraform-code-viewer'),
};

// ── Init ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderSidebar();
  renderDashboard();
});

// ── Landing → App transition ────────────────────────
function openApp() {
  $('page-landing').style.display = 'none';
  const appPage = $('page-app');
  appPage.style.display = 'block';
  appPage.style.opacity = '0';
  requestAnimationFrame(() => {
    appPage.style.transition = 'opacity 0.3s ease';
    appPage.style.opacity = '1';
  });
  gotoDashboard();
}

// ── Event Listeners ─────────────────────────────────
function setupEventListeners() {
  // Sidebar
  els.sidebarToggleBtn.addEventListener('click', toggleSidebar);
  els.btnCreateBoard.addEventListener('click', () => createNewBoard());

  // Sidebar search filter
  els.sidebarSearchInput.addEventListener('input', () => {
    renderSidebar(els.sidebarSearchInput.value);
  });

  // Dashboard search
  els.dashboardSearch.addEventListener('input', () => {
    renderDashboard(els.dashboardSearch.value);
  });

  // Dashboard filter tabs
  document.querySelectorAll('.dash-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.filter;
      renderDashboard(els.dashboardSearch.value);
    });
  });

  // Rename
  els.btnEditTitle.addEventListener('click', enableTitleEdit);
  els.boardTitleDisplay.addEventListener('click', enableTitleEdit);
  els.boardTitleEdit.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveTitleEdit();
    if (e.key === 'Escape') cancelTitleEdit();
  });
  els.boardTitleEdit.addEventListener('blur', saveTitleEdit);

  // Share (mock)
  els.btnShare.addEventListener('click', () => {
    const orig = els.btnShare.textContent;
    els.btnShare.textContent = '✓ Link copied!';
    setTimeout(() => { els.btnShare.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share`; }, 2000);
  });

  // AI Panel
  els.btnAskAi.addEventListener('click', toggleAskAiPanel);
  els.btnCloseAskAi.addEventListener('click', () => els.panelAskAi.classList.remove('open'));

  // Agent Panel
  els.btnCloseAgentDetail.addEventListener('click', () => {
    els.panelAgentDetail.classList.remove('open');
    document.querySelectorAll('.arch-node').forEach(n => n.classList.remove('active'));
    state.activeNodeId = null;
  });

  // Chat submit
  els.chatInputForm.addEventListener('submit', handleChatSubmit);
}

// ── Sidebar Collapse ────────────────────────────────
function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  els.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
}

// ── Nav group collapse ──────────────────────────────
function toggleNavGroup(groupId) {
  $(groupId).classList.toggle('collapsed');
}

// ── Render Sidebar Trees ────────────────────────────
function renderSidebar(filter = '') {
  const query = filter.toLowerCase().trim();

  els.teamBoardsList.innerHTML = '';
  els.privateBoardsList.innerHTML = '';

  state.boards.forEach(board => {
    if (query && !board.name.toLowerCase().includes(query)) return;

    const isActive = state.activeBoard && state.activeBoard.id === board.id;

    const li = document.createElement('li');
    li.className = `nav-item ${isActive ? 'active' : ''}`;
    li.dataset.id = board.id;

    li.innerHTML = `
      <span class="nav-item-text" title="${board.name}">${board.name}</span>
      <button class="nav-item-del" title="Delete">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    `;

    li.querySelector('.nav-item-text').addEventListener('click', () => loadBoard(board.id));
    li.querySelector('.nav-item-del').addEventListener('click', e => {
      e.stopPropagation();
      deleteBoard(board.id);
    });

    if (board.category === 'Teams') {
      els.teamBoardsList.appendChild(li);
    } else {
      els.privateBoardsList.appendChild(li);
    }
  });
}

// ── Render Dashboard Grid ───────────────────────────
function renderDashboard(searchQuery = '') {
  const query = searchQuery.toLowerCase().trim();
  els.boardsGridList.innerHTML = '';

  const filtered = state.boards.filter(board => {
    const matchSearch = !query ||
      board.name.toLowerCase().includes(query) ||
      (board.teamName || '').toLowerCase().includes(query) ||
      board.category.toLowerCase().includes(query);

    const matchFilter = state.currentFilter === 'all' || board.category === state.currentFilter;
    return matchSearch && matchFilter;
  });

  if (!filtered.length) {
    els.boardsGridList.innerHTML = `
      <div style="grid-column:1/-1; padding:40px; text-align:center; color:#9ca3af; font-size:0.9rem;">
        No boards found. <button onclick="document.getElementById('btn-create-board').click()" style="color:#7c3aed; font-weight:600; background:none; border:none; cursor:pointer;">Create a new one →</button>
      </div>`;
    return;
  }

  filtered.forEach(board => {
    const thumbSvg = BOARD_PREVIEWS[board.id] || BOARD_PREVIEWS.default;

    const card = document.createElement('div');
    card.className = 'board-card';
    card.innerHTML = `
      <div class="board-thumb board-thumb-svg">${thumbSvg}</div>
      <div class="board-card-info">
        <div class="board-card-title">${board.name}</div>
        <div class="board-card-meta">
          <span class="board-card-badge">${board.teamName || board.category}</span>
          <span>${board.updatedAt || 'just now'}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => loadBoard(board.id));
    els.boardsGridList.appendChild(card);
  });
}

// ── Create New Board ────────────────────────────────
function createNewBoard(nameHint = '') {
  const boardName = prompt('Name your new architecture board:', nameHint || 'Untitled Board');
  if (!boardName || !boardName.trim()) return;

  const id = 'board-' + Date.now();
  const newBoard = {
    id,
    name: boardName.trim(),
    category: 'Private',
    updatedAt: 'just now',
    nodes: [
      { id: 'api-gateway', name: 'AWS API Gateway', type: 'gateway',  status: 'Active' },
      { id: 'users-lambda', name: 'Lambda Function', type: 'compute', status: 'Active' },
    ],
  };

  state.boards.unshift(newBoard);
  renderSidebar();
  renderDashboard();
  loadBoard(id);

  $('grp-private').classList.remove('collapsed');
}

// ── Create from template ────────────────────────────
function createFromTemplate(templateName) {
  createNewBoard(templateName);
}

// ── Delete Board ────────────────────────────────────
function deleteBoard(boardId) {
  if (!confirm('Delete this board? This cannot be undone.')) return;
  state.boards = state.boards.filter(b => b.id !== boardId);
  if (state.activeBoard?.id === boardId) gotoDashboard();
  else { renderSidebar(); renderDashboard(); }
}

// ── Go to Dashboard ─────────────────────────────────
function gotoDashboard() {
  state.activeBoard = null;
  state.activeNodeId = null;

  // Header
  els.headerTeamName.textContent = 'Workspace';
  els.boardTitleDisplay.textContent = 'Dashboard';
  els.boardTitleDisplay.style.cursor = 'default';
  els.btnEditTitle.style.display = 'none';
  els.btnShare.style.display = 'none';
  els.collaboratorsStack.style.display = 'none';
  els.fabAskBtn.style.display = 'none';

  // Views
  els.viewDashboard.style.display = 'block';
  els.viewBoardEditor.style.display = 'none';

  // Panels
  els.panelAskAi.classList.remove('open');
  els.panelAgentDetail.classList.remove('open');

  renderSidebar();
  renderDashboard();
}

// ── Load Board Editor ────────────────────────────────
function loadBoard(boardId) {
  const board = state.boards.find(b => b.id === boardId);
  if (!board) return;

  state.activeBoard = board;
  state.activeNodeId = null;

  // Header
  els.headerTeamName.textContent = board.teamName || board.category;
  els.boardTitleDisplay.textContent = board.name;
  els.boardTitleDisplay.style.cursor = 'pointer';
  els.btnEditTitle.style.display = 'flex';
  els.btnShare.style.display = 'inline-flex';
  els.collaboratorsStack.style.display = 'flex';
  els.fabAskBtn.style.display = 'flex';

  // Views
  els.viewDashboard.style.display = 'none';
  els.viewBoardEditor.style.display = 'flex';

  // Close panels
  els.panelAgentDetail.classList.remove('open');

  renderSidebar();
  renderCanvas(board);
}

// ── Inline Title Edit ────────────────────────────────
function enableTitleEdit() {
  if (!state.activeBoard) return;
  els.boardTitleDisplay.style.display = 'none';
  els.btnEditTitle.style.display = 'none';
  els.boardTitleEdit.style.display = 'inline-block';
  els.boardTitleEdit.value = state.activeBoard.name;
  els.boardTitleEdit.focus();
  els.boardTitleEdit.select();
}

function saveTitleEdit() {
  if (els.boardTitleEdit.style.display === 'none') return;
  const newName = els.boardTitleEdit.value.trim();
  if (newName && state.activeBoard) {
    state.activeBoard.name = newName;
    const idx = state.boards.findIndex(b => b.id === state.activeBoard.id);
    if (idx !== -1) state.boards[idx].name = newName;
    els.boardTitleDisplay.textContent = newName;
    renderSidebar();
  }
  cancelTitleEdit();
}

function cancelTitleEdit() {
  els.boardTitleEdit.style.display = 'none';
  els.boardTitleDisplay.style.display = 'inline-block';
  els.btnEditTitle.style.display = 'flex';
}

// ── Render Canvas ────────────────────────────────────
function renderCanvas(board) {
  els.canvasNodesContainer.innerHTML = '';

  // Reset SVG but keep defs
  const defs = els.canvasConnectionsSvg.querySelector('defs');
  els.canvasConnectionsSvg.innerHTML = '';
  if (defs) els.canvasConnectionsSvg.appendChild(defs);

  if (!board.nodes?.length) {
    els.canvasNodesContainer.innerHTML = `
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; color:#9ca3af; font-size:0.9rem;">
        <p>This board is empty.</p>
        <p style="margin-top:8px">Click <strong>Ask AI</strong> to generate a cloud architecture blueprint.</p>
      </div>`;
    return;
  }

  board.nodes.forEach((node, i) => {
    const pos = NODE_POSITIONS[node.id] || DEFAULT_POSITIONS[i % DEFAULT_POSITIONS.length];
    const icon = getNodeIcon(node.type);

    const el = document.createElement('div');
    el.className = `arch-node ${state.activeNodeId === node.id ? 'active' : ''}`;
    el.dataset.id = node.id;
    el.dataset.type = node.type || 'default';
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;

    el.innerHTML = `
      <div class="node-top">
        <div class="node-icon">${icon}</div>
        <div class="node-info">
          <div class="node-name">${node.name}</div>
          <div class="node-type-label">${(node.type || 'resource').toUpperCase()}</div>
        </div>
      </div>
      <div class="node-bottom">
        <span class="node-status-badge">
          <span class="status-dot-live"></span> ${node.status}
        </span>
        <span class="node-inspect-btn">Inspect →</span>
      </div>
    `;

    el.addEventListener('click', () => selectNode(node.id));
    els.canvasNodesContainer.appendChild(el);
  });

  drawConnections(board);
}

// ── Draw SVG connection lines ────────────────────────
function drawConnections(board) {
  const svg = els.canvasConnectionsSvg;

  const drawPath = (fromId, toId) => {
    const fp = NODE_POSITIONS[fromId];
    const tp = NODE_POSITIONS[toId];
    if (!fp || !tp) return;

    const x1 = fp.x + 210; // right edge of node (width=210)
    const y1 = fp.y + 36;
    const x2 = tp.x;
    const y2 = tp.y + 36;
    const cpX = (x1 + x2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cpX} ${y1}, ${cpX} ${y2}, ${x2} ${y2}`);
    path.setAttribute('stroke', '#c4b5fd');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('stroke-dasharray', '5 3');
    path.style.animation = 'none';
    svg.appendChild(path);
  };

  const connMap = {
    'aws-ecommerce':      [['api-gateway','auth-cognito'], ['api-gateway','users-lambda'], ['users-lambda','users-db']],
    'analytics-pipeline': [['kinesis-stream','process-lambda'], ['process-lambda','s3-lake']],
    'serverless-chat':    [['ws-gateway','chat-lambda'], ['chat-lambda','chat-db']],
    'multi-region-sql':   [['route53','rds-primary'], ['route53','rds-replica']],
  };

  const lines = connMap[board.id] || [];
  lines.forEach(([from, to]) => drawPath(from, to));
}

// ── Select node → open Agent Detail ─────────────────
function selectNode(nodeId) {
  state.activeNodeId = nodeId;

  document.querySelectorAll('.arch-node').forEach(el => {
    el.classList.toggle('active', el.dataset.id === nodeId);
  });

  const details = AGENT_DETAILS[nodeId];
  if (!details) return;

  // Populate header
  const nodeConf = state.activeBoard?.nodes.find(n => n.id === nodeId);
  els.agentTypeBadge.textContent = (nodeConf?.type || 'resource').toUpperCase();
  els.agentDetailName.textContent = details.name;

  // Overview tab
  els.overviewTech.textContent = details.overview.technology;
  els.overviewVersion.textContent = details.overview.version;
  els.overviewRegion.textContent = details.overview.region;
  els.overviewDesc.textContent = details.overview.description;
  els.overviewConnectionsList.textContent = details.overview.connections;

  // Specs tab (routes)
  els.agentRoutesList.innerHTML = '';
  details.routes.forEach(route => {
    const methodClass = `badge-${route.method.toLowerCase()}`;
    const div = document.createElement('div');
    div.className = 'route-item';
    div.innerHTML = `
      <div class="route-top">
        <span class="route-badge ${methodClass}">${route.method}</span>
        <span class="route-path" title="${route.path}">${route.path}</span>
        <span class="route-auth">${route.auth}</span>
      </div>
      <div class="route-desc">${route.description}</div>
    `;
    els.agentRoutesList.appendChild(div);
  });

  // Code tab (Terraform)
  els.terraformCodeViewer.innerHTML = highlightTerraform(details.terraform);

  // Switch to overview tab
  switchAgentTab('overview');

  // Open panel, close AI chat
  els.panelAgentDetail.classList.add('open');
  els.panelAskAi.classList.remove('open');
}

// ── Tab switching ────────────────────────────────────
function switchAgentTab(tabName) {
  document.querySelectorAll('.agent-tab').forEach((btn, i) => {
    const names = ['overview', 'specs', 'code'];
    btn.classList.toggle('active', names[i] === tabName);
  });
  ['overview', 'specs', 'code'].forEach(name => {
    $(`tab-panel-${name}`).classList.toggle('active', name === tabName);
  });
}

// ── AI Panel toggle ──────────────────────────────────
function toggleAskAiPanel() {
  els.panelAskAi.classList.toggle('open');
  if (els.panelAskAi.classList.contains('open')) {
    els.panelAgentDetail.classList.remove('open');
    els.chatInputBox.focus();
  }
}

// ── Chat: handle submit ──────────────────────────────
function handleChatSubmit(e) {
  e.preventDefault();
  const text = els.chatInputBox.value.trim();
  if (!text) return;
  appendMsg(text, 'user');
  els.chatInputBox.value = '';
  simulateAIReply(text);
}

function triggerQuickPrompt(key) {
  const labels = {
    'design-aws-backend': 'Design AWS backend',
    'optimize-cost':      'Optimize Cost',
    'security-review':    'Security review of this architecture'
  };
  appendMsg(labels[key] || key, 'user');
  simulateAIReply(key);
}

// ── Append chat message ──────────────────────────────
function appendMsg(text, sender) {
  const isAI = sender === 'ai';
  const div = document.createElement('div');
  div.className = `chat-msg ${isAI ? 'msg-ai' : 'msg-user'}`;

  div.innerHTML = `
    <div class="msg-avatar ${isAI ? 'msg-avatar-ai' : 'msg-avatar-user'}">${isAI ? 'AI' : 'JD'}</div>
    <div class="msg-bubble">${isAI ? formatMarkdown(text) : escapeHtml(text)}</div>
  `;

  els.chatHistoryContainer.appendChild(div);
  els.chatHistoryContainer.scrollTop = els.chatHistoryContainer.scrollHeight;
}

// ── Simulate AI streaming response ──────────────────
function simulateAIReply(query) {
  const sendIco = els.btnSendChat.querySelector('.send-ico');
  const spinIco = els.btnSendChat.querySelector('.spin-ico');
  sendIco.style.display = 'none';
  spinIco.style.display = 'block';
  els.chatInputBox.disabled = true;

  // Resolve response text
  let text = AI_PROMPTS.default;
  const q = query.toLowerCase();
  if (q === 'design-aws-backend' || (q.includes('design') && q.includes('aws'))) {
    text = AI_PROMPTS['design-aws-backend'];
  } else if (q === 'optimize-cost' || q.includes('cost') || q.includes('optim')) {
    text = AI_PROMPTS['optimize-cost'];
  } else if (q === 'security-review' || q.includes('security') || q.includes('review')) {
    text = AI_PROMPTS['security-review'] || AI_PROMPTS.default;
  }

  setTimeout(() => {
    sendIco.style.display = 'block';
    spinIco.style.display = 'none';
    els.chatInputBox.disabled = false;
    els.chatInputBox.focus();
    streamMessage(text);
  }, 900);
}

function streamMessage(fullText) {
  const div = document.createElement('div');
  div.className = 'chat-msg msg-ai';
  div.innerHTML = `
    <div class="msg-avatar msg-avatar-ai">AI</div>
    <div class="msg-bubble"><span class="stream-txt"></span><span class="stream-cursor">▌</span></div>
  `;
  els.chatHistoryContainer.appendChild(div);
  els.chatHistoryContainer.scrollTop = els.chatHistoryContainer.scrollHeight;

  const txtEl = div.querySelector('.stream-txt');
  const curEl = div.querySelector('.stream-cursor');

  let idx = 0;
  const chunkSize = 4;

  const timer = setInterval(() => {
    idx = Math.min(idx + chunkSize, fullText.length);
    txtEl.textContent = fullText.slice(0, idx);
    els.chatHistoryContainer.scrollTop = els.chatHistoryContainer.scrollHeight;

    if (idx >= fullText.length) {
      clearInterval(timer);
      curEl.remove();
      div.querySelector('.msg-bubble').innerHTML = formatMarkdown(fullText);
      els.chatHistoryContainer.scrollTop = els.chatHistoryContainer.scrollHeight;
    }
  }, 18);
}

// ── Copy Terraform ───────────────────────────────────
function copyTerraformCode() {
  if (!state.activeNodeId) return;
  const details = AGENT_DETAILS[state.activeNodeId];
  if (!details) return;

  navigator.clipboard.writeText(details.terraform).then(() => {
    const btn = $('copy-status-text');
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  });
}

// ── Terraform syntax highlighter ─────────────────────
function highlightTerraform(code) {
  if (!code) return '';

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  html = html.replace(/(#[^\n]*)/g, '<span class="tf-cmt">$1</span>');
  // String values
  html = html.replace(/("(?:[^"\\]|\\.)*")/g, (m, s) => {
    if (s.includes('<span')) return s; // skip if already wrapped
    return `<span class="tf-str">${s}</span>`;
  });
  // Keywords
  ['resource','variable','output','provider','locals','terraform','data','module'].forEach(kw => {
    html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="tf-kw">$1</span>');
  });
  // Property names (word before =)
  html = html.replace(/\b([a-z_][a-z0-9_]*)(\s*=(?!=))/g, '<span class="tf-prop">$1</span>$2');
  // Numbers
  html = html.replace(/\b(\d+)\b/g, '<span class="tf-num">$1</span>');

  return html;
}

// ── Markdown formatter for chat bubbles ──────────────
function formatMarkdown(text) {
  let h = escapeHtml(text);

  // Code blocks
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headings
  h = h.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  // Bold / italic
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Bullet list items
  h = h.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Paragraphs
  h = h.split(/\n\n+/).map(p => {
    if (/^<(h[1-4]|ul|pre|li)/.test(p.trim())) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return h;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
