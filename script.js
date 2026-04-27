const terjemahan = {
  id: {
    nabi: { title: '👤 NABI', desc: 'Model interaktif figur bersejarah yang memainkan peran penting dalam sejarah.' },
    maryam: { title: '👩 MARYAM', desc: 'Model interaktif figur bersejarah yang dikenal dalam tradisi keagamaan.' },
  },
  en: {
    nabi: { title: '👤 PROPHET', desc: 'Interactive 3D model of a historical figure who played an important role in history.' },
    maryam: { title: '👩 MARYAM', desc: 'Interactive 3D model of a historical figure known in religious tradition.' },
  },
  ar: {
    nabi: { title: '👤 النبي', desc: 'نموذج تفاعلي ثلاثي الأبعاد لشخصية تاريخية لعبت دوراً مهماً في التاريخ.' },
    maryam: { title: '👩 مريم', desc: 'نموذج تفاعلي ثلاثي الأبعاد لشخصية تاريخية معروفة في التقليد الديني.' },
  }
};

let bahasaSaatIni = localStorage.getItem('wabAR_language') || 'id';

AFRAME.registerComponent('interaksi-objek', {
  init: function () {
    const el = this.el;
    const panel = el.parentNode.querySelector('.panel-info');
    let muncul = false;

    el.addEventListener('mouseenter', () => {
      el.classList.add('hover-state');
      putarSuara('hover');
      
      const currentScale = el.getAttribute('scale') || {x: 1.2, y: 1.2, z: 1.2};
      el.setAttribute('animation__hover_scale', `property: scale; to: ${currentScale.x * 1.05} ${currentScale.y * 1.05} ${currentScale.z * 1.05}; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-state');
      
      const currentScale = el.getAttribute('scale') || {x: 1.2, y: 1.2, z: 1.2};
      // Revert hover scale by removing it so it falls back to its normal scale attribute or we animate back
      // Since scale might have been changed by controls, we animate back to currentScale / 1.05
      el.setAttribute('animation__hover_scale', `property: scale; to: ${currentScale.x / 1.05} ${currentScale.y / 1.05} ${currentScale.z / 1.05}; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('click', () => {
      const currentScale = el.getAttribute('scale') || {x: 1.2, y: 1.2, z: 1.2};
      el.setAttribute('animation__click_scale', `property: scale; to: ${currentScale.x * 1.2} ${currentScale.y * 1.2} ${currentScale.z * 1.2}; dur: 200; easing: easeOutQuad; dir: alternate; loop: 1`);

      muncul = !muncul;
      if(panel) {
        panel.setAttribute('visible', muncul);
        if(muncul) {
          panel.setAttribute('animation__appear', 'property: scale; from: 0.1 0.1 0.1; to: 1 1 1; dur: 500; easing: easeOutElastic');
        } else {
          panel.removeAttribute('animation__appear');
        }
      }
      putarSuara('click');
      perbaruiStatistik('interaction');

      const modelIndex = el.parentNode.getAttribute('mindar-image-target') ?
        el.parentNode.getAttribute('mindar-image-target').split(':')[1].trim() : 0;
      tampilkanInfoModel(modelIndex);
    });
  }
});

AFRAME.registerComponent('interaksi-brosur', {
  init: function () {
    const el = this.el;
    let diputar = false;

    el.addEventListener('mouseenter', () => {
      el.classList.add('hover-state');
      if (typeof putarSuara === 'function') putarSuara('hover');
      
      const currentScale = el.getAttribute('scale') || {x: 1, y: 1, z: 1};
      el.setAttribute('animation__hover_scale', `property: scale; to: ${currentScale.x * 1.05} ${currentScale.y * 1.05} ${currentScale.z * 1.05}; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('mouseleave', () => {
      el.classList.remove('hover-state');
      const currentScale = el.getAttribute('scale') || {x: 1, y: 1, z: 1};
      el.setAttribute('animation__hover_scale', `property: scale; to: ${currentScale.x / 1.05} ${currentScale.y / 1.05} ${currentScale.z / 1.05}; dur: 300; easing: easeOutQuad`);
    });

    el.addEventListener('click', () => {
      diputar = !diputar;
      const targetRot = diputar ? "0 180 0" : "0 0 0";

      // Hapus animasi sebelumnya lalu set animasi baru untuk rotasi 180 derajat
      el.removeAttribute('animation__rot');
      el.setAttribute('animation__rot', `property: rotation; to: ${targetRot}; dur: 1000; easing: easeInOutElastic`);
      
      const currentScale = el.getAttribute('scale') || {x: 1, y: 1, z: 1};
      el.setAttribute('animation__click_scale', `property: scale; to: ${currentScale.x * 1.2} ${currentScale.y * 1.2} ${currentScale.z * 1.2}; dur: 500; easing: easeOutQuad; dir: alternate; loop: 1`);

      if (typeof putarSuara === 'function') putarSuara('click');
      if (typeof perbaruiStatistik === 'function') perbaruiStatistik('interaction');
    });
  }
});

function tampilkanInfoModel(modelIndex) {
  const models = ['nabi', 'maryam'];
  const model = models[modelIndex] || 'nabi';
  const info = terjemahan[bahasaSaatIni][model];

  const titleEl = document.querySelector('#judul-modal');
  const bodyEl = document.querySelector('#isi-modal');
  const modalEl = document.querySelector('#modal-info-model');

  if (titleEl) titleEl.textContent = info.title;
  if (bodyEl) bodyEl.innerHTML = `<p>${info.desc}</p>`;
  if (modalEl) modalEl.classList.remove('hidden');
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let suaraAktif = localStorage.getItem('wabAR_sound') !== 'false';

function putarSuara(type) {
  if (!suaraAktif) return;

  try {
    const duration = 0.1;
    const now = audioContext.currentTime;

    switch (type) {
      case 'hover':
        /* Suara feedback hover - nada tipis & cepat */
        const oscHover = audioContext.createOscillator();
        const gainHover = audioContext.createGain();
        oscHover.connect(gainHover);
        gainHover.connect(audioContext.destination);
        oscHover.frequency.value = 1200;
        gainHover.gain.setValueAtTime(0.05, now);
        gainHover.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        oscHover.start(now);
        oscHover.stop(now + 0.08);
        break;

      case 'click':
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 800;
        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);
        osc1.start(now);
        osc1.stop(now + duration);
        break;

      case 'success':
        for (let i = 0; i < 2; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 600 + i * 200;
          gain.gain.setValueAtTime(0.05, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * 0.1);
          osc.start(now + i * 0.1);
          osc.stop(now + (i + 1) * 0.1);
        }
        break;

      case 'error':
        const oscErr = audioContext.createOscillator();
        const gainErr = audioContext.createGain();
        oscErr.connect(gainErr);
        gainErr.connect(audioContext.destination);
        oscErr.frequency.value = 300;
        gainErr.gain.setValueAtTime(0.1, now);
        gainErr.gain.exponentialRampToValueAtTime(0.01, now + duration);
        oscErr.start(now);
        oscErr.stop(now + duration);
        break;
    }
  } catch (e) {
    console.log('Sound not supported');
  }
}

let fps = 0;
let lastTime = Date.now();
let frameCount = 0;
let showFPS = false;

function perbaruiFPS() {
  frameCount++;
  const currentTime = Date.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    fps = Math.round(frameCount * 1000 / elapsed);
    const fpsEl = document.querySelector('#penghitung-fps');
    if (fpsEl) {
      fpsEl.textContent = `FPS: ${fps}`;
    }
    frameCount = 0;
    lastTime = currentTime;
  }
}

let waktuMulaiTampilan = Date.now();
let jumlahInteraksi = 0;

function perbaruiStatistik(type) {
  if (type === 'interaction') {
    jumlahInteraksi++;
    const el = document.querySelector('#hitung-interaksi');
    if (el) el.textContent = jumlahInteraksi;
  }

  const elapsedSeconds = Math.floor((Date.now() - waktuMulaiTampilan) / 1000);
  const el2 = document.querySelector('#waktu-tampilan');
  if (el2) el2.textContent = elapsedSeconds + 's';
}

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  const startBtn = document.querySelector('#tombol-mulai');
  const stopBtn = document.querySelector('#tombol-henti');
  const statusEl = document.querySelector('#status-ar');
  const instructionsEl = document.querySelector('#instruksi');
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
  const fpsCounter = document.querySelector('#penghitung-fps');
  const markerIndicator = document.querySelector('#indikator-marker');
  const statsPanel = document.querySelector('#panel-statistik');

  const darkModeEnabled = localStorage.getItem('wabAR_darkMode') === 'true';
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) themeToggleBtn.classList.add('active');
  }

  let arActive = false;
  let rotasiOtomatisAktif = false;
  let modelSaatIni = null;
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
    
    // Show scanner guide, scan problem btn
    const scannerGuide = document.querySelector('#scanner-guide');
    const scanProblemBtn = document.querySelector('#scan-problem-btn');

    try {
      setTimeout(() => {
        sceneEl.systems['mindar-image-system'].start();
        tampilkanLoading(false);
        arActive = true;
        waktuMulaiTampilan = Date.now();

        setTimeout(() => {
          startBtn.style.display = 'none';
          perbaruiStatus('✓ AR Aktif - Arahkan ke marker', true);
          instructionsEl.classList.add('hidden');
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
        instructionsEl.classList.remove('hidden');
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
    showFPS = !showFPS;
    if (showFPS) {
      fpsCounter.classList.add('show');
      if (statsPanel) statsPanel.classList.remove('hidden');
      infoToggleBtn.classList.add('active');
    } else {
      fpsCounter.classList.remove('show');
      if (statsPanel) statsPanel.classList.add('hidden');
      infoToggleBtn.classList.remove('active');
    }
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

  document.querySelectorAll('.tombol-bahasa').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tombol-bahasa').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bahasaSaatIni = btn.getAttribute('data-lang');
      localStorage.setItem('wabAR_language', bahasaSaatIni);
      putarSuara('click');
    });

    if (btn.getAttribute('data-lang') === bahasaSaatIni) {
      btn.classList.add('active');
    }
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
      model.setAttribute('rotation', `0 ${modelRotation} 0`);
    });
  }

  function perbesarModel(factor) {
    modelScale.x *= factor;
    modelScale.y *= factor;
    modelScale.z *= factor;

    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      model.setAttribute('scale', `${modelScale.x} ${modelScale.y} ${modelScale.z}`);
    });
  }

  function aturUlangModel() {
    modelRotation = 0;
    modelScale = { x: 1.2, y: 1.2, z: 1.2 };
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      model.setAttribute('rotation', '0 0 0');
      model.setAttribute('scale', '1.2 1.2 1.2');
    });
  }

  document.addEventListener('touchstart', (e) => {
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
      if (arActive && markerIndicator) {
        markerIndicator.classList.remove('hidden');
        putarSuara('click');
        
        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) scannerGuide.classList.add('hidden');
        
        // Pop-in animation
        const models = entity.querySelectorAll('.bisa-diklik');
        models.forEach(model => {
           const currentScale = model.getAttribute('scale') || {x: 1, y: 1, z: 1};
           model.setAttribute('animation__popin', `property: scale; from: 0 0 0; to: ${currentScale.x} ${currentScale.y} ${currentScale.z}; dur: 1000; easing: easeOutElastic`);
        });
      }
    });

    entity.addEventListener('targetLost', () => {
      if (markerIndicator) {
        markerIndicator.classList.add('hidden');
      }
      
      const scannerGuide = document.querySelector('#scanner-guide');
      if (scannerGuide) scannerGuide.classList.remove('hidden');
      const models = entity.querySelectorAll('.bisa-diklik');
      models.forEach(model => {
         model.removeAttribute('animation__popin');
      });
    });
  });

  let autoRotAngle = 0;
  setInterval(() => {
    if (rotasiOtomatisAktif && arActive) {
      autoRotAngle += 1;
      const models = document.querySelectorAll('.bisa-diklik');
      models.forEach(model => {
        model.setAttribute('rotation', `0 ${autoRotAngle} 0`);
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

  function animate() {
    if (showFPS) {
      perbaruiFPS();
      perbaruiStatistik();
    }
    requestAnimationFrame(animate);
  }
  animate();

  setInterval(() => {
    if (arActive && showFPS) {
      perbaruiStatistik();
    }
  }, 1000);
});
