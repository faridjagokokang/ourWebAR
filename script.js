const DEFAULT_SCALE = { x: 1.2, y: 1.2, z: 1.2 };

function getScale(el, defaultScale = DEFAULT_SCALE) {
  let scale = el.getAttribute('scale');
  if (!scale) return { ...defaultScale };
  if (typeof scale === 'string') {
    const parts = scale.split(' ').map(Number);
    return {
      x: parts[0] || defaultScale.x,
      y: parts[1] || defaultScale.y,
      z: parts[2] || defaultScale.z
    };
  }
  return scale;
}

AFRAME.registerComponent('interaksi-brosur', {
  init: function () {
    const el = this.el;
    el.diputar = false;

    el.addEventListener('mouseenter', () => {
      el.classList.add('hover-state');
      if (typeof putarSuara === 'function') putarSuara('hover');

      el.removeAttribute('animation__hover_scale');
      el.setAttribute('animation__hover_scale',
        `property: scale; to: 1.05 1.05 1.05; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-state');

      el.removeAttribute('animation__hover_scale');
      el.setAttribute('animation__hover_scale',
        `property: scale; to: 1 1 1; dur: 300; easing: easeOutQuad`);
    });

    let lastTap = 0;

    function toggleRotate(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const now = Date.now();
      if (now - lastTap < 300) return;
      lastTap = now;

      el.diputar = !el.diputar;
      const targetRot = el.diputar ? "0 180 0" : "0 0 0";

      el.removeAttribute('animation__rot');
      setTimeout(() => {
        el.setAttribute('animation__rot',
          `property: rotation; to: ${targetRot}; dur: 1000; easing: easeInOutElastic`);
      }, 20);

      if (typeof putarSuara === 'function') putarSuara('click');
    }

    el.addEventListener('click', toggleRotate);
    el.addEventListener('mousedown', toggleRotate);
    el.addEventListener('touchstart', toggleRotate);
  }
});

let suaraAktif = localStorage.getItem('wabAR_sound') !== 'false';

const sounds = {
  hover: new Audio('./hover.ogg'),
  click: new Audio('./click.ogg'),
  success: new Audio('./success.ogg'),
  error: new Audio('./error.ogg')
};

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  Object.values(sounds).forEach(sound => {
    sound.volume = 1;
    sound.play().then(() => {
      sound.pause();
      sound.currentTime = 0;
    }).catch(() => { });
  });
  audioUnlocked = true;
}

document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

function putarSuara(type) {
  if (!suaraAktif || !audioUnlocked) return;
  const sound = sounds[type];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(err => console.log('Audio gagal:', err));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const startBtn = document.querySelector('#tombol-mulai');
  const stopBtn = document.querySelector('#tombol-henti');
  const statusEl = document.querySelector('#status-ar');
  const loadingOverlay = document.querySelector('#lapisan-muat');
  
  // Sidebar Buttons
  const fullscreenBtn = document.querySelector('#tombol-layar-penuh');
  const soundToggleBtn = document.querySelector('#tombol-suara');
  const screenshotBtn = document.querySelector('#tombol-screenshot');
  const settingsToggleBtn = document.querySelector('#tombol-pengaturan');
  
  // Other Elements
  const scanProblemBtn = document.querySelector('#scan-problem-btn');
  const modelControlsDiv = document.querySelector('#kontrol-model');
  const markerIndicator = document.querySelector('#indikator-marker');
  
  // Settings Inputs
  const autoRotateToggle = document.querySelector('#toggle-rotasi-otomatis');
  const animationSpeedInput = document.querySelector('#kecepatan-animasi');
  const speedValueText = document.querySelector('#nilai-kecepatan');
  const gestureControlToggle = document.querySelector('#gesture-control-toggle');

  let arActive = false;
  let rotasiOtomatisAktif = autoRotateToggle ? autoRotateToggle.checked : false;
  let kecepatanAnimasi = animationSpeedInput ? parseInt(animationSpeedInput.value) : 5;
  let gestureAktif = gestureControlToggle ? gestureControlToggle.checked : true;
  let scanTimeout;
  let touchStartX = 0;
  let lastTouchTime = 0;

  function perbaruiStatus(text, isActive = false) {
    statusEl.innerHTML = isActive ? text : `<span class="spinner"></span>${text}`;
    statusEl.classList.toggle('active', isActive);
  }

  function tampilkanLoading(show = true) {
    if (show) loadingOverlay.classList.remove('hidden');
    else loadingOverlay.classList.add('hidden');
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.classList.remove('hidden');
    perbaruiStatus('Memulai AR...', false);
    tampilkanLoading(true);

    setTimeout(() => {
      try {
        if (!sceneEl.systems['mindar-image-system']) {
          throw new Error("Sistem AR belum dimuat sepenuhnya. Coba muat ulang halaman.");
        }
        
        document.body.classList.add('ar-active');
        document.documentElement.classList.add('ar-active');
        
        sceneEl.systems['mindar-image-system'].start();
        tampilkanLoading(false);
        arActive = true;

        setTimeout(() => {
          startBtn.style.display = 'none';
          perbaruiStatus('AR Aktif', true);
          modelControlsDiv.classList.remove('hidden');

          const scannerGuide = document.querySelector('#scanner-guide');
          if (scannerGuide) scannerGuide.classList.remove('hidden');
          putarSuara('success');
        }, 1000);
      } catch (error) {
        console.error('Error memulai AR:', error);
        startBtn.disabled = false;
        tampilkanLoading(false);
        perbaruiStatus('Gagal: ' + error.message, false);
        putarSuara('error');
        alert("Gagal mengakses kamera. Pastikan Anda memberikan izin kamera atau menggunakan HTTPS / Live Server.");
      }
    }, 1500);
  });

  stopBtn.addEventListener('click', () => {
    arActive = false;
    document.body.classList.remove('ar-active');
    document.documentElement.classList.remove('ar-active');
    stopBtn.classList.add('hidden');
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    modelControlsDiv.classList.add('hidden');

    const scannerGuide = document.querySelector('#scanner-guide');
    if (scannerGuide) scannerGuide.classList.add('hidden');
    if (scanProblemBtn) scanProblemBtn.classList.add('hidden');
    if (scanTimeout) clearTimeout(scanTimeout);

    perbaruiStatus('Menghentikan AR...', false);
    tampilkanLoading(true);

    try {
      sceneEl.systems['mindar-image-system'].stop();
      setTimeout(() => {
        tampilkanLoading(false);
        perbaruiStatus('Siap untuk AR', false);
        putarSuara('click');
      }, 1000);
    } catch (error) {
      console.error('Error menghentikan AR:', error);
      perbaruiStatus('Error menghentikan AR', false);
      putarSuara('error');
    }
  });

  fullscreenBtn.addEventListener('click', () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(err => console.log(err));
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      fullscreenBtn.classList.add('active');
      putarSuara('click');
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      fullscreenBtn.classList.remove('active');
    }
  });

  // Sound Toggle
  if (!suaraAktif) soundToggleBtn.classList.remove('active');
  soundToggleBtn.addEventListener('click', () => {
    suaraAktif = !suaraAktif;
    soundToggleBtn.classList.toggle('active');
    localStorage.setItem('wabAR_sound', suaraAktif);
    if (suaraAktif) putarSuara('success');
  });

  // Modals Toggles
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', () => {
      document.querySelector('#modal-pengaturan').classList.remove('hidden');
      putarSuara('click');
    });
  }

  // Scan Problem Action
  if (scanProblemBtn) {
    scanProblemBtn.addEventListener('click', () => {
      perbaruiStatus('Memuat ulang...', false);
      if (sceneEl.systems['mindar-image-system']) {
        sceneEl.systems['mindar-image-system'].stop();
        setTimeout(() => {
          sceneEl.systems['mindar-image-system'].start();
          scanProblemBtn.classList.add('hidden');
        }, 1000);
      }
      putarSuara('click');
    });
  }

  screenshotBtn.addEventListener('click', () => {
    const aframeCanvas = sceneEl.canvas;
    const video = document.querySelector('video');

    if (aframeCanvas) {
      const canvas = document.createElement('canvas');
      canvas.width = aframeCanvas.width;
      canvas.height = aframeCanvas.height;
      const ctx = canvas.getContext('2d');

      if (video) {
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, startX, startY;

        if (videoRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoRatio;
          startX = (canvas.width - drawWidth) / 2;
          startY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoRatio;
          startX = 0;
          startY = (canvas.height - drawHeight) / 2;
        }
        ctx.drawImage(video, startX, startY, drawWidth, drawHeight);
      }

      ctx.drawImage(aframeCanvas, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `WabAR_${Date.now()}.png`;
      link.click();
      putarSuara('success');
      perbaruiStatus('Screenshot tersimpan!', true);
      setTimeout(() => {
        perbaruiStatus(arActive ? 'AR Aktif' : 'Siap untuk AR', arActive);
      }, 2000);
    }
  });

  const modals = document.querySelectorAll('.modal');
  const modalCloses = document.querySelectorAll('.modal-close');

  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const modal = closeBtn.closest('.modal');
      if (modal) modal.classList.add('hidden');
      putarSuara('click');
    });
  });

  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        putarSuara('click');
      }
    });
  });

  // Settings Handlers
  if (autoRotateToggle) {
    autoRotateToggle.addEventListener('change', (e) => {
      rotasiOtomatisAktif = e.target.checked;
      const autoRotateBtn = document.querySelector('#tombol-putar-otomatis');
      if (autoRotateBtn) autoRotateBtn.classList.toggle('active', rotasiOtomatisAktif);
      putarSuara('click');
    });
  }

  if (animationSpeedInput) {
    animationSpeedInput.addEventListener('input', (e) => {
      kecepatanAnimasi = parseInt(e.target.value);
      if (speedValueText) speedValueText.textContent = kecepatanAnimasi;
    });
  }

  if (gestureControlToggle) {
    gestureControlToggle.addEventListener('change', (e) => {
      gestureAktif = e.target.checked;
      putarSuara('click');
    });
  }

  // Model Control Buttons
  const rotateLeftBtn = document.querySelector('#putar-kiri');
  const rotateRightBtn = document.querySelector('#putar-kanan');
  const zoomInBtn = document.querySelector('#perbesar');
  const zoomOutBtn = document.querySelector('#perkecil');
  const autoRotateBtn = document.querySelector('#tombol-putar-otomatis');
  const resetBtn = document.querySelector('#tombol-atur-ulang');

  if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => { putarModel(-15); putarSuara('click'); });
  if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => { putarModel(15); putarSuara('click'); });
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => { perbesarModel(1.1); putarSuara('click'); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => { perbesarModel(0.9); putarSuara('click'); });
  
  if (autoRotateBtn) {
    if (rotasiOtomatisAktif) autoRotateBtn.classList.add('active');
    autoRotateBtn.addEventListener('click', () => {
      rotasiOtomatisAktif = !rotasiOtomatisAktif;
      autoRotateBtn.classList.toggle('active');
      if (autoRotateToggle) autoRotateToggle.checked = rotasiOtomatisAktif;
      putarSuara('click');
    });
  }

  if (resetBtn) resetBtn.addEventListener('click', () => { aturUlangModel(); putarSuara('success'); });

  let modelRotation = 0;

  function putarModel(degrees) {
    modelRotation += degrees;
    const models = document.querySelectorAll('.kontrol-ui');
    models.forEach(model => {
      model.setAttribute('rotation', `0 ${modelRotation} 0`);
    });
  }

  function perbesarModel(factor) {
    const models = document.querySelectorAll('.kontrol-ui');
    models.forEach(model => {
      let currentScale = getScale(model, { x: 1, y: 1, z: 1 });
      model.setAttribute('scale', `${currentScale.x * factor} ${currentScale.y * factor} ${currentScale.z * factor}`);
    });
  }

  function aturUlangModel() {
    modelRotation = 0;
    const models = document.querySelectorAll('.kontrol-ui');
    models.forEach(model => {
      model.setAttribute('rotation', '0 0 0');
      const baseScale = model.getAttribute('data-base-scale') || '2 2 2';
      model.setAttribute('scale', baseScale);
    });

    const brosurInner = document.querySelector('#brosur');
    if (brosurInner) {
      brosurInner.setAttribute('rotation', '0 0 0');
      brosurInner.removeAttribute('animation__rot');
      brosurInner.diputar = false;
    }
  }

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    const currentTime = Date.now();
    if (currentTime - lastTouchTime < 300) {
      aturUlangModel();
      putarSuara('success');
    }
    lastTouchTime = currentTime;
  });

  document.addEventListener('touchmove', (e) => {
    if (!arActive || rotasiOtomatisAktif || !gestureAktif) return;
    const touchEndX = e.touches[0].clientX;
    const diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) putarModel(5);
      else putarModel(-5);
      touchStartX = touchEndX;
    }
  });

  const targetEntities = document.querySelectorAll('[mindar-image-target]');

  targetEntities.forEach((entity) => {
    entity.addEventListener('targetFound', () => {
      if (arActive) {
        if(scanTimeout) clearTimeout(scanTimeout);
        if (scanProblemBtn) scanProblemBtn.classList.add('hidden');

        perbaruiStatus('Marker Terdeteksi!', true);
        if (markerIndicator) markerIndicator.classList.remove('hidden');
        putarSuara('success');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) scannerGuide.classList.add('hidden');

        const models = entity.querySelectorAll('.kontrol-ui');
        models.forEach(model => {
          model.setAttribute('visible', 'true');
        });
      }
    });

    entity.addEventListener('targetLost', () => {
      if (arActive) {
        perbaruiStatus('Mencari Marker...', false);
        if (markerIndicator) markerIndicator.classList.add('hidden');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) scannerGuide.classList.remove('hidden');

        if(scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanProblemBtn) scanProblemBtn.classList.remove('hidden');
        }, 5000);
      }
    });
  });

  setInterval(() => {
    if (rotasiOtomatisAktif && arActive) {
      modelRotation += (kecepatanAnimasi * 0.2);
      const models = document.querySelectorAll('.kontrol-ui');
      models.forEach(model => {
        model.setAttribute('rotation', `0 ${modelRotation} 0`);
      });
    }
  }, 30);

  sceneEl.addEventListener('loaded', () => {
    perbaruiStatus('Siap untuk AR', false);
  });

  window.addEventListener('error', (event) => {
    perbaruiStatus('Terjadi kesalahan', false);
    putarSuara('error');
  });
});