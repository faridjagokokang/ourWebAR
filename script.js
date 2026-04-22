// STATE
let isARRunning = false, isDarkMode = false, modelScale = 0.8;

// LOADING
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => document.getElementById('loadingScreen').remove(), 500);
    }, 1500);
});

// START AR (FIX KAMERA!)
document.getElementById('startAR').onclick = () => {
    const startScreen = document.getElementById('startScreen');
    const arScene = document.getElementById('arScene');
    
    startScreen.style.opacity = '0';
    setTimeout(() => {
        startScreen.style.display = 'none';
        arScene.classList.remove('hidden');
        document.getElementById('wadah-tombol').classList.remove('hidden');
        document.getElementById('wadah-kontrol').classList.remove('hidden');
        document.getElementById('fpsCounter').classList.remove('hidden');
        document.getElementById('infoToggleBtn').classList.remove('hidden');
        isARRunning = true;
    }, 500);
    
    // FORCE CAMERA START
    setTimeout(() => location.reload(), 1000);
};

// STOP AR
document.getElementById('tombol-henti').onclick = () => {
    location.reload();
};

// FPS COUNTER
let lastTime = 0, frameCount = 0;
function updateFPS(time) {
    frameCount++;
    if (time - lastTime >= 1000) {
        document.getElementById('fpsValue').textContent = `FPS: ${Math.round(frameCount * 1000 / (time - lastTime))}`;
        frameCount = 0; lastTime = time;
    }
    requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);

// INTERAKSI 3D
AFRAME.registerComponent('interaksi-klik', {
    init: function () {
        const el = this.el;
        el.addEventListener('click', () => {
            const scale = el.getAttribute('scale');
            el.setAttribute('scale', `${scale.x * 1.3} ${scale.y * 1.3} ${scale.z * 1.3}`);
            setTimeout(() => el.setAttribute('scale', scale), 250);
            
            // PMB DATA
            const pmb = [
                {title: "🖥️ Teknik Informatika", info: "AI & Game Dev Lab", biaya: "Rp 15.000.000"},
                {title: "🏗️ Teknik Sipil", info: "Proyek BUMN", biaya: "Rp 12.000.000"},
                {title: "💊 Farmasi", info: "Lab BPOM Certified", biaya: "Rp 18.000.000"}
            ][Math.floor(Math.random() * 3)];
            
            document.getElementById('statsPanel').innerHTML = `
                <div style="text-align:center">
                    <h3 style="color:#00ff88;margin-bottom:10px">${pmb.title}</h3>
                    <p>${pmb.info}</p>
                    <p style="font-size:1.1em;font-weight:bold;color:#ffaa00">${pmb.biaya}/tahun</p>
                    <button onclick="window.open('https://pmb.kampus.com')" 
                            style="background:linear-gradient(45deg,#00ff88,#00cc6a);color:black;padding:12px 24px;border:none;border-radius:25px;font-weight:bold;margin-top:15px;width:100%;cursor:pointer;box-shadow:0 5px 20px rgba(0,255,136,0.4)">
                        📝 DAFTAR SEKARANG
                    </button>
                </div>
            `;
            document.getElementById('infoToggleBtn').click();
        });
    }
});

// BUTTON CONTROLS
document.getElementById('tombol-layar-penuh').onclick = () => document.documentElement.requestFullscreen?.() || alert('Fullscreen tidak tersedia');
document.getElementById('tombol-info').onclick = () => document.getElementById('infoToggleBtn').click();
document.getElementById('tombol-suara').onclick = () => document.getElementById('tombol-suara').classList.toggle('active');
document.getElementById('tombol-screenshot').onclick = () => html2canvas(document.getElementById('arScene')).then(c => {
    const a = document.createElement('a'); a.download = `PMB-AR-${Date.now()}.png`; a.href = c.toDataURL(); a.click();
});
document.getElementById('tombol-tema').onclick = () => {
    document.body.classList.toggle('dark-mode');
    isDarkMode = !isDarkMode;
};

document.getElementById('infoToggleBtn').onclick = () => {
    const panel = document.getElementById('statsPanel');
    const fps = document.getElementById('fpsCounter');
    const btn = document.getElementById('infoToggleBtn');
    
    if (fps.classList.contains('show')) {
        fps.classList.remove('show');
        panel.classList.add('hidden');
        btn.classList.remove('active');
    } else {
        fps.classList.add('show');
        panel.classList.remove('hidden');
        btn.classList.add('active');
        panel.innerHTML = `
            <h3 style="color:#00ff88">👥 Kelompok Pembuat</h3>
            <div style="text-align:center;font-size:0.95em">
                <p>1. Muhammad Farid Donovant<br><small>24EO10021</small></p>
                <p>2. Dhiane Isya Naa'imah<br><small>24EO10001</small></p>
                <p>3. Jafar Khotob Al Fadil<br><small>24EO10015</small></p>
            </div>
        `;
    }
};

console.log('🚀 PMB AR Premium Ready!');