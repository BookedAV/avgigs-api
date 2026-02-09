/* ============================================
   APP.JS — Shared utilities for all pages
   ============================================ */

// ---- HTML escape ----
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Date formatting ----
function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---- Toast notifications ----
function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = '0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ---- Modal helpers ----
function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ---- Update nav bar based on auth state ----
function updateNavAuth(user, profile) {
  const nav = document.getElementById('nav-auth');
  if (!nav) return;

  if (user && profile) {
    nav.innerHTML = `
      <a href="dashboard.html" class="btn btn-ghost btn-sm">${esc(profile.full_name)}</a>
      <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Log Out</button>
    `;
  } else if (user) {
    nav.innerHTML = `
      <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
      <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Log Out</button>
    `;
  }
  // If no user, default HTML (login/signup links) stays
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ---- Auto-update nav on pages that don't have custom init ----
(async function autoInitNav() {
  // Only run on pages that don't have their own DOMContentLoaded handler
  // (index.html uses this; jobs.html and dashboard.html handle it themselves)
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page === '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      updateNavAuth(user, profile);
    }
  }
})();
