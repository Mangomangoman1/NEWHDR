(() => {
  const scene = document.querySelector('.footer-clay');
  if (!scene) return;

  const video = scene.querySelector('video');
  const toggle = scene.querySelector('button');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  let visible = false;
  let userPaused = false;

  function updateButton() {
    toggle.textContent = video.paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', video.paused ? 'Play animation' : 'Pause animation');
  }

  function syncPlayback() {
    const staticOnly = motion.matches || saveData;
    toggle.hidden = staticOnly || !video.hasAttribute('src');
    if (staticOnly) scene.classList.remove('has-video');
    if (!visible || document.hidden || staticOnly || userPaused) {
      video.pause();
      return;
    }
    // No video request until the little scene actually enters the viewport.
    if (!video.hasAttribute('src')) {
      video.muted = true;
      video.src = video.dataset.src;
    }
    toggle.hidden = false;
    video.play().catch(updateButton);
  }

  video.addEventListener('playing', () => {
    if (!motion.matches) scene.classList.add('has-video');
    updateButton();
  });
  video.addEventListener('pause', updateButton);
  video.addEventListener('error', () => {
    scene.classList.remove('has-video');
    toggle.hidden = true;
  });
  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    syncPlayback();
  });
  motion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);

  // Browsers without IntersectionObserver retain the still image.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncPlayback();
    }, { threshold: [0, 0.25] }).observe(scene);
  }
})();
