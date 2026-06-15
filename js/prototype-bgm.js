/* Prototype BGM + settings modal */

(function () {
  const VIDEO_ID = '61CPVDw086I';
  const STORAGE_ENABLED = 'proto_bgm_enabled';
  const STORAGE_VOLUME = 'proto_bgm_volume';
  const DEFAULT_VOLUME = 35;

  let player = null;
  let ready = false;
  let playing = false;
  let volume = loadVolume();

  const playerHost = document.getElementById('proto-bgm-player');
  const modal = document.getElementById('proto-settings-modal');
  const openBtn = document.getElementById('proto-settings-open');
  const bgmCheck = document.getElementById('proto-bgm-check');
  const volumeSlider = document.getElementById('proto-bgm-volume');
  const saveBtn = document.getElementById('proto-settings-save');

  if (!playerHost) return;

  function loadVolume() {
    const saved = parseInt(localStorage.getItem(STORAGE_VOLUME), 10);
    return Number.isFinite(saved) ? Math.min(100, Math.max(0, saved)) : DEFAULT_VOLUME;
  }

  function syncUi() {
    if (bgmCheck) bgmCheck.checked = playing;
    if (volumeSlider) volumeSlider.value = String(volume);
    const readout = document.getElementById('proto-bgm-vol-readout');
    if (readout) readout.textContent = String(volume);
    if (openBtn) openBtn.classList.toggle('proto-gear-active', playing);
  }

  function applyVolume(val) {
    volume = Math.min(100, Math.max(0, val));
    if (ready && player) player.setVolume(volume);
    localStorage.setItem(STORAGE_VOLUME, String(volume));
    if (volumeSlider) volumeSlider.value = String(volume);
  }

  function playBgm() {
    if (!ready || !player) return;
    player.unMute();
    player.setVolume(volume);
    player.playVideo();
    playing = true;
    localStorage.setItem(STORAGE_ENABLED, '1');
    syncUi();
  }

  function pauseBgm() {
    if (!ready || !player) return;
    player.pauseVideo();
    playing = false;
    localStorage.setItem(STORAGE_ENABLED, '0');
    syncUi();
  }

  function openModal() {
    if (!modal) return;
    syncUi();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('proto-modal-visible'));
    document.body.classList.add('proto-modal-open');
    if (saveBtn) saveBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('proto-modal-visible');
    document.body.classList.remove('proto-modal-open');
    setTimeout(() => {
      modal.hidden = true;
    }, 220);
    if (openBtn) openBtn.focus();
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('proto-bgm-player', {
      height: '0',
      width: '0',
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        loop: 1,
        playlist: VIDEO_ID
      },
      events: {
        onReady: function () {
          ready = true;
          syncUi();
          if (localStorage.getItem(STORAGE_ENABLED) === '1') {
            playBgm();
          }
        },
        onStateChange: function (event) {
          if (event.data === YT.PlayerState.ENDED) {
            player.playVideo();
          }
        }
      }
    });
  };

  function saveAndClose() {
    if (bgmCheck) {
      if (bgmCheck.checked) playBgm();
      else pauseBgm();
    }
    if (volumeSlider) applyVolume(parseInt(volumeSlider.value, 10));
    closeModal();
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (saveBtn) saveBtn.addEventListener('click', saveAndClose);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  if (bgmCheck) {
    bgmCheck.addEventListener('change', () => {
      if (bgmCheck.checked) playBgm();
      else pauseBgm();
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      applyVolume(parseInt(volumeSlider.value, 10));
      const readout = document.getElementById('proto-bgm-vol-readout');
      if (readout) readout.textContent = volumeSlider.value;
    });
  }

  syncUi();

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();
