/* Home — hero entrance */
(() => {
  const SS = window.SS || {};
  const hero = document.querySelector('.hero');

  const live = () => {
    hero?.classList.add('is-live');
    hero?.querySelectorAll('[data-chars]').forEach(el => el.classList.add('is-in'));
  };
  SS.revealed ? requestAnimationFrame(live) : document.addEventListener('ss:reveal', () => setTimeout(live, 200), { once: true });
})();
