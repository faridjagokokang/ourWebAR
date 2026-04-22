// ========================================
// PMB AR MOBILE - FULL SCRIPT
// ========================================

// MOBILE DETECTION & INIT
if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    document.body.innerHTML = `
        <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:white;font-family:system-ui;font-size:1.5rem;text-align:center;padding:2rem">
            <div>
                <h1>📱 AR Hanya untuk HP!</h1>
                <p>Buka di Chrome/Safari mobile</p>
            </div>
        </div>
    `;
    throw new Error('Desktop not supported');
}

// STATE
let isDarkMode = false, modelScale = 0.6, isSoundOn = true;

// SPLASH SCREEN
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('splashText').textContent = 'Memuat kamera...';
    
    setTimeout(() => {
        document.getElementById('splash').style.transition = 'opacity 0.4s';
        document.getElementById('splash').style.opacity = '0';
        
        setTimeout(() => {
            document.getElementById('splash').remove();
            startAR();
        }, 400);
    }, 800);
});

function startAR() {
    const arScene = document.getElementById('arScene');
    
    // SHOW UI
    document.getElementById('topControls').style.opacity = '1';
    document.getElementById('bottomControls').style.opacity = '1';
    
    // START CAMERA
    if (arScene.components.arjs) {
        arScene.components.arjs.start();
    }
    
    // FPS LOOP
    setInterval(() => {
        const fps = Math.round(1000 / (performance.now() % 1000));
        document.getElementById('fpsCounter').textContent = `${fps} FPS`;
    }, 500);
    
    console.log('🚀 AR Started - Mobile Ready!');
}

// ========================================
// 3D INTERACTION
// ========================================
AFRAME.registerComponent('interaksi-klik', {
    init: function() {
        const el = this.el;
        
        // TAP EFFECT
        el.addEventListener('click', () => {
            const currentScale = el.getAttribute('scale');
            el.setAttribute('scale', {
                x: currentScale.x * 1.25,
                y: currentScale.y * 1.25, 
                z: currentScale.z * 1.25
            });
            
            setTimeout(() => {
                el.setAttribute('scale', currentScale);
            }, 200);
            
            // SHOW PMB INFO
            showPMBInfo();
        });
        
        // HOVER EFFECT
        el.addEventListener('mouseenter', () => {
            el.object3D.scale.multiplyScalar(1.05);
        });
        el.addEventListener('mouseleave', () => {
            el.object3D.scale.multiplyScalar(0.952); // 1/1.05
        });
    }
});

// ========================================
// PMB INFO SYSTEM
// ========================================
const jurusanData = [
    {
        nama: "🖥️ Teknik Informatika",
        info: "AI, Game Development, Web3",
        biaya: "Rp 15.000.000",
        link: "pmb.ti.kampus.ac.id"
    },
    {
        nama: "🏗️ Teknik Sipil", 
        info: "Proyek BUMN, BIM Technology",
        biaya: "Rp 12.000.000",
        link: "pmb.sipil.kampus.ac.id"
    },
    {
        nama: "💊 Farmasi",
        info: "Lab BPOM, Industri Farmasi",
        biaya: "Rp 18.000.000", 
        link: "pmb.farmasi.kampus.ac.id"
    }
];

function showPMBInfo() {
    const randomJurusan = jurusanData[Math.floor(Math.random() * jurusanData.length)];
    const content = document.getElementById('infoContent');
    
    content.innerHTML = `
        <h3 style="color:#00ff88;margin:0 0 12px 0;font-size:1.3em">${randomJurusan.nama}</h3>
        <p style="margin:8px 0;font-size:0.95em;opacity:0.9">${randomJurusan.info}</p>
        <p style="font-weight:bold;color:#ffdd44;font-size:1.1em;margin:10px 0 15px 0">
            💰 ${randomJurusan.biaya}/tahun
        </p>
        <button onclick="daftarPMB('${randomJurusan.link}')" 
                style="width:100%;padding:14px 20px;background:linear-gradient(45deg,#00ff88,#00cc6a);color:black;border:none;border-radius:25px;font-weight:700;font-size:1rem;box-shadow:0 6px 25px rgba(0,255,136,0.4);cursor:pointer;transition:all 0.2s">
            📝 DAFTAR SEKARANG
        </button>
    `;
    
    document.getElementById('infoPanel').style.display = 'block';
}

function daftarPMB(link) {
    window.open(`https://${link}`, '_blank');
    if (isSoundOn) playClickSound();
}

// ========================================
// BUTTON CONTROLS
// ========================================
document.getElementById('infoBtn').onclick = () => {
    document.getElementById('infoPanel').style.display = 'block';
};

document.getElementById('closeInfo').onclick = () => {
    document.getElementById('infoPanel').style.display = 'none';
};

document.getElementById('fullscreen').onclick = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen().catch(() => {});
    }
};

document.getElementById('screenshot').onclick = async () => {
    try {
        const canvas = await html2canvas(document.getElementById('arScene'), {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });
        
        const link = document.createElement('a');
        link.download = `PMB-AR-${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        alert('Screenshot gagal - coba lagi');
    }
};

document.getElementById('sound').onclick = () => {
    isSoundOn = !isSoundOn;
    document.getElementById('sound').classList.toggle('active', isSoundOn);
};

// STOP AR
document.getElementById('stopAR').onclick = () => {
    if (confirm('Stop AR dan reload?')) {
        location.reload();
    }
};

// ========================================
// INFO DEFAULT (KELOMPOK)
document.getElementById('infoContent').innerHTML = `
    <h3 style="color:#00ff88">👥 Kelompok Pembuat</h3>
    <div style="font-size:0.95em;line-height:1.4">
        <p><strong>1. Muhammad Farid Donovant</strong><br><small>24EO10021</small></p>
        <p><strong>2. Dhiane Isya Naa'imah</strong><br><small>24EO10001</small></p>
        <p><strong>3. Jafar Khotob Al Fadil</strong><br><small>24EO10015</small></p>
    </div>
`;

// SOUND EFFECTS (OPTIONAL)
function playClickSound() {
    if (isSoundOn) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...'); // base64 click sound
        audio.volume = 0.3; audio.play().catch(() => {});
    }
}

// PERF PERF
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

console.log('✅ PMB AR Mobile - FULLY LOADED');