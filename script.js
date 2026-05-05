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

AFRAME.registerComponent('ar-nav-button', {
  schema: { type: 'string', default: 'next' },
  init: function () {
    const el = this.el;

    el.setAttribute('sound__click', 'src: url(./click.ogg); on: click; poolSize: 2; volume: 3');
    el.setAttribute('sound__hover', 'src: url(./hover.ogg); on: mouseenter; poolSize: 2; volume: 1');

    el.addEventListener('mouseenter', () => {
      el.setAttribute('material', 'color: #32d74b');
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('material', 'color: #0a84ff');
    });
    el.addEventListener('click', (e) => {
      if (e) e.stopPropagation();
      window.dispatchEvent(new CustomEvent('ar-page-change', { detail: { dir: this.data } }));
    });
  }
});

AFRAME.registerComponent('cyber-particles', {
  schema: {
    count: { type: 'number', default: 50 },
    color: { type: 'color', default: '#0a84ff' }
  },
  init: function () {
    for (let i = 0; i < this.data.count; i++) {
      let particle = document.createElement('a-circle');

      let x = (Math.random() - 0.5) * 5;
      let y = (Math.random() - 0.5) * 5;
      let z = (Math.random() - 0.5) * 4;

      let scale = Math.random() * 0.03 + 0.01;

      particle.setAttribute('position', `${x} ${y} ${z}`);
      particle.setAttribute('scale', `${scale} ${scale} ${scale}`);
      particle.setAttribute('material', `color: ${this.data.color}; shader: flat; transparent: true; opacity: 0.8`);

      let dur = Math.random() * 6000 + 4000;

      particle.setAttribute('animation__float', `property: position; to: ${x + (Math.random() - 0.5)} ${y + 3} ${z + (Math.random() - 0.5)}; dur: ${dur}; loop: true; easing: linear`);
      particle.setAttribute('animation__pulse', `property: material.opacity; from: 0.1; to: 0.9; dur: ${dur / 3}; dir: alternate; loop: true; easing: easeInOutSine`);

      this.el.appendChild(particle);
    }
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

  const fullscreenBtn = document.querySelector('#tombol-layar-penuh');
  const soundToggleBtn = document.querySelector('#tombol-suara');
  const screenshotBtn = document.querySelector('#tombol-screenshot');
  const settingsToggleBtn = document.querySelector('#tombol-pengaturan');

  const scanProblemBtn = document.querySelector('#scan-problem-btn');
  const modelControlsDiv = document.querySelector('#kontrol-model');
  const markerIndicator = document.querySelector('#indikator-marker');

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

    let loadingProgress = 0;
    const fillEl = document.querySelector('#loading-fill');
    const pctEl = document.querySelector('#loading-pct');

    const loadingInterval = setInterval(() => {
      loadingProgress += Math.random() * 20;
      if (loadingProgress > 95) loadingProgress = 95;
      if (fillEl) fillEl.style.width = loadingProgress + '%';
      if (pctEl) pctEl.textContent = Math.floor(loadingProgress) + '%';
    }, 150);

    setTimeout(() => {
      try {
        if (!sceneEl.systems['mindar-image-system']) {
          throw new Error("Sistem AR belum dimuat sepenuhnya. Coba muat ulang halaman.");
        }

        document.body.classList.add('ar-active');
        document.documentElement.classList.add('ar-active');

        sceneEl.systems['mindar-image-system'].start();
        arActive = true;

        clearInterval(loadingInterval);
        if (fillEl) fillEl.style.width = '100%';
        if (pctEl) pctEl.textContent = '100%';

        setTimeout(() => {
          tampilkanLoading(false);
          startBtn.style.display = 'none';
          perbaruiStatus('AR Aktif', true);
          modelControlsDiv.classList.remove('hidden');

          const wadahTombolAtas = document.querySelector('#wadah-tombol-atas');
          if (wadahTombolAtas) wadahTombolAtas.classList.remove('hidden');

          const scannerGuide = document.querySelector('#scanner-guide');
          if (scannerGuide) {
            scannerGuide.classList.remove('hidden');
            const frame = scannerGuide.querySelector('.scanner-frame');
            if (frame) frame.classList.remove('locked');
            const text = scannerGuide.querySelector('.scanner-text');
            if (text) text.textContent = '[ MEMINDAI TARGET... ]';
          }
          putarSuara('success');
        }, 600);
      } catch (error) {
        clearInterval(loadingInterval);
        if (pctEl) pctEl.textContent = 'ERROR';
        console.error('Error memulai AR:', error);
        startBtn.disabled = false;
        setTimeout(() => { tampilkanLoading(false); }, 1000);
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

    const wadahTombolAtas = document.querySelector('#wadah-tombol-atas');
    if (wadahTombolAtas) wadahTombolAtas.classList.add('hidden');

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

  if (!suaraAktif) soundToggleBtn.classList.remove('active');
  soundToggleBtn.addEventListener('click', () => {
    suaraAktif = !suaraAktif;
    soundToggleBtn.classList.toggle('active');
    localStorage.setItem('wabAR_sound', suaraAktif);
    if (suaraAktif) putarSuara('success');
  });

  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', () => {
      document.querySelector('#modal-pengaturan').classList.remove('hidden');
      putarSuara('click');
    });
  }

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
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      model.setAttribute('animation__rot_model', `property: rotation; to: 0 ${modelRotation} 0; dur: 200; easing: linear`);
    });
  }

  function perbesarModel(factor) {
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      let currentScale = getScale(model, { x: 1, y: 1, z: 1 });
      model.setAttribute('animation__scale_model', `property: scale; to: ${currentScale.x * factor} ${currentScale.y * factor} ${currentScale.z * factor}; dur: 200; easing: easeOutQuad`);
    });
  }

  function aturUlangModel() {
    modelRotation = 0;
    const models = document.querySelectorAll('.bisa-diklik');
    models.forEach(model => {
      model.setAttribute('animation__rot_model', `property: rotation; to: 0 0 0; dur: 500; easing: easeOutQuad`);
      const baseScale = model.getAttribute('data-base-scale') || '2 2 2';
      model.setAttribute('animation__scale_model', `property: scale; to: ${baseScale}; dur: 500; easing: easeOutQuad`);
    });

    const brosurInner = document.querySelector('#brosur');
    if (brosurInner) {
      brosurInner.setAttribute('rotation', '0 0 0');
      brosurInner.removeAttribute('animation__rot');
      brosurInner.diputar = false;
    }
  }

  let hasSeenOnboarding = false;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    const currentTime = Date.now();
    if (currentTime - lastTouchTime < 300) {
      aturUlangModel();
      putarSuara('success');
    }
    lastTouchTime = currentTime;

    const onboardingGuide = document.querySelector('#onboarding-guide');
    if (onboardingGuide && !onboardingGuide.classList.contains('hidden')) {
      onboardingGuide.classList.add('hidden');
    }
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

  let currentPage = 0;
  const maxPages = 1;

  window.addEventListener('ar-page-change', (e) => {
    const dir = e.detail.dir;
    if (dir === 'next') currentPage = (currentPage + 1) > maxPages ? 0 : (currentPage + 1);
    if (dir === 'prev') currentPage = (currentPage - 1) < 0 ? maxPages : (currentPage - 1);

    updateARPage();
  });

  function updateARPage() {
    const img1 = document.querySelector('#halaman-aktif');
    const img2 = document.querySelector('#halaman-belakang-aktif');
    const info3D = document.querySelector('#halaman-info-3d');
    const brosurObj = document.querySelector('#brosur');

    if (!img1 || !info3D) return;

    if (brosurObj) {
      brosurObj.removeAttribute('animation__page_trans');
      brosurObj.setAttribute('animation__page_trans', 'property: scale; from: 0.2 0.2 0.2; to: 1 1 1; dur: 400; easing: easeOutBack');
    }

    if (currentPage === 0) {
      img1.setAttribute('visible', 'true');
      if (img2) img2.setAttribute('visible', 'true');
      info3D.setAttribute('visible', 'false');
    } else {
      img1.setAttribute('visible', 'false');
      if (img2) img2.setAttribute('visible', 'false');
      info3D.setAttribute('visible', 'true');
    }
  }

  const targetEntities = document.querySelectorAll('[mindar-image-target]');

  targetEntities.forEach((entity) => {
    entity.addEventListener('targetFound', () => {
      if (arActive) {
        if (scanTimeout) clearTimeout(scanTimeout);
        if (scanProblemBtn) scanProblemBtn.classList.add('hidden');

        perbaruiStatus('Marker Terdeteksi!', true);
        if (markerIndicator) markerIndicator.classList.remove('hidden');
        putarSuara('success');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) {
          const frame = scannerGuide.querySelector('.scanner-frame');
          const text = scannerGuide.querySelector('.scanner-text');

          if (frame) frame.classList.add('locked');
          if (text) text.textContent = '[ TARGET DIKUNCI ]';

          setTimeout(() => {
            scannerGuide.classList.add('hidden');
          }, 1500); // Wait 1.5s to show the locked HUD before hiding
        }

        const onboardingGuide = document.querySelector('#onboarding-guide');
        if (onboardingGuide && !hasSeenOnboarding) {
          onboardingGuide.classList.remove('hidden');
          setTimeout(() => {
            if (onboardingGuide) onboardingGuide.classList.add('hidden');
            hasSeenOnboarding = true;
          }, 3500);
        }

        const models = entity.querySelectorAll('.bisa-diklik');
        models.forEach(model => {
          model.setAttribute('visible', 'true');
          model.setAttribute('animation__spawn', 'property: scale; from: 0 0 0; to: 2 2 2; dur: 1200; easing: easeOutElastic');
        });
      }
    });

    entity.addEventListener('targetLost', () => {
      if (arActive) {
        perbaruiStatus('Mencari Marker...', false);
        if (markerIndicator) markerIndicator.classList.add('hidden');

        const scannerGuide = document.querySelector('#scanner-guide');
        if (scannerGuide) {
          scannerGuide.classList.remove('hidden');
          const frame = scannerGuide.querySelector('.scanner-frame');
          const text = scannerGuide.querySelector('.scanner-text');
          if (frame) frame.classList.remove('locked');
          if (text) text.textContent = '[ MEMINDAI TARGET... ]';
        }

        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanProblemBtn) scanProblemBtn.classList.remove('hidden');
        }, 5000);
      }
    });
  });

  setInterval(() => {
    if (rotasiOtomatisAktif && arActive) {
      modelRotation += (kecepatanAnimasi * 0.2);
      const models = document.querySelectorAll('.bisa-diklik');
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

  // Logika Kuis Interaktif Penjurusan (UTS Masterpiece)
  const tombolKuis = document.querySelector('#tombol-kuis');
  const modalKuis = document.querySelector('#modal-kuis');
  const screenStart = document.querySelector('#quiz-start');
  const screenQuestion = document.querySelector('#quiz-question');
  const screenResult = document.querySelector('#quiz-result');

  if (tombolKuis) {
    tombolKuis.addEventListener('click', () => {
      if (modalKuis) modalKuis.classList.remove('hidden');
      if (typeof putarSuara === 'function') putarSuara('click');
      resetQuiz();
    });
  }

  const kuisPertanyaan = [
    {
      tanya: "Apa yang paling seru dilakukan di waktu luangmu?",
      opsi: [
        { teks: "Bongkar/rakit PC dan coding ringan", poin: "komputer" },
        { teks: "Mengatur keuangan bulanan atau jualan", poin: "ekonomi" },
        { teks: "Memperbaiki barang yang rusak di rumah", poin: "teknik" },
        { teks: "Membaca buku agama atau ikut kajian", poin: "agama" }
      ]
    },
    {
      tanya: "Pelajaran apa yang paling membuatmu semangat saat sekolah?",
      opsi: [
        { teks: "Matematika & TIK", poin: "komputer" },
        { teks: "Ekonomi & Akuntansi", poin: "ekonomi" },
        { teks: "Fisika & Prakarya", poin: "teknik" },
        { teks: "Sejarah Islam & PAI", poin: "agama" }
      ]
    },
    {
      tanya: "Bagaimana cara kamu menyelesaikan masalah?",
      opsi: [
        { teks: "Mencari pola logika dan algoritma", poin: "komputer" },
        { teks: "Menghitung resiko untung-rugi", poin: "ekonomi" },
        { teks: "Membongkar masalah secara sistematis", poin: "teknik" },
        { teks: "Meminta petunjuk dan berdoa", poin: "agama" }
      ]
    }
  ];

  let poinFakultas = { komputer: 0, ekonomi: 0, teknik: 0, agama: 0 };
  let currentQ = 0;

  const btnMulaiKuis = document.querySelector('#btn-mulai-kuis');
  if(btnMulaiKuis) {
    btnMulaiKuis.addEventListener('click', () => {
      screenStart.classList.add('hidden');
      screenQuestion.classList.remove('hidden');
      renderPertanyaan();
      if (typeof putarSuara === 'function') putarSuara('click');
    });
  }

  const btnUlangiKuis = document.querySelector('#btn-ulangi-kuis');
  if(btnUlangiKuis) {
    btnUlangiKuis.addEventListener('click', () => {
      resetQuiz();
      screenResult.classList.add('hidden');
      screenQuestion.classList.remove('hidden');
      renderPertanyaan();
      if (typeof putarSuara === 'function') putarSuara('click');
    });
  }

  function resetQuiz() {
    poinFakultas = { komputer: 0, ekonomi: 0, teknik: 0, agama: 0 };
    currentQ = 0;
    if(screenStart) screenStart.classList.remove('hidden');
    if(screenQuestion) screenQuestion.classList.add('hidden');
    if(screenResult) screenResult.classList.add('hidden');
  }

  function renderPertanyaan() {
    const qData = kuisPertanyaan[currentQ];
    document.querySelector('#q-current').textContent = currentQ + 1;
    document.querySelector('#q-text').textContent = qData.tanya;
    
    const optionsDiv = document.querySelector('#q-options');
    optionsDiv.innerHTML = '';
    
    qData.opsi.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-quiz-option';
      btn.textContent = opt.teks;
      btn.onclick = () => {
        poinFakultas[opt.poin]++;
        if (typeof putarSuara === 'function') putarSuara('click');
        
        currentQ++;
        if (currentQ < kuisPertanyaan.length) {
          renderPertanyaan();
        } else {
          tampilkanHasil();
        }
      };
      optionsDiv.appendChild(btn);
    });
  }

  function tampilkanHasil() {
    screenQuestion.classList.add('hidden');
    screenResult.classList.remove('hidden');
    if (typeof putarSuara === 'function') putarSuara('success');

    let maxPoin = 0;
    let fakultasTerpilih = '';
    for (const [fakultas, poin] of Object.entries(poinFakultas)) {
      if (poin > maxPoin) {
        maxPoin = poin;
        fakultasTerpilih = fakultas;
      }
    }

    const resTitle = document.querySelector('#res-faculty');
    const resDesc = document.querySelector('#res-desc');

    if (fakultasTerpilih === 'komputer') {
      resTitle.textContent = 'Fakultas Komputer 💻';
      resDesc.textContent = 'Kamu punya pola pikir logis yang tajam. Sangat cocok menjadi Programmer, Data Scientist, atau Ahli Cyber Security!';
    } else if (fakultasTerpilih === 'ekonomi') {
      resTitle.textContent = 'Fakultas Ekonomi 📈';
      resDesc.textContent = 'Insting bisnismu luar biasa. Cocok menjadi Pengusaha sukses, Manajer, atau Akuntan profesional.';
    } else if (fakultasTerpilih === 'teknik') {
      resTitle.textContent = 'Fakultas Teknik ⚙️';
      resDesc.textContent = 'Kamu suka memecahkan masalah kompleks secara teknis. Sangat tepat untuk menjadi Insinyur handal di masa depan!';
    } else {
      resTitle.textContent = 'Fakultas Agama Islam 🕌';
      resDesc.textContent = 'Kamu memiliki nilai spiritualitas dan kepedulian tinggi. Sangat mulia jika mendalami ilmu dakwah dan agama Islam.';
    }
  }

});