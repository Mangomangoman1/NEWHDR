/* The homepage only downloads Three.js as this aside approaches the viewport. */
const aside = document.getElementById('repair-play');
if (aside) {
  let started = false;
  async function start() {
    if (started) return;
    started = true;
    aside.dataset.state = 'loading';
    try {
      const { createRepairBallet } = await import('./repair-ballet-scene.js');
      createRepairBallet(aside);
    } catch (error) {
      aside.dataset.state = 'unavailable';
      aside.querySelector('.rb-phase').textContent = 'A little tribute to putting things right.';
      console.warn('Repair animation unavailable; showing the illustration.', error);
    }
  }
  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loader.disconnect(); start(); }
    }, { rootMargin:'250px' });
    loader.observe(aside);
  } else start();
}
