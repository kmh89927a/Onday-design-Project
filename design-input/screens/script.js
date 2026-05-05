// onday-design — multi-page static site
// Lightweight: highlights active page in nav rail, syncs interactive states.

(function () {
  'use strict';

  // 1) Mark active link in the nav rail
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-rail a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === here) a.classList.add('active');
  });

  // 2) Mode card toggle (diagnosis page)
  document.querySelectorAll('[data-mode-group]').forEach(group => {
    const cards = group.querySelectorAll('.mode-card');
    cards.forEach(c => c.addEventListener('click', () => {
      cards.forEach(x => x.classList.remove('is-active'));
      c.classList.add('is-active');
    }));
  });

  // 3) Tabs (result page time-slot)
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = group.querySelectorAll('.tabs__tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
    }));
  });

  // 4) "이전 조건 불러오기" demo toast
  const reloadBtn = document.querySelector('[data-reload-conditions]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      reloadBtn.textContent = '✓ 불러왔어요';
      setTimeout(() => { reloadBtn.innerHTML = reloadBtn.dataset.label || '이전 조건 불러오기'; }, 1400);
    });
  }
})();
