// Data Storage
let DB = { writings: [] };

const FALLBACK = {
  writings: []
};

// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Theme Management
const themeBtn = $('#themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon();

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
});

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
}

// State Management
let state = { q: '', type: 'All', tag: '' };
let allTags = [];

// Set Footer Year
$('#year').textContent = new Date().getFullYear();

// Tag Bar Rendering
const tagBar = $('#tagBar');
function renderTagBar() {
  if (allTags.length === 0) {
    tagBar.style.display = 'none';
    return;
  }
  tagBar.style.display = 'flex';
  tagBar.innerHTML = '';
  
  const clearChip = document.createElement('button');
  clearChip.className = 'chip' + (state.tag === '' ? ' active' : '');
  clearChip.textContent = 'All tags';
  clearChip.onclick = () => { 
    state.tag = ''; 
    refresh(); 
  };
  tagBar.appendChild(clearChip);
  
  allTags.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (state.tag === t ? ' active' : '');
    chip.textContent = '#' + t;
    chip.onclick = () => { 
      state.tag = state.tag === t ? '' : t; 
      refresh(); 
    };
    tagBar.appendChild(chip);
  });
}

// Type Filter Chips
function bindTypeChips() {
  $$('.filter-chips .chip').forEach(c => c.addEventListener('click', (e) => {
    $$('.filter-chips .chip').forEach(x => x.classList.remove('active'));
    e.currentTarget.classList.add('active');
    state.type = e.currentTarget.dataset.type;
    refresh();
  }));
}

// Search Input
$('#searchInput').addEventListener('input', (e) => {
  state.q = e.target.value.toLowerCase();
  refresh();
});

// Render Writings Grid
const writingsGrid = $('#writingsGrid');
function renderWritings() {
  const items = DB.writings.filter(w => {
    const searchText = (w.title + ' ' + w.excerpt + ' ' + w.content + ' ' + w.tags.join(' ')).toLowerCase();
    const matchesQ = searchText.includes(state.q);
    const matchesType = state.type === 'All' ? true : w.type === state.type;
    const matchesTag = state.tag ? w.tags.includes(state.tag) : true;
    return matchesQ && matchesType && matchesTag;
  });

  if (items.length === 0) {
    writingsGrid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px; grid-column: 1 / -1;">No writings found matching your filters.</p>';
    return;
  }

  writingsGrid.innerHTML = items.map((w, idx) => `
    <article class="card">
      <div class="card-header">
        <span class="card-index">#${idx + 1}</span>
        <span class="card-type">${w.type}</span>
      </div>
      <h3>${w.title}</h3>
      <p class="card-excerpt">${w.excerpt}</p>
      <div class="card-tags">
        ${w.tags.map(t => `<button class="tag" data-tag="${t}">#${t}</button>`).join('')}
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary read-btn" data-id="${w.id}">Read →</button>
      </div>
    </article>
  `).join('');

  // Bind tag click events
  $$('#writingsGrid .tag').forEach(el => el.addEventListener('click', (e) => {
    state.tag = e.currentTarget.dataset.tag;
    refresh();
  }));

  // Bind read button events
  $$('#writingsGrid .read-btn').forEach(el => el.addEventListener('click', (e) => {
    openReader(e.currentTarget.dataset.id);
  }));
}

// Reader Modal
const dlg = $('#reader');
const readerTitle = $('#readerTitle');
const readerMeta = $('#readerMeta');
const readerBody = $('#readerBody');

$('.close-btn', dlg).addEventListener('click', () => dlg.close());

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dlg.open) dlg.close();
});

dlg.addEventListener('click', (e) => {
  const content = dlg.querySelector('.reader-content');
  const bounds = content.getBoundingClientRect();
  const clickedInside = e.clientX >= bounds.left && e.clientX <= bounds.right &&
                       e.clientY >= bounds.top && e.clientY <= bounds.bottom;
  if (!clickedInside) dlg.close();
});

function openReader(id) {
  const item = DB.writings.find(x => x.id === id);
  if (!item) return;
  
  const index = DB.writings.findIndex(x => x.id === id) + 1;
  readerTitle.textContent = item.title;
  readerMeta.innerHTML = `<span>#${index}</span> <span>•</span> <span>${item.type}</span>`;
  readerBody.textContent = item.content;
  dlg.showModal();
}

// Refresh Function
function refresh() {
  renderWritings();
  renderTagBar();
}

// Initialize Application
function init() {
  fetch('writings.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('Network response not ok');
      return r.json();
    })
    .then(data => {
      DB = Object.assign({}, FALLBACK, data);
      allTags = Array.from(new Set(DB.writings.flatMap(w => w.tags))).sort();
      
      bindTypeChips();
      refresh();
    })
    .catch(err => {
      console.warn('Could not load writings.json — using fallback DB. Error:', err);
      DB = FALLBACK;
      allTags = [];
      
      bindTypeChips();
      refresh();
    });
}

// Start the application
init();