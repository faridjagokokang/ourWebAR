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

    // 🔥 ambil base scale SEKALI (ini kunci biar ga drift)
    const baseScale = getScale(el, DEFAULT_SCALE);

    el.addEventListener('mouseenter', () => {
      el.classList.add('hover-state');
      if (typeof putarSuara === 'function') putarSuara('hover');

      el.removeAttribute('animation__hover_scale');
      el.setAttribute('animation__hover_scale',
        `property: scale; to: ${baseScale.x * 1.05} ${baseScale.y * 1.05} ${baseScale.z * 1.05}; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-state');

      el.removeAttribute('animation__hover_scale');
      el.setAttribute('animation__hover_scale',
        `property: scale; to: ${baseScale.x} ${baseScale.y} ${baseScale.z}; dur: 300; easing: easeOutQuad`);
    });

    let lastTap = 0;

    function toggleRotate() {
      const now = Date.now();

      // cegah double trigger (touch + click)
      if (now - lastTap < 300) return;
      lastTap = now;

      el.diputar = !el.diputar;
      const targetRot = el.diputar ? "0 180 0" : "0 0 0";

      el.removeAttribute('animation__rot');
      el.setAttribute('animation__rot',
        `property: rotation; to: ${targetRot}; dur: 1000; easing: easeInOutElastic`);

      if (typeof putarSuara === 'function') putarSuara('click');
    }

    el.addEventListener('click', toggleRotate);
    el.addEventListener('touchstart', toggleRotate);
  }
});

function tampilkanInfoModel() {
  const titleEl = document.querySelector('#judul-modal');
  const bodyEl = document.querySelector('#isi-modal');
  const modalEl = document.querySelector('#modal-info-model');

  if (titleEl) titleEl.textContent = "📄 Pamflet PMB";
  if (bodyEl) {
    bodyEl.innerHTML = `
      <p>Brosur interaktif Penerimaan Mahasiswa Baru.</p>
    `;
  }

  if (modalEl) modalEl.classList.remove('hidden');
}
let suaraAktif = localStorage.getItem('wabAR_sound') !== 'false';

const sounds = {
  hover: new Audio('./hover.ogg'),
  click: new Audio('./click.ogg'),
  success: new Audio('./success.ogg'),
  error: new Audio('./error.ogg')
};

// 🔥 WAJIB: preload + unlock audio setelah user interaction pertama
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

// trigger sekali saat user pertama klik layar
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

function putarSuara(type) {
  if (!suaraAktif || !audioUnlocked) return;

  const sound = sounds[type];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(err => {
      console.log('Audio gagal:', err);
    });
  }
}

let waktuMulaiTampilan = 0;

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const startBtn = document.querySelector('#tombol-mulai');
  const stopBtn = document.querySelector('#tombol-henti');
  const statusEl = document.querySelector('#status-ar');
  const loadingOverlay = document.querySelector('#lapisan-muat');
  const fullscreenBtn = document.querySelector('#tombol-layar-penuh');
  const infoToggleBtn = document.querySelector('#tombol-info');
  const soundToggleBtn = document.querySelector('#tombol-suara');
  const themeToggleBtn = document.querySelector('#tombol-tema');
  const screenshotBtn = document.querySelector('#tombol-screenshot');
  const settingsBtn = document.querySelector('#tombol-pengaturan');
  const helpBtn = document.querySelector('#tombol-bantuan');
  const aboutBtn = document.querySelector('#tombol-tentang');
  const modelControlsDiv = document.querySelector('#kontrol-model');
  const markerIndicator = document.querySelector('#indikator-marker');

  const darkModeEnabled = localStorage.getItem('wabAR_darkMode') === 'true';
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) themeToggleBtn.classList.add('active');
  }

  let arActive = false;
  let rotasiOtomatisAktif = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchTime = 0;

  function perbaruiStatus(text, isActive = false) {
    statusEl.innerHTML = isActive ? text : `<span class="spinner"></span>${text}`;
    statusEl.classList.toggle('active', isActive);
  }

  function tampilkanLoading(show = true) {
    if (show) {
      loadingOverlay.classList.remove('hidden');
    } else {
      loadingOverlay.classList.add('hidden');
    }
  }

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.classList.remove('hidden');
    perbaruiStatus('Memulai AR...', false);
    tampilkanLoading(true);

    try {
      setTimeout(() => {
        document.body.classList.add('ar-active');
        sceneEl.systems['mindar-image-system'].start();
        tampilkanLoading(false);
        arActive = true;
        waktuMulaiTampilan = Date.now();

        setTimeout(() => {
          startBtn.style.display = 'none';
          perbaruiStatus('✓ AR Aktif - Arahkan ke marker', true);
          modelControlsDiv.classList.remove('hidden');

          const scannerGuide = document.querySelector('#scanner-guide');
          const scanProblemBtn = document.querySelector('#scan-problem-btn');
          if (scannerGuide) scannerGuide.classList.remove('hidden');
          if (scanProblemBtn) scanProblemBtn.classList.remove('hidden');

          putarSuara('success');
        }, 1000);
      }, 1500);
    } catch (error) {
      console.error('Error memulai AR:', error);
      startBtn.disabled = false;
      tampilkanLoading(false);
      perbaruiStatus('❌ Gagal memulai AR', false);
      putarSuara('error');
    }
  });

  stopBtn.addEventListener('click', () => {
    arActive = false;
    document.body.classList.remove('ar-active');
    stopBtn.classList.add('hidden');
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    modelControlsDiv.classList.add('hidden');

    const scannerGuide = document.querySelector('#scanner-guide');
    const scanProblemBtn = document.querySelector('#scan-problem-btn');
    if (scannerGuide) scannerGuide.classList.add('hidden');
    if (scanProblemBtn) scanProblemBtn.classList.add('hidden');

    perbaruiStatus('Menghentikan AR...', false);
    tampilkanLoading(true);

    try {
      sceneEl.systems['mindar-image-system'].stop();

      setTimeout(() => {
        tampilkanLoading(false);
        perbaruiStatus('✓ Siap untuk AR', false);
        putarSuara('click');
      }, 1000);
    } catch (error) {
      console.error('Error menghentikan AR:', error);
      perbaruiStatus('⚠️ Error menghentikan AR', false);
      putarSuara('error');
    }
  });

  fullscreenBtn.addEventListener('click', () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log(err));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      fullscreenBtn.classList.add('active');
      putarSuara('click');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      fullscreenBtn.classList.remove('active');
    }
  });

  infoToggleBtn.addEventListener('click', () => {
    const modal = document.querySelector('#modal-info-model');
    const titleEl = document.querySelector('#judul-modal');
    const bodyEl = document.querySelector('#isi-modal');

    if (titleEl) titleEl.textContent = "📄 Pamflet PMB (Detail)";
    if (bodyEl) {
      bodyEl.innerHTML = `
      <img src="./pamflet.jpg" style="width:100%; border-radius:10px;" />
    `;
    }

    if (modal) modal.classList.remove('hidden');

    putarSuara('click');
  });

  soundToggleBtn.addEventListener('click', () => {
    suaraAktif = !suaraAktif;
    soundToggleBtn.classList.toggle('active');
    localStorage.setItem('wabAR_sound', suaraAktif);
    if (suaraAktif) {
      putarSuara('success');
    }
  });

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('wabAR_darkMode', isDarkMode);
    themeToggleBtn.classList.toggle('active');
    putarSuara('click');
  });

  screenshotBtn.addEventListener('click', () => {
    const canvas = document.querySelector('a-scene canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `wabAR_screenshot_${Date.now()}.png`;
      link.click();
      putarSuara('success');
      perbaruiStatus('📸 Screenshot tersimpan!', true);
      setTimeout(() => {
        perbaruiStatus(arActive ? '✓ AR Aktif' : '✓ Siap untuk AR', arActive);
      }, 2000);
    }
  });

  const modals = document.querySelectorAll('.modal');
  const modalCloses = document.querySelectorAll('.modal-close');

  settingsBtn.addEventListener('click', () => {
    const modal = document.querySelector('#modal-pengaturan');
    if (modal) modal.classList.remove('hidden');
  });

  helpBtn.addEventListener('click', () => {
    const modal = document.querySelector('#modal-bantuan');
    if (modal) modal.classList.remove('hidden');
  });

  aboutBtn.addEventListener('click', () => {
    const modal = document.querySelector('#modal-tentang');
    if (modal) modal.classList.remove('hidden');
  });

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

  const inputKecepatanAnimasi = document.querySelector('#kecepatan-animasi');
  const nilaiKecepatan = document.querySelector('#nilai-kecepatan');
  const toggleRotasiOtomatis = document.querySelector('#toggle-rotasi-otomatis');

  if (inputKecepatanAnimasi) {
    inputKecepatanAnimasi.addEventListener('input', (e) => {
      if (nilaiKecepatan) nilaiKecepatan.textContent = e.target.value;
      const speed = parseInt(e.target.value);
      const animSpeed = 8000 - (speed - 1) * 500;
      document.querySelectorAll('[animation]').forEach(el => {
        el.setAttribute('animation', `property: rotation; to: 0 360 0; dur: ${animSpeed}; easing: linear; loop: true`);
      });
    });
  }

  if (toggleRotasiOtomatis) {
    toggleRotasiOtomatis.addEventListener('change', () => {
      rotasiOtomatisAktif = toggleRotasiOtomatis.checked;
    });
  }

  const rotateLeftBtn = document.querySelector('#putar-kiri');
  const rotateRightBtn = document.querySelector('#putar-kanan');
  const zoomInBtn = document.querySelector('#perbesar');
  const zoomOutBtn = document.querySelector('#perkecil');
  const autoRotateBtn = document.querySelector('#tombol-putar-otomatis');
  const resetBtn = document.querySelector('#tombol-atur-ulang');

  if (rotateLeftBtn) {
    rotateLeftBtn.addEventListener('click', () => {
      putarModel(-15);
      putarSuara('click');
    });
  }

  if (rotateRightBtn) {
    rotateRightBtn.addEventListener('click', () => {
      putarModel(15);
      putarSuara('click');
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      perbesarModel(1.1);
      putarSuara('click');
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      perbesarModel(0.9);
      putarSuara('click');
    });
  }

  if (autoRotateBtn) {
    autoRotateBtn.addEventListener('click', () => {
      rotasiOtomatisAktif = !rotasiOtomatisAktif;
      autoRotateBtn.classList.toggle('active');
      putarSuara('click');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      aturUlangModel();
      putarSuara('success');
    });
  }

  let modelRotation = 0;
  let modelScale = { x: 1.2, y: 1.2, z: 1.2 };

  function putarModel(degrees) {
    modelRotation += degrees;
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      if (!model.hasAttribute('interaksi-brosur')) {
        model.setAttribute('rotation', `0 ${modelRotation} 0`);
      }
    });
  }

  function perbesarModel(factor) {
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      let currentScale = getScale(model, { x: 1, y: 1, z: 1 });
      // Parse scale if it's a string instead of object
      if (typeof currentScale === 'string') {
        const parts = currentScale.split(' ').map(parseFloat);
        currentScale = { x: parts[0], y: parts[1], z: parts[2] };
      }
      model.setAttribute('scale', `${currentScale.x * factor} ${currentScale.y * factor} ${currentScale.z * factor}`);
    });
  }

  function aturUlangModel() {
    modelRotation = 0;
    modelScale = { x: 1.2, y: 1.2, z: 1.2 };
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      if (model.hasAttribute('interaksi-brosur')) {
        model.setAttribute('rotation', '0 0 0');
        model.setAttribute('scale', '1 1 1');
        model.removeAttribute('animation__rot');
        model.diputar = false;
      } else {
        model.setAttribute('rotation', '0 0 0');
        model.setAttribute('scale', '1.2 1.2 1.2');
      }
    });
  }

  document.addEventListener('touchstart', (e) => {
    isDragging = false;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    const currentTime = Date.now();

    if (currentTime - lastTouchTime < 300) {
      aturUlangModel();
      putarSuara('success');
    }
    lastTouchTime = currentTime;
  });

  document.addEventListener('touchmove', (e) => {
    isDragging = true;

    if (!arActive || rotasiOtomatisAktif) return;

    const touchEndX = e.touches[0].clientX;
    const diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        putarModel(5);
      } else {
        putarModel(-5);
      }
      touchStartX = touchEndX;
    }
  });

  const targetEntities = document.querySelectorAll('[mindar-image-target]');

  targetEntities.forEach((entity) => {
    entity.addEventListener('targetFound', () => {
      if (arActive) {
        perbaruiStatus('✅ Marker Terdeteksi!', true);
        if (markerIndicator) markerIndicator.classList.remove('hidden');
        putarSuara('success');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) scannerGuide.classList.add('hidden');

        const models = entity.querySelectorAll('.bisa-diklik');
        models.forEach(model => {
          model.setAttribute('visible', 'true');
          const currentScale = getScale(model, { x: 1, y: 1, z: 1 });
          model.setAttribute('scale', `${currentScale.x} ${currentScale.y} ${currentScale.z}`);
        });
      }
    });

    entity.addEventListener('targetLost', () => {
      if (arActive) {
        perbaruiStatus('🔍 Mencari Marker...', false);
        if (markerIndicator) markerIndicator.classList.add('hidden');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) scannerGuide.classList.remove('hidden');
      }
    });
  });

  let autoRotAngle = 0;

  setInterval(() => {
    if (rotasiOtomatisAktif && arActive) {
      autoRotAngle += 1;
      const models = document.querySelectorAll('.bisa-diklik');
      models.forEach(model => {
        if (!model.hasAttribute('interaksi-brosur')) {
          model.setAttribute('rotation', `0 ${autoRotAngle} 0`);
        }
      });
    }
  }, 30);

  sceneEl.addEventListener('loaded', () => {
    console.log('A-Frame scene dimuat');
    perbaruiStatus('✓ Siap untuk AR', false);
  });

  window.addEventListener('error', (event) => {
    console.error('Error:', event.error);
    perbaruiStatus('⚠️ Terjadi kesalahan', false);
    putarSuara('error');
  });
});