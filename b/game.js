//      ::::::::::: ::::::::   ::::::::    :::   :::   :::::::::: ::::::::::: :::::::::  ::::::::::: ::::::::          ::::::::::: ::::::::  :::            :::     ::::    ::: :::::::::         ::::::::::: :::::::: 
//         :┼:    :┼:    :┼: :┼:    :┼:  :┼:┼: :┼:┼:  :┼:            :┼:     :┼:    :┼:     :┼:    :┼:    :┼:             :┼:    :┼:    :┼: :┼:          :┼: :┼:   :┼:┼:   :┼: :┼:    :┼:            :┼:    :┼:    :┼: 
//        ┼:┼    ┼:┼        ┼:┼    ┼:┼ ┼:┼ ┼:┼:┼ ┼:┼ ┼:┼            ┼:┼     ┼:┼    ┼:┼     ┼:┼    ┼:┼                    ┼:┼    ┼:┼        ┼:┼         ┼:┼   ┼:┼  :┼:┼:┼  ┼:┼ ┼:┼    ┼:┼            ┼:┼    ┼:┼         
//       ┼#┼    ┼#┼┼:┼┼#┼┼ ┼#┼    ┼:┼ ┼#┼  ┼:┼  ┼#┼ ┼#┼┼:┼┼#       ┼#┼     ┼#┼┼:┼┼#:      ┼#┼    ┼#┼                    ┼#┼    ┼#┼┼:┼┼#┼┼ ┼#┼        ┼#┼┼:┼┼#┼┼: ┼#┼ ┼:┼ ┼#┼ ┼#┼    ┼:┼            ┼#┼    ┼#┼┼:┼┼#┼┼   
//      ┼#┼           ┼#┼ ┼#┼    ┼#┼ ┼#┼       ┼#┼ ┼#┼            ┼#┼     ┼#┼    ┼#┼     ┼#┼    ┼#┼                    ┼#┼           ┼#┼ ┼#┼        ┼#┼     ┼#┼ ┼#┼  ┼#┼#┼# ┼#┼    ┼#┼            ┼#┼           ┼#┼    
//     #┼#    #┼#    #┼# #┼#    #┼# #┼#       #┼# #┼#            #┼#     #┼#    #┼#     #┼#    #┼#    #┼#             #┼#    #┼#    #┼# #┼#        #┼#     #┼# #┼#   #┼#┼# #┼#    #┼#        #┼# #┼#    #┼#    #┼#     
//########### ########   ########  ###       ### ##########     ###     ###    ### ########### ########          ########### ########  ########## ###     ### ###    #### #########          #####      ########       



if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(() => { });
    });
}

function setBrowserZoom(ratio) {
    const isFirefox = CSS.supports('-moz-appearance', 'none');
    const supportsZoom = CSS.supports('zoom', String(ratio));

    if (!isFirefox || supportsZoom) {
        document.documentElement.style.zoom = ratio;
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.left = '';
        document.body.style.top = '';
    } else {
        document.documentElement.style.zoom = '';
        document.body.style.transform = `scale(${ratio})`;
        document.body.style.transformOrigin = '50% 50%';
        document.body.style.position = 'fixed';
        document.body.style.width = (100 / ratio) + 'vw';
        document.body.style.height = (100 / ratio) + 'vh';
        document.body.style.left = '50%';
        document.body.style.top = '50%';
        document.body.style.marginLeft = (-50 / ratio) + 'vw';
        document.body.style.marginTop = (-50 / ratio) + 'vh';
    }
}

const TILE_W = 24; 
const TILE_H = 12; 
let selectedBlockType = 'eraser';
let treeCounter = 0; 
let terraformHeight = 1;
let currentZoomPercent = 0.43; 
let zoomInterval = null;
let isFloating = false;
let currentPage = 1;
let panX = 0, panY = 0;
let isPanning = false;
let startPanX = 0, startPanY = 0;
let isDrawing = false;
let slideToPlace = false; 
let lastSelectedSlotP1 = null;
let lastSelectedSlotP2 = null;
let historyStack = [];
let redoStack = [];
const MAX_HISTORY = 40;

const splashes = ["amazing!", "wooooow!", "relaxing", "pixel art!", "isometric!", "build it!", "Adrian"];
const splashEl = document.getElementById('splash-text');
splashEl.innerText = splashes[Math.floor(Math.random() * splashes.length)];

const nameDisplay = document.getElementById('block-name-display');
function showName(name) { nameDisplay.innerText = name; nameDisplay.style.opacity = "1"; }
function hideName() { nameDisplay.style.opacity = "0"; }

const hotbarSound = new Audio('./Assets/Audio/hotbar.wav');

let _placeSound, _grassSound, _pclsSound, _bgMusic, _eraserSound;
function getPlaceSound()  { if (!_placeSound)  { _placeSound  = new Audio('./Assets/Audio/place.wav');  } return _placeSound; }
function getGrassSound()  { if (!_grassSound)  { _grassSound  = new Audio('./Assets/Audio/grass.wav');  } return _grassSound; }
function getPclsSound()   { if (!_pclsSound)   { _pclsSound   = new Audio('./Assets/Audio/pcls.wav');   } return _pclsSound; }
function getEraserSound() { if (!_eraserSound) { _eraserSound = new Audio('./Assets/Audio/eraser.wav'); } return _eraserSound; }
function getBgMusic()     {
    if (!_bgMusic) { _bgMusic = new Audio('./Assets/Audio/BG.wav'); _bgMusic.loop = true; }
    return _bgMusic;
}
const placeSound  = { get currentTime() { return getPlaceSound().currentTime;  }, set currentTime(v) { getPlaceSound().currentTime  = v; }, play() { return getPlaceSound().play();  } };
const grassSound  = { get currentTime() { return getGrassSound().currentTime;  }, set currentTime(v) { getGrassSound().currentTime  = v; }, play() { return getGrassSound().play();  } };
const pclsSound   = { get currentTime() { return getPclsSound().currentTime;   }, set currentTime(v) { getPclsSound().currentTime   = v; }, play() { return getPclsSound().play();   } };
const eraserSound = { get currentTime() { return getEraserSound().currentTime; }, set currentTime(v) { getEraserSound().currentTime = v; }, play() { return getEraserSound().play(); } };
const bgMusic    = { get loop()        { return getBgMusic().loop; },           set loop(v)        { getBgMusic().loop = v; },
                     get src()         { return getBgMusic().src; },
                     play()  { return getBgMusic().play();  },
                     pause() { return getBgMusic().pause(); } };
let isMusicPlaying = true;

const mapContainer = document.getElementById("map");
const map = document.getElementById('map');
const highlight = document.getElementById("selection-highlight");
const zoomTrack = document.getElementById('zoom-track');
const zoomDot = document.getElementById('zoom-dot');
const musicBtn = document.getElementById('music-toggle');
const floatBtn = document.getElementById('float-toggle');
const minimapCanvas = document.getElementById('minimap');
const mCtx = minimapCanvas.getContext('2d');

window.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    if (e.ctrlKey && key === 'z') { e.preventDefault(); undo(); }
    else if (e.ctrlKey && key === 'y') { e.preventDefault(); redo(); }
    else if (key === 's') { e.preventDefault(); toggleBlockSearch(); }
    else if (key === 'g') {
        const sw = document.getElementById('sw-grid');
        if (sw) { toggleVisualOption('gridOverlay', sw); hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {}); }
    }
    else if (key === 'e') {
        if (currentPage !== 1) switchPage(1);
        const eraserSlot = document.getElementById('slot-eraser');
        selectBlock('eraser', eraserSlot);
    } 
    else if (key === 'p') { switchPage(currentPage === 1 ? 2 : 1); } 
    else if (key === 'm') { openMusicPopup(); } 
    else if (key === 'f') { toggleFloat(); }
});

function playMusic() { bgMusic.play().catch(e => {}); }
window.addEventListener('mousedown', () => { if (isMusicPlaying) playMusic(); }, { once: true });

let currentGUITheme = 'default';
let guiThemeOverride = 'auto'; 

function getGUIFolder(mode) {
    if (mode === 'rain' || mode === 'snow') return './Assets/GUI/blue/';
    if (mode === 'wind') return './Assets/GUI/green/';
    return './Assets/GUI/';
}

function openGUISettings() {
    const overlay = document.getElementById('gui-settings-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    _refreshGUICards();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeGUISettings() {
    const overlay = document.getElementById('gui-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function setGUIThemeManual(choice) {
    guiThemeOverride = choice;
    _refreshGUICards();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    if (choice === 'auto') {
        applyGUITheme(typeof currentClimate !== 'undefined' ? currentClimate : 'off');
    } else {
        const modeMap = { default: 'off', blue: 'rain', green: 'wind' };
        applyGUITheme(modeMap[choice]);
    }
}
function _refreshGUICards() {
    ['auto','default','blue','green'].forEach(id => {
        const card = document.getElementById('gui-card-' + id);
        if (card) card.classList.toggle('selected', guiThemeOverride === id);
    });
}

function applyGUITheme(climateMode) {
    if (guiThemeOverride !== 'auto') {
        const modeMap = { default: 'off', blue: 'rain', green: 'wind' };
        climateMode = modeMap[guiThemeOverride] || 'off';
    }
    document.body.classList.remove('gui-theme-blue', 'gui-theme-green');
    if (climateMode === 'rain' || climateMode === 'snow') document.body.classList.add('gui-theme-blue');
    else if (climateMode === 'wind') document.body.classList.add('gui-theme-green');
    const folder = getGUIFolder(climateMode);

    const dock = document.getElementById('dock');
    if (dock) dock.style.backgroundImage = `url('${folder}hotbar.png')`;

    const sel = document.getElementById('selection-highlight');
    if (sel) sel.style.backgroundImage = `url('${folder}selector.png')`;
    const ztrack = document.getElementById('zoom-track');
    if (ztrack) ztrack.style.backgroundImage = `url('${folder}zoombar.png')`;
    const zdot = document.getElementById('zoom-dot');
    if (zdot) zdot.style.backgroundImage = `url('${folder}zoomdot.png')`;
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomIn  = document.getElementById('btn-zoom-in');
    if (zoomOut) zoomOut.src = folder + 'zoom-.png';
    if (zoomIn)  zoomIn.src  = folder + 'zoom+.png';
    const saveBtn = document.getElementById('save-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    if (saveBtn) saveBtn.src = folder + 'save.png';
    if (undoBtn) undoBtn.src = folder + 'undo.png';
    if (redoBtn) redoBtn.src = folder + 'redo.png';
    musicBtn.src = folder + (isMusicPlaying ? 'bgoff.png' : 'bgon.png');
    floatBtn.src = folder + (isFloating ? 'floaton.png' : 'floatoff.png');

    currentGUITheme = climateMode;
}

function toggleMusic() {
    isMusicPlaying = !isMusicPlaying;
    const folder = getGUIFolder(currentGUITheme);
    musicBtn.src = isMusicPlaying ? folder + 'bgoff.png' : folder + 'bgon.png';
    if (isMusicPlaying) bgMusic.play(); else bgMusic.pause();
    _syncMusicPopupSwitch();
}

function openMusicPopup() {
    const overlay = document.getElementById('music-popup-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    _syncMusicPopupSwitch();
}

function closeMusicPopup() {
    const overlay = document.getElementById('music-popup-overlay');
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function toggleBgMusicFromPopup() {
    isMusicPlaying = !isMusicPlaying;
    const folder = getGUIFolder(currentGUITheme);
    musicBtn.src = isMusicPlaying ? folder + 'bgoff.png' : folder + 'bgon.png';
    if (isMusicPlaying) bgMusic.play(); else bgMusic.pause();
    _syncMusicPopupSwitch();
}

function _syncMusicPopupSwitch() {
    const sw = document.getElementById('bg-music-px-switch');
    if (!sw) return;
    sw.classList.toggle('on', isMusicPlaying);
}

function toggleFloat() {
    isFloating = !isFloating;
    map.classList.toggle('floating-island', isFloating);
    const folder = getGUIFolder(currentGUITheme);
    floatBtn.src = isFloating ? folder + 'floaton.png' : folder + 'floatoff.png';
    applyZoom();
}

let shadowsEnabled = true;
let leavesEnabled = true;
let cloudsEnabled = false;
let cloudInterval = null;
let fpsCounterEnabled = false;
let fpsAnimFrame = null;
let fpsLastTime = performance.now();
let fpsFrameCount = 0;
let fpsValue = 0;
let gridOverlayEnabled = false;

(function loadVisualOptions() {
    const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
    if (saved.shadows === false) shadowsEnabled = false;
    if (saved.leaves === false) leavesEnabled = false;
    if (saved.clouds === true) cloudsEnabled = true;
    if (saved.slideToPlace === true) slideToPlace = true;

   
    if (saved.scale) {
        setBrowserZoom(saved.scale / 100);
    }

    requestAnimationFrame(() => {
        if (!shadowsEnabled) {
            const el = document.createElement('style');
            el.id = 'shadow-override';
            el.textContent = '.tile { filter: none !important; } .tile:hover { filter: brightness(1.2) !important; }';
            document.head.appendChild(el);
            const sw = document.getElementById('sw-shadows');
            if (sw) sw.classList.remove('on');
        }
        if (!leavesEnabled) {
            const sw = document.getElementById('sw-leaves');
            if (sw) sw.classList.remove('on');
        }
        if (cloudsEnabled) {
            const sw = document.getElementById('sw-clouds');
            if (sw) sw.classList.add('on');
            startClouds();
        }
        if (slideToPlace) {
            const sw = document.getElementById('sw-slide-place');
            if (sw) sw.classList.add('on');
        }
        if (saved.fpsCounter === true) {
            fpsCounterEnabled = true;
            const sw = document.getElementById('sw-fps');
            if (sw) sw.classList.add('on');
            startFpsCounter();
        }
        if (saved.gridOverlay === true) {
            gridOverlayEnabled = true;
            const sw = document.getElementById('sw-grid');
            if (sw) sw.classList.add('on');
            applyGridOverlay(true);
        }
        const saved2 = JSON.parse(localStorage.getItem('visualOptions') || '{}');
        const scale = saved2.scale || Math.round(window.devicePixelRatio * 100);
        const clamped = Math.max(30, Math.min(150, Math.round(scale / 10) * 10));
        const wl = document.getElementById('welcome-zoom-value');
        const sl = document.getElementById('settings-zoom-value');
        if (wl) wl.textContent = clamped + '%';
        if (sl) sl.textContent = clamped + '%';
    });
})();

function toggleFullscreen(btn) {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            btn.classList.add('on');
        }).catch(() => {});
    } else {
        document.exitFullscreen().then(() => {
            btn.classList.remove('on');
        }).catch(() => {});
    }
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('sw-fullscreen');
    if (!btn) return;
    if (document.fullscreenElement) btn.classList.add('on');
    else btn.classList.remove('on');
});

function toggleVisualOption(option, btn) {
    btn.classList.toggle('on');
    const isOn = btn.classList.contains('on');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    if (option === 'shadows') {
        shadowsEnabled = isOn;
        document.querySelectorAll('.tile').forEach(t => {
            t.style.filter = shadowsEnabled ? '' : 'none';
        });
        const styleId = 'shadow-override';
        let el = document.getElementById(styleId);
        if (!el) { el = document.createElement('style'); el.id = styleId; document.head.appendChild(el); }
        el.textContent = shadowsEnabled ? '' : '.tile { filter: none !important; } .tile:hover { filter: brightness(1.2) !important; }';
    } else if (option === 'leaves') {
        leavesEnabled = isOn;
    } else if (option === 'clouds') {
        cloudsEnabled = isOn;
        if (cloudsEnabled) startClouds(); else stopClouds();
    } else if (option === 'slideToPlace') {
        slideToPlace = isOn;
    } else if (option === 'fpsCounter') {
        fpsCounterEnabled = isOn;
        if (fpsCounterEnabled) startFpsCounter(); else stopFpsCounter();
    } else if (option === 'gridOverlay') {
        gridOverlayEnabled = isOn;
        applyGridOverlay(isOn);
    }

    const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
    saved[option] = isOn;
    localStorage.setItem('visualOptions', JSON.stringify(saved));
}

function stepZoom(context, delta) {
    const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
    const cur = saved.scale || Math.round(window.devicePixelRatio * 100);
    const val = Math.max(30, Math.min(150, Math.round(cur / 10) * 10 + delta));
    setBrowserZoom(val / 100);
    saved.scale = val;
    localStorage.setItem('visualOptions', JSON.stringify(saved));
    const wl = document.getElementById('welcome-zoom-value');
    const sl = document.getElementById('settings-zoom-value');
    if (wl) wl.textContent = val + '%';
    if (sl) sl.textContent = val + '%';
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function spawnCloud(startX = -200) {
    const cloud = document.createElement('div');
    cloud.className = 'pixel-cloud';
    const size = (Math.floor(Math.random() * 3) + 2) * 8;
    cloud.style.cssText = `width:${size * 3}px;height:${size}px;top:${Math.random() * 40 + 5}%;left:${startX}px;z-index:2;`;
    document.body.appendChild(cloud);
    let posX = startX;
    const speed = 0.3 + Math.random() * 0.4;
    function moveCloud() {
        if (!cloudsEnabled) { cloud.remove(); return; }
        posX += speed;
        cloud.style.left = posX + 'px';
        if (posX > window.innerWidth + 200) { cloud.remove(); return; }
        requestAnimationFrame(moveCloud);
    }
    requestAnimationFrame(moveCloud);
}
function startClouds() {

    const initialCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < initialCount; i++) {
        spawnCloud(Math.random() * window.innerWidth);
    }
    cloudInterval = setInterval(() => { if (cloudsEnabled) spawnCloud(); }, 4000 + Math.random() * 3000);
}
function stopClouds() {
    if (cloudInterval) { clearInterval(cloudInterval); cloudInterval = null; }
    document.querySelectorAll('.pixel-cloud').forEach(c => c.remove());
}

function startFpsCounter() {
    if (fpsAnimFrame) return;
    let el = document.getElementById('fps-counter');
    if (!el) {
        el = document.createElement('div');
        el.id = 'fps-counter';
        el.style.cssText = [
            'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
            'background:rgba(0,0,0,0.55)', 'color:#a8ff78',
            'font-family:"Press Start 2P",cursive', 'font-size:8px',
            'padding:4px 10px', 'border-radius:0',
            'image-rendering:pixelated', 'z-index:9999',
            'pointer-events:none', 'letter-spacing:1px',
            'border:1px solid #2a5a1a'
        ].join(';');
        document.body.appendChild(el);
    }
    el.style.display = 'block';
    fpsLastTime = performance.now();
    fpsFrameCount = 0;
    function tick(now) {
        if (!fpsCounterEnabled) return;
        fpsFrameCount++;
        const delta = now - fpsLastTime;
        if (delta >= 500) {
            fpsValue = Math.round((fpsFrameCount / delta) * 1000);
            fpsFrameCount = 0;
            fpsLastTime = now;
            const counter = document.getElementById('fps-counter');
            if (counter) counter.textContent = fpsValue + ' FPS';
        }
        fpsAnimFrame = requestAnimationFrame(tick);
    }
    fpsAnimFrame = requestAnimationFrame(tick);
}

function stopFpsCounter() {
    if (fpsAnimFrame) { cancelAnimationFrame(fpsAnimFrame); fpsAnimFrame = null; }
    const el = document.getElementById('fps-counter');
    if (el) el.style.display = 'none';
}

function drawDiamondCanvas(canvasId, tiles, strokeStyle) {
    let canvas = document.getElementById(canvasId);
    if (tiles.length === 0) {
        if (canvas) canvas.remove();
        return;
    }
    const mapW = mapContainer.offsetWidth || 400;
    const mapH = mapContainer.offsetHeight || 400;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        mapContainer.appendChild(canvas);
    }
    canvas.width = mapW + 200;
    canvas.height = mapH + 200;
    canvas.style.left = '-100px';
    canvas.style.top = '-100px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.5;
    const W = TILE_W, H = TILE_H;
    tiles.forEach(t => {
        const left = parseFloat(t.getAttribute('data-pos-left'));
        const top  = parseFloat(t.getAttribute('data-pos-top'));
        const cx = left + W / 2 + 100;
        const cy = top  + H / 2 + 100;
        ctx.beginPath();
        ctx.moveTo(cx,       cy - H / 2);
        ctx.lineTo(cx + W/2, cy);
        ctx.lineTo(cx,       cy + H / 2);
        ctx.lineTo(cx - W/2, cy);
        ctx.closePath();
        ctx.stroke();
    });
}

function applyGridOverlay(on) {
    map.classList.toggle('grid-overlay-active', on);
    if (!on) {
        const canvas = document.getElementById('grid-canvas');
        if (canvas) canvas.remove();
        return;
    }
    const tiles = [];
    mapContainer.querySelectorAll('.tile').forEach(t => {
        if (parseInt(t.getAttribute('data-z')) === 0 && t.style.opacity !== '0') tiles.push(t);
    });
    drawDiamondCanvas('grid-canvas', tiles, 'rgba(255,255,255,0.9)');
}

function drawSelectionCanvas() {
    const tiles = Array.from(selectedTiles);
    if (tiles.length === 0) {
        const canvas = document.getElementById('selection-canvas');
        if (canvas) canvas.remove();
        return;
    }
    drawDiamondCanvas('selection-canvas', tiles, 'rgba(230,160,60,0.95)');
}

function switchPage(pageNum) {
    currentPage = pageNum;
    const p1 = document.querySelectorAll('.page-1');
    const p2 = document.querySelectorAll('.page-2');
    if (pageNum === 2) {
        p1.forEach(el => el.style.display = 'none');
        p2.forEach(el => el.style.display = 'flex');
        if(lastSelectedSlotP2) selectBlock(lastSelectedSlotP2.dataset.type, lastSelectedSlotP2, true);
        else highlight.style.opacity = "0";
    } else {
        p1.forEach(el => el.style.display = 'flex');
        p2.forEach(el => el.style.display = 'none');
        if(lastSelectedSlotP1) selectBlock(lastSelectedSlotP1.dataset.type, lastSelectedSlotP1, true);
    }
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function selectBlock(type, el, skipSound = false) {
    if (!el || el.id === 'btn-next-page' || el.id === 'btn-prev-page') return;
    selectedBlockType = type;
    el.dataset.type = type;
    if(currentPage === 1) lastSelectedSlotP1 = el; else lastSelectedSlotP2 = el;
    highlight.style.left = el.offsetLeft + "px";
    highlight.style.top = el.offsetTop + "px";
    highlight.style.opacity = "1";
    const img = el.querySelector('img');
    window._selectedBlockSrc = (img && type !== 'eraser') ? img.getAttribute('src') : '';
    if (!skipSound) { hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {}); }
}

const _imgCache = new Map();

function getCachedImage(src) {
    if (_imgCache.has(src)) return _imgCache.get(src);
    const img = new Image();
    img.src = src;
    _imgCache.set(src, img);
    return img;
}


function createTile(x, y, z, type, customPath = null, parent = mapContainer) {
    const img = document.createElement("img");
    img.src = customPath ? customPath : `./Assets/Blocks/${type}.png`;
    img.className = "tile";
    img.setAttribute('data-x', x);
    img.setAttribute('data-y', y);
    img.setAttribute('data-z', z);
    img.setAttribute('data-color', getBlockColor(type, customPath));
    const posLeft = (x - y) * (TILE_W / 2);
    const posTop  = (x + y) * (TILE_H / 2) - (z * TILE_H);
    img.style.left = posLeft + "px";
    img.style.top  = posTop + "px";
    img.setAttribute('data-pos-left', posLeft);
    img.setAttribute('data-pos-top', posTop);
    img.style.zIndex = (x + y) + z;
    img.onmousedown = (e) => { 
        if (e.button === 1 || e.button === 2) return; 
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            let target = img;
            if (parseInt(img.getAttribute('data-z')) !== 0) {
                const tfId = img.getAttribute('data-terraform-group');
                if (tfId) {
                    const source = mapContainer.querySelector(`.tile[data-terraform-group="${tfId}"][data-z="0"]`);
                    if (source && source.style.opacity !== '0') target = source;
                    else return;
                } else return;
            }
            if (target.style.opacity === '0') return;
            if (selectedTiles.has(target)) {
                selectedTiles.delete(target);
                target.classList.remove('selected-tile');
            } else {
                selectedTiles.add(target);
                target.classList.add('selected-tile');
            }
            drawSelectionCanvas();
            updateFillButton();
            return;
        }
        isDrawing = true;
        handleInteraction(img, x, y, z);
        if (!slideToPlace) { isDrawing = false; saveState(); updateMinimap(); }
    };
    img.addEventListener('mouseenter', (e) => {
        if (!isDrawing) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!slideToPlace) return;
        handleInteraction(img, x, y, z);
    });

    let _touchTimer = null;
    let _touchMoved = false;
    let _touchStartX = 0;
    let _touchStartY = 0;

    img.addEventListener('touchstart', (e) => {
        const anyPopup = document.querySelector(
            '#save-popup-overlay[style*="flex"], #settings-popup-overlay[style*="flex"], ' +
            '#welcome-overlay[style*="flex"], #fill-overlay[style*="block"], ' +
            '#block-search-overlay[style*="flex"], #island-biome-overlay[style*="flex"], ' +
            '#mountain-biome-overlay[style*="flex"], #graphics-settings-overlay[style*="flex"], ' +
            '#pointer-settings-overlay[style*="flex"], #about-popup-overlay[style*="flex"]'
        );
        if (anyPopup) return;
        if (e.touches.length > 1) { clearTimeout(_touchTimer); return; }

        _touchMoved = false;
        _touchStartX = e.touches[0].clientX;
        _touchStartY = e.touches[0].clientY;
        _touchTimer = setTimeout(() => {
            if (_touchMoved) return;
            if (navigator.vibrate) navigator.vibrate(40);

            let target = img;
            if (parseInt(img.getAttribute('data-z')) !== 0) {
                const tfId = img.getAttribute('data-terraform-group');
                if (tfId) {
                    const source = mapContainer.querySelector(`.tile[data-terraform-group="${tfId}"][data-z="0"]`);
                    if (source && source.style.opacity !== '0') target = source;
                    else return;
                } else return;
            }
            if (target.style.opacity === '0') return;

            if (selectedTiles.has(target)) {
                selectedTiles.delete(target);
                target.classList.remove('selected-tile');
            } else {
                selectedTiles.add(target);
                target.classList.add('selected-tile');
            }
            drawSelectionCanvas();
            updateFillButton();
            e.preventDefault();
        }, 500);
    }, { passive: true });

    img.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - _touchStartX;
        const dy = e.touches[0].clientY - _touchStartY;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8 || e.touches.length > 1) {
            _touchMoved = true;
            clearTimeout(_touchTimer);
        }
    }, { passive: true });

    img.addEventListener('touchend', (e) => {
        clearTimeout(_touchTimer);
        if (_touchMoved) return;
        if (selectedTiles.size > 0) return;
        e.preventDefault();
        handleInteraction(img, x, y, z);
        saveState();
        updateMinimap();
    });

    img.addEventListener('touchcancel', () => {
        clearTimeout(_touchTimer);
        _touchMoved = true;
    });

    parent.appendChild(img);
    return img;
}

function getBlockColor(type, path) {
    if (type === 'dirt' || type === 'dirt2') return '#4a7021';
    if (type === 'sand') return '#f4d18d';
    if (type === 'redsand') return '#b35d35';
    if (type === 'stone' || type === 'rock') return '#808080';
    if (type === 'water' || type === 'ice') return '#4da6ff';
    if (type === 'snow' || type.includes('snow')) return '#ffffff';
    if (type === 'wood' || type === 'leaf') return '#2d4c1e';
    if (type === 'flovers') return '#ff69b4';
    return '#523519';
}

function updateMinimap() {
    requestAnimationFrame(() => {
        mCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        const tiles = mapContainer.getElementsByClassName('tile');
        const centerX = minimapCanvas.width / 2;
        const centerY = minimapCanvas.height / 2;
        const size = 4;
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (t.style.opacity === "0") continue;
            const x = parseInt(t.getAttribute('data-x'));
            const y = parseInt(t.getAttribute('data-y'));
            const z = parseInt(t.getAttribute('data-z'));
            const color = t.getAttribute('data-color') || '#ffffff';
            const isoX = (x - y) * (size * 1.5);
            const isoY = (x + y) * (size * 0.75) - (z * 1);
            mCtx.fillStyle = color;
            mCtx.fillRect(centerX + isoX - size/2, centerY + isoY - size/2, size, size);
        }
        if (gridOverlayEnabled) applyGridOverlay(true);
    });
}

function showToast(msg, iconSrc) {
    const toast = document.getElementById('save-toast');
    if (iconSrc) {
        toast.innerHTML = '<img src="' + iconSrc + '" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;">' + msg;
    } else {
        toast.innerText = msg;
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

const ASSET_MAP = [
    'eraser',
    'dirt',
    'dirt2',
    'ShovedDirt',
    'flovers',
    'rock',
    'crops',
    'stone',
    'mossystone',
    'sand',
    'redsand',
    'water',
    'snow',
    'snowrocks',
    'ice',
    'pumpkin',
    'Hay',
    'melon',
    'tree',
    'snowed_tree',
    'snowman',
    'wood',
    'leaf',
    'snow2',
    'Snowman/snowmanb1.png',
    'Snowman/snowmanb2.png',
    'Snowman/SnowmanHead.png',
];

const CLIMATE_MAP = ['off', 'rain', 'snow', 'wind'];
const TIMP_MAP    = ['Day', 'Sunset', 'Night'];

function srcToAssetIdx(srcFull) {
    if (!srcFull) return -1;
    const marker = 'Assets/Blocks/';
    const mi = srcFull.indexOf(marker);
    const s = (mi !== -1 ? srcFull.slice(mi + marker.length) : srcFull).replace(/\.png$/i, '');
    return ASSET_MAP.findIndex(a => {
        const clean = a.replace(/\.png$/i, '');
        return clean === s || clean.split('/').pop() === s.split('/').pop();
    });
}

function assetIdxToSrc(idx) {
    const a = ASSET_MAP[idx];
    if (!a) return null;
    return './Assets/Blocks/' + (a.endsWith('.png') ? a : a + '.png');
}

function assetIdxToType(idx) {
    const a = ASSET_MAP[idx];
    if (!a) return '';
    return a.replace(/\.png$/i, '').split('/').pop();
}

function makeBitWriter() {
    const bytes = [];
    let cur = 0, bits = 0;
    return {
        write(val, n) {
            for (let i = n - 1; i >= 0; i--) {
                cur = (cur << 1) | ((val >> i) & 1);
                if (++bits === 8) { bytes.push(cur); cur = 0; bits = 0; }
            }
        },
        flush() { if (bits > 0) { bytes.push(cur << (8 - bits)); } },
        bytes
    };
}

function makeBitReader(bytes) {
    let bp = 0, bt = 0;
    return {
        read(n) {
            let val = 0;
            for (let i = 0; i < n; i++) {
                if (bp >= bytes.length) return val;
                val = (val << 1) | ((bytes[bp] >> (7 - bt)) & 1);
                if (++bt === 8) { bt = 0; bp++; }
            }
            return val;
        }
    };
}

function bytesToBase64url(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(str) {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function generateIslandCode() {
    const VERSION = 2;

    const tiles = Array.from(mapContainer.getElementsByClassName('tile'));
    const cols = currentIslandCols || 8;
    const rows = currentIslandRows || 8;

    const objIdMap = {};
    let objCounter = 0;
    tiles.forEach(t => {
        const raw = t.getAttribute('data-obj-id');
        if (raw && !objIdMap[raw]) objIdMap[raw] = ++objCounter;
    });

    const baseGrid = {};
    const overlays = [];
    tiles.forEach(t => {
        const x = parseInt(t.getAttribute('data-x'));
        const y = parseInt(t.getAttribute('data-y'));
        const z = parseInt(t.getAttribute('data-z'));
        const visible = t.style.opacity !== '0' ? 1 : 0;
        const assetIdx = srcToAssetIdx(t.src || t.getAttribute('src') || '');
        if (assetIdx === -1) return;
        const objIdNum = objIdMap[t.getAttribute('data-obj-id') || ''] || 0;
        if (z === 0) baseGrid[x + ',' + y] = { assetIdx, visible };
        else overlays.push({ x, y, z, assetIdx, objIdNum, visible });
    });

    const climateIdx = Math.max(0, CLIMATE_MAP.indexOf(currentClimate));
    const timpIdx    = Math.max(0, TIMP_MAP.indexOf(currentTimp));

    const bw = makeBitWriter();
    bw.write(VERSION, 4);
    bw.write(cols, 4);
    bw.write(rows, 4);
    bw.write(Math.min(overlays.length, 65535), 16);
    bw.write(climateIdx, 2);
    bw.write(timpIdx, 2);
    bw.write(0, 4); 
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = baseGrid[x + ',' + y] || { assetIdx: 0, visible: 0 };
            bw.write(cell.assetIdx & 0x1F, 5);
            bw.write(cell.visible, 1);
        }
    }
    overlays.slice(0, 65535).forEach(({ x, y, z, assetIdx, objIdNum, visible }) => {
        bw.write((x + 32) & 0x3F, 6);    
        bw.write((y + 32) & 0x3F, 6);   
        bw.write(z & 0x1F, 5);         
        bw.write(assetIdx & 0x1F, 5);       
        bw.write(objIdNum & 0x3FF, 10);    
        bw.write(visible, 1);
    });

    bw.flush();
    return 'i' + bytesToBase64url(bw.bytes); 
}

function loadIslandCode(code) {
    try {
        const trimmed = code.trim();
        if (trimmed.startsWith('i')) {
            return _loadIslandCodeV2(trimmed.slice(1));
        } else {
            return _loadIslandCodeV1(trimmed);
        }
    } catch(e) { console.error('Load failed:', e); return false; }
}

function _loadIslandCodeV2(b64) {
    const bytes = base64urlToBytes(b64);
    const br = makeBitReader(bytes);

    const version      = br.read(4); 
    const cols         = br.read(4);
    const rows         = br.read(4);
    const overlayCount = br.read(16);
    const climateIdx   = br.read(2);
    const timpIdx      = br.read(2);
    br.read(4); 

    mapContainer.innerHTML = '';

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const assetIdx = br.read(5);
            const visible  = br.read(1);
            const type = assetIdxToType(assetIdx);
            const t = createTile(x, y, 0, type);
            t.style.opacity = visible ? '1' : '0';
        }
    }

    const objIdRemap = {};
    let remapCounter = 0;
    for (let i = 0; i < overlayCount; i++) {
        const x        = br.read(6) - 32; 
        const y        = br.read(6) - 32;
        const z        = br.read(5);
        const assetIdx = br.read(5);
        const objIdNum = br.read(10);
        const visible  = br.read(1);

        const type = assetIdxToType(assetIdx);
        const src  = assetIdxToSrc(assetIdx);
        if (!src) continue;

        let fullObjId = '';
        if (objIdNum > 0) {
            if (!objIdRemap[objIdNum]) objIdRemap[objIdNum] = 'obj_' + (++remapCounter);
            fullObjId = objIdRemap[objIdNum];
        }

        const needsPath = ASSET_MAP[assetIdx] && ASSET_MAP[assetIdx].includes('/');
        const t = needsPath ? createTile(x, y, z, '', src) : createTile(x, y, z, type);
        t.style.opacity = visible ? '1' : '0';
        if (fullObjId) t.setAttribute('data-obj-id', fullObjId);
    }

    currentIslandCols = cols;
    currentIslandRows = rows;
    setClimate(CLIMATE_MAP[climateIdx] || 'off');
    setTimp(TIMP_MAP[timpIdx] || 'zi');
    saveState(); updateMinimap(); showCodeBar('');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    return true;
}

function _loadIslandCodeV1(b64) {
    const bytes = base64urlToBytes(b64);
    const br = makeBitReader(bytes);

    const cols         = br.read(4);
    const rows         = br.read(4);
    const overlayCount = br.read(8);
    const climateIdx   = br.read(2);
    const timpIdx      = br.read(2);
    br.read(4);

    mapContainer.innerHTML = '';

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const assetIdx = br.read(5);
            const visible  = br.read(1);
            const type = assetIdxToType(assetIdx);
            const t = createTile(x, y, 0, type);
            t.style.opacity = visible ? '1' : '0';
        }
    }

    const objIdRemap = {};
    let remapCounter = 0;
    for (let i = 0; i < overlayCount; i++) {
        const x       = br.read(4);
        const y       = br.read(4);
        const z       = br.read(4);
        const assetHi = br.read(1);
        const objHi   = br.read(3);
        const assetLo = br.read(4);
        const objLo   = br.read(3);
        const visible = br.read(1);

        const assetIdx = (assetHi << 4) | assetLo;
        const objIdNum = (objHi << 3) | objLo;
        const type = assetIdxToType(assetIdx);
        const src  = assetIdxToSrc(assetIdx);
        if (!src) continue;

        let fullObjId = '';
        if (objIdNum > 0) {
            if (!objIdRemap[objIdNum]) objIdRemap[objIdNum] = 'obj_' + (++remapCounter);
            fullObjId = objIdRemap[objIdNum];
        }

        const needsPath = ASSET_MAP[assetIdx] && ASSET_MAP[assetIdx].includes('/');
        const t = needsPath ? createTile(x, y, z, '', src) : createTile(x, y, z, type);
        t.style.opacity = visible ? '1' : '0';
        if (fullObjId) t.setAttribute('data-obj-id', fullObjId);
    }

    currentIslandCols = cols;
    currentIslandRows = rows;
    setClimate(CLIMATE_MAP[climateIdx] || 'off');
    setTimp(TIMP_MAP[timpIdx] || 'zi');
    saveState(); updateMinimap(); showCodeBar('');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    return true;
}

function saveIslandAsPNG() { openSavePopup(); }

let saveHoldTimer = null;
function startSaveHold() { saveHoldTimer = setTimeout(() => { openSavePopup(); }, 400); }
function cancelSaveHold() { if (saveHoldTimer) { clearTimeout(saveHoldTimer); saveHoldTimer = null; } }

function openSavePopup() {
    const overlay = document.getElementById('save-popup-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    document.getElementById('popup-code-output').value = generateIslandCode();
    refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    const wrapper = document.getElementById('save-popup-wrapper');
    wrapper.addEventListener('mouseenter', () => { document.body.style.cursor = 'default'; });
    wrapper.addEventListener('mouseleave', () => { document.body.style.cursor = 'crosshair'; });
}

function closeSavePopup() {
    const overlay = document.getElementById('save-popup-overlay');
    overlay.classList.remove('popup-visible');
    document.body.style.cursor = 'crosshair';
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function confirmSavePopup() { closeSavePopup(); hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {}); }

function showCodeBar(code) {
    const bar = document.getElementById('code-bar');
    document.getElementById('code-bar-value').value = code;
    bar.style.display = code ? 'flex' : 'none';
}

function pasteFromClipboard() {
    navigator.clipboard.readText().then(text => {
        document.getElementById('popup-code-input').value = text.trim();
        showToast('Succesfully Pasted!');
    }).catch(() => {
        document.getElementById('popup-code-input').focus();
        showToast('Press CTRL + V to paste!');
    });
}

function openLoadPopup() {
    const input = document.getElementById('popup-code-input').value.trim();
    if (!input) return;
    if (input.toUpperCase() === 'FLAVORTOWN') { showToast('Flavortown is the best :3'); return; }
    const ok = loadIslandCode(input);
    if (!ok) showToast('Invalid Code!');
    else { closeSavePopup(); showToast('Succesfully Loaded!'); }
}

function copyCode() {
    const val = document.getElementById('code-bar-value').value;
    navigator.clipboard.writeText(val).then(() => showToast('Succesfully Copied!')).catch(() => {
        document.getElementById('code-bar-value').select();
        document.execCommand('copy');
        showToast('Succesfully Copied!');
    });
}

function saveState() {
    const tiles = mapContainer.getElementsByClassName('tile');
    const state = [];
    for(let i=0; i<tiles.length; i++) {
        const t = tiles[i];
        state.push({
            x: t.getAttribute('data-x'), y: t.getAttribute('data-y'), z: t.getAttribute('data-z'),
            src: t.src, opacity: t.style.opacity, objId: t.getAttribute('data-obj-id'),
            color: t.getAttribute('data-color'), posLeft: t.getAttribute('data-pos-left'), posTop: t.getAttribute('data-pos-top'),
            tfGroup: t.getAttribute('data-terraform-group')
        });
    }
    historyStack.push(state);
    if (historyStack.length > MAX_HISTORY) historyStack.shift();
    redoStack = [];
    updateMinimap();
}

function undo() {
    if (historyStack.length <= 1) return;
    redoStack.push(historyStack.pop());
    applyState(historyStack[historyStack.length - 1]);
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function redo() {
    if (redoStack.length === 0) return;
    const state = redoStack.pop();
    historyStack.push(state);
    applyState(state);
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function applyState(state) {
    const fragment = document.createDocumentFragment();
    mapContainer.innerHTML = '';
    state.forEach(data => {
        const t = createTile(parseInt(data.x), parseInt(data.y), parseInt(data.z), '', data.src, fragment);
        t.style.opacity = data.opacity;
        t.setAttribute('data-color', data.color);
        if (data.objId) t.setAttribute('data-obj-id', data.objId);
        if (data.tfGroup) t.setAttribute('data-terraform-group', data.tfGroup);
        if (data.posLeft !== null && data.posLeft !== undefined) { t.setAttribute('data-pos-left', data.posLeft); t.style.left = data.posLeft + 'px'; }
        if (data.posTop !== null && data.posTop !== undefined) { t.setAttribute('data-pos-top', data.posTop); t.style.top = data.posTop + 'px'; }
    });
    mapContainer.appendChild(fragment);
    updateMinimap();
}

function spawnDestroyParticles(tile) {
    if (!tile || tile.style.opacity === '0') return;
    if (window._blockParticlesEnabled === false) return;
    const rect = tile.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const src = tile.src;
    const count = 6;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('img');
        p.src = src;
        const size = 5 + Math.random() * 5;
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
        const speed = 40 + Math.random() * 50;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 30;
        p.style.cssText = [
            'position:fixed',
            'pointer-events:none',
            'z-index:99999',
            'image-rendering:pixelated',
            `width:${size}px`,
            `height:${size}px`,
            `left:${cx - size / 2}px`,
            `top:${cy - size / 2}px`,
            'opacity:1',
            'transition:none',
        ].join(';');
        document.body.appendChild(p);
        let startTime = null;
        const duration = 400 + Math.random() * 200;
        function animate(ts) {
            if (!startTime) startTime = ts;
            const t = (ts - startTime) / duration;
            if (t >= 1) { p.remove(); return; }
            const gravity = 120;
            p.style.left = (cx - size / 2 + vx * t) + 'px';
            p.style.top  = (cy - size / 2 + vy * t + 0.5 * gravity * t * t) + 'px';
            p.style.opacity = 1 - t;
            p.style.transform = `rotate(${t * 360}deg)`;
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }
}

function handleInteraction(tile, x, y, z) {
    const isPartOfObject = tile.hasAttribute('data-obj-id') && tile.getAttribute('data-obj-id') !== "";
    const existingAbove = mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="${z + 1}"]`);

    if (selectedBlockType === 'eraser') {
        const objId = tile.getAttribute('data-obj-id');
        const tfId = tile.getAttribute('data-terraform-group');
        if (objId) {
            const toRemove = Array.from(mapContainer.querySelectorAll(`[data-obj-id="${objId}"]`));
            toRemove.forEach(t => spawnDestroyParticles(t));
            toRemove.forEach(t => t.remove());
        }
        if (tfId) {
            mapContainer.querySelectorAll(`[data-terraform-group="${tfId}"]`).forEach(t => {
                spawnDestroyParticles(t);
                if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
                else { t.style.opacity = '0'; t.removeAttribute('data-terraform-group'); }
            });
        } else if (!objId) {
            spawnDestroyParticles(tile);
            tile.style.opacity = '0';
        }
    } else if (['tree', 'snowed_tree', 'melon', 'Hay', 'snowman', 'pumpkin'].includes(selectedBlockType)) {
        if(tile.style.opacity === "0" || isPartOfObject) return;
        let topZ = 0;
        mapContainer.querySelectorAll(`.tile[data-x="${x}"][data-y="${y}"]`).forEach(t => {
            const tz = parseInt(t.getAttribute('data-z'));
            const belongsToObj = t.hasAttribute('data-obj-id') && t.getAttribute('data-obj-id') !== '';
            if (t.style.opacity !== '0' && !belongsToObj && tz > topZ) topZ = tz;
        });
        const groundTile = mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="${topZ}"]`);
        if (!groundTile || groundTile.style.opacity === '0') return;
        const baseZ = topZ + 1;
        const alreadyObj = mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="${baseZ}"]`);
        if (alreadyObj && alreadyObj.getAttribute('data-obj-id')) return;
        treeCounter++;
        const currentId = "obj_" + treeCounter;
        if (selectedBlockType === 'tree' || selectedBlockType === 'snowed_tree') {
            const leafType = selectedBlockType === 'tree' ? 'leaf' : 'snow2';
            for(let i = baseZ; i <= baseZ + 2; i++) createTile(x, y, i, 'wood').setAttribute('data-obj-id', currentId);
            for(let ox=-1; ox<=1; ox++) for(let oy=-1; oy<=1; oy++) createTile(x+ox, y+oy, baseZ+3, leafType).setAttribute('data-obj-id', currentId);
            [{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}].forEach(l => createTile(x+l.dx, y+l.dy, baseZ+4, leafType).setAttribute('data-obj-id', currentId));
            createTile(x, y, baseZ+5, leafType).setAttribute('data-obj-id', currentId);
            if(selectedBlockType === 'tree') startInfiniteLeaves(x, y, currentId);
        } else if (selectedBlockType === 'snowman') {
            createTile(x, y, baseZ,   '', './Assets/Blocks/Snowman/snowmanb1.png').setAttribute('data-obj-id', currentId);
            createTile(x, y, baseZ+1, '', './Assets/Blocks/Snowman/snowmanb2.png').setAttribute('data-obj-id', currentId);
            createTile(x, y, baseZ+2, '', './Assets/Blocks/Snowman/SnowmanHead.png').setAttribute('data-obj-id', currentId);
        } else { createTile(x, y, baseZ, selectedBlockType).setAttribute('data-obj-id', currentId); }
    } else {
        if(isPartOfObject) return;
        tile.src = `./Assets/Blocks/${selectedBlockType}.png`;
        tile.style.opacity = "1";
        tile.setAttribute('data-color', getBlockColor(selectedBlockType));
        tile.removeAttribute('data-obj-id');
    }
    const grassBlocks = ['dirt', 'flovers', 'rock', 'dirt2', 'crops', 'tree'];
    const soundToPlay = selectedBlockType === 'eraser' ? eraserSound : grassBlocks.includes(selectedBlockType) ? grassSound : placeSound;
    soundToPlay.currentTime = 0; soundToPlay.play().catch(e => {});
    if (!isDrawing) { saveState(); }
}

function createFallingLeaf(startX, startY, objId) {
    if (!mapContainer.querySelector(`[data-obj-id="${objId}"]`)) return;
    const leaf = document.createElement("img");
    const types = ['falling leaf1.png', 'falling leaf2.png', 'falling leaf3.png'];
    leaf.src = `./Assets/Blocks/${types[Math.floor(Math.random() * types.length)]}`;
    leaf.className = "tile";
    leaf.style.pointerEvents = "none";
    leaf.style.zIndex = "1000";
    leaf.style.transform = "scale(0.5)";
    leaf.style.transition = "opacity 1.5s ease-out";
    mapContainer.appendChild(leaf);
    let curX = startX + (Math.random() * 1.6 - 0.8);
    let curY = startY + (Math.random() * 1.6 - 0.8);
    let curZ = 5 + Math.random();
    let angle = Math.random() * Math.PI * 2;
    let speed = 0.015 + Math.random() * 0.02;
    function animate() {
        curZ -= speed; angle += 0.03;
        let driftX = curX + Math.sin(angle) * 0.5;
        let driftY = curY + Math.cos(angle) * 0.5;
        leaf.style.left = (driftX - driftY) * (TILE_W / 2) + "px";
        leaf.style.top = (driftX + driftY) * (TILE_H / 2) - (curZ * TILE_H) + "px";
        if (curZ <= 0.05) { leaf.style.opacity = "0"; setTimeout(() => leaf.remove(), 1500); return; }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function startInfiniteLeaves(x, y, objId) {
    const interval = setInterval(() => {
        if (!mapContainer.querySelector(`[data-obj-id="${objId}"]`)) { clearInterval(interval); return; }
        if (!leavesEnabled) return;
        if (Math.random() > 0.6) {
            const burst = Math.floor(Math.random() * 3) + 1;
            for(let i=0; i<burst; i++) { setTimeout(() => createFallingLeaf(x, y, objId), i * 500); }
        }
    }, 3000 + Math.random() * 4000);
}

const initFrag = document.createDocumentFragment();
for(let y=0; y<8; y++) for(let x=0; x<8; x++) createTile(x, y, 0, 'dirt', null, initFrag);
mapContainer.appendChild(initFrag);

// --- Minimap hold-to-zoom ---
(function initMinimapZoom() {
    const mc = document.getElementById('minimap-container');
    if (!mc) return;
    let _savedZoom = null;
    let _zoomRaf   = null;

    function animateTo(target, onDone) {
        cancelAnimationFrame(_zoomRaf);
        function step() {
            const diff = target - currentZoomPercent;
            if (Math.abs(diff) < 0.005) {
                currentZoomPercent = target;
                applyZoom();
                if (onDone) onDone();
                return;
            }
            currentZoomPercent += diff * 0.08;
            applyZoom();
            _zoomRaf = requestAnimationFrame(step);
        }
        _zoomRaf = requestAnimationFrame(step);
    }

    function onPress() {
        _savedZoom = currentZoomPercent;
        animateTo(1.0);
    }
    function onRelease() {
        if (_savedZoom === null) return;
        const target = _savedZoom;
        _savedZoom = null;
        animateTo(target);
    }

    mc.addEventListener('mousedown',  onPress);
    mc.addEventListener('touchstart', onPress,   { passive: true });
    window.addEventListener('mouseup',  onRelease);
    window.addEventListener('touchend', onRelease);
})();

function applyZoom() {
    zoomDot.style.left = (currentZoomPercent * 100) + "%";
    const scale = (1 + currentZoomPercent * 7).toFixed(2);
    const yMove = (currentZoomPercent * -50).toFixed(2);
    map.style.setProperty('--zoom-scale', scale);
    map.style.setProperty('--y-offset', yMove + "px");
    map.style.setProperty('--pan-x', panX + "px");
    map.style.setProperty('--pan-y', panY + "px");
    if (!isFloating) map.style.transform = `scale(${scale}) translate(${panX}px, calc(${yMove}px + ${panY}px))`;
}

function updateSlider(clientX) {
    const rect = zoomTrack.getBoundingClientRect();
    currentZoomPercent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    applyZoom();
}

zoomTrack.addEventListener('mousedown', (e) => {
    updateSlider(e.clientX);
    const onMove = ev => updateSlider(ev.clientX);
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        isPanning = true; document.body.style.cursor = 'grabbing';
        startPanX = e.clientX - panX; startPanY = e.clientY - panY;
        e.preventDefault();
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) { panX = e.clientX - startPanX; panY = e.clientY - startPanY; applyZoom(); }
});

window.addEventListener('mouseup', (e) => { 
    if (e.button === 1 || isPanning) { isPanning = false; document.body.style.cursor = 'crosshair'; }
    if (isDrawing) { isDrawing = false; saveState(); updateMinimap(); }
});

function startZooming(delta) {
    if(zoomInterval) clearInterval(zoomInterval);
    const tick = () => { currentZoomPercent = Math.max(0, Math.min(1, currentZoomPercent + delta)); applyZoom(); };
    tick(); zoomInterval = setInterval(tick, 50);
}

document.getElementById('btn-zoom-in').addEventListener('mousedown', () => startZooming(0.02));
document.getElementById('btn-zoom-out').addEventListener('mousedown', () => startZooming(-0.02));
window.addEventListener('mouseup', () => clearInterval(zoomInterval));

window.addEventListener('wheel', (e) => {
    const scrollable = e.target.closest('#welcome-readme, #fill-blocks-grid, #save-popup, #popup-code-output, #popup-code-input, #welcome-overlay, #save-popup-overlay, #fill-panel');
    if (scrollable) return;
    e.preventDefault();
    currentZoomPercent = Math.max(0, Math.min(1, currentZoomPercent + (e.deltaY > 0 ? -0.04 : 0.04)));
    applyZoom();
}, { passive: false });

function clearIsland() {
    mapContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const t = createTile(x, y, 0, 'dirt', null, frag); t.style.opacity = '0'; }
    mapContainer.appendChild(frag);
}

function deleteIsland() {
    mapContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) createTile(x, y, 0, 'dirt', null, frag);
    mapContainer.appendChild(frag);
    saveState(); updateMinimap(); closeSavePopup();
    showToast('Succesfully Deleted!');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function openConfirmDelete() {
    const overlay = document.getElementById('confirm-delete-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
}
function closeConfirmDelete() {
    const overlay = document.getElementById('confirm-delete-overlay');
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
}
function confirmDeleteIsland() {
    closeConfirmDelete();
    deleteIsland();
}

function generateRandomIsland(themeIdx) {
    const themes = [
        {
            label: 'Generated Seed:"SUMMER"',
            generate: (x, y, cx, cy, dist, SIZE) => {
                if (dist > SIZE * 0.42) return null;
                if (dist > SIZE * 0.35) return Math.random() < 0.6 ? 'sand' : 'dirt';
                const r = Math.random();
                if (r < 0.05) return 'flovers'; if (r < 0.10) return 'crops';
                if (r < 0.14) return 'rock'; if (r < 0.17) return 'mossystone';
                return Math.random() < 0.55 ? 'dirt' : 'dirt2';
            },
            multilayer: (dist, SIZE, isEdge) => {
                if (isEdge || dist > SIZE * 0.32) return null;
                const r = Math.random();
                if (r < 0.10) return 'tree'; if (r < 0.16) return 'melon'; if (r < 0.21) return 'Hay';
                return null;
            }
        },
        {
            label: 'Generated Seed:"SNOWY"',
            generate: (x, y, cx, cy, dist, SIZE) => {
                if (dist > SIZE * 0.42) return null;
                if (dist > SIZE * 0.36) return 'ice';
                const r = Math.random();
                if (r < 0.12) return 'snowrocks'; if (r < 0.18) return 'ice';
                return 'snow';
            },
            multilayer: (dist, SIZE, isEdge) => {
                if (isEdge || dist > SIZE * 0.33) return null;
                const r = Math.random();
                if (r < 0.09) return 'snowed_tree'; if (r < 0.14) return 'snowman'; if (r < 0.18) return 'pumpkin';
                return null;
            }
        },
        {
            label: 'Generated Seed"DESERT"',
            generate: (x, y, cx, cy, dist, SIZE) => {
                if (dist > SIZE * 0.42) return null;
                if (dist > SIZE * 0.38) return 'sand';
                const r = Math.random();
                if (r < 0.20) return 'redsand'; if (r < 0.28) return 'rock'; if (r < 0.32) return 'stone';
                return 'sand';
            },
            multilayer: (dist, SIZE, isEdge) => {
                if (isEdge || dist > SIZE * 0.30) return null;
                const r = Math.random();
                if (r < 0.07) return 'pumpkin'; if (r < 0.12) return 'melon';
                return null;
            }
        },
        {
            label: 'Generated Seed:"OCEAN"',
            generate: (x, y, cx, cy, dist, SIZE) => {
                if (dist > SIZE * 0.44) return null;
                if (dist < SIZE * 0.10) return Math.random() < 0.7 ? 'sand' : 'rock';
                if (dist < SIZE * 0.18) return Math.random() < 0.6 ? 'sand' : 'mossystone';
                return Math.random() < 0.85 ? 'water' : 'stone';
            },
            multilayer: (dist, SIZE, isEdge) => {
                if (dist > SIZE * 0.15 || dist < SIZE * 0.05) return null;
                return Math.random() < 0.08 ? 'melon' : null;
            }
        },
        {
            label: 'Generated Seed:"STONE"',
            generate: (x, y, cx, cy, dist, SIZE) => {
                if (dist > SIZE * 0.43) return null;
                if (dist > SIZE * 0.36) return 'rock';
                const r = Math.random();
                if (r < 0.08) return 'dirt'; if (r < 0.14) return 'mossystone';
                return Math.random() < 0.6 ? 'stone' : 'rock';
            },
            multilayer: (dist, SIZE, isEdge) => {
                if (isEdge || dist > SIZE * 0.28) return null;
                const r = Math.random();
                if (r < 0.07) return 'tree'; if (r < 0.11) return 'Hay';
                return null;
            }
        }
    ];

    const theme = (typeof themeIdx === 'number' && themeIdx >= 0 && themeIdx < themes.length) ? themes[themeIdx] : themes[Math.floor(Math.random() * themes.length)];
    const SIZE = 8;
    const noise = () => (Math.random() - 0.5) * 0.8;
    mapContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    const grid = [];

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cx = x - SIZE / 2 + 0.5;
            const cy = y - SIZE / 2 + 0.5;
            const dist = Math.sqrt(cx * cx + cy * cy) + noise();
            const blockType = theme.generate(x, y, cx, cy, dist, SIZE);
            if (blockType) {
                createTile(x, y, 0, blockType, null, frag);
                grid.push({ x, y, dist, blockType });
            } else {
                const t = createTile(x, y, 0, 'dirt', null, frag);
                t.style.opacity = '0';
            }
        }
    }
    mapContainer.appendChild(frag);

    let treeSpawned = false;
    grid.forEach(cell => {
        const isEdge = grid.some(n => Math.abs(n.x - cell.x) <= 1 && Math.abs(n.y - cell.y) <= 1 && !grid.find(g => g.x === n.x && g.y === n.y));
        const objType = theme.multilayer(cell.dist, SIZE, isEdge);
        if (!objType) return;
        if ((objType === 'tree' || objType === 'snowed_tree') && treeSpawned) return;
        if (objType === 'tree' || objType === 'snowed_tree') treeSpawned = true;
        const alreadyAbove = mapContainer.querySelector(`.tile[data-x="${cell.x}"][data-y="${cell.y}"][data-z="1"]`);
        if (alreadyAbove) return;
        treeCounter++;
        const currentId = 'obj_' + treeCounter;
        const { x, y } = cell;
        if (objType === 'tree' || objType === 'snowed_tree') {
            const leafType = objType === 'tree' ? 'leaf' : 'snow2';
            for (let i = 1; i <= 3; i++) createTile(x, y, i, 'wood').setAttribute('data-obj-id', currentId);
            for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) createTile(x+ox, y+oy, 4, leafType).setAttribute('data-obj-id', currentId);
            [{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}].forEach(l => createTile(x+l.dx, y+l.dy, 5, leafType).setAttribute('data-obj-id', currentId));
            createTile(x, y, 6, leafType).setAttribute('data-obj-id', currentId);
            if (objType === 'tree') startInfiniteLeaves(x, y, currentId);
        } else if (objType === 'snowman') {
            createTile(x, y, 1, '', './Assets/Blocks/Snowman/snowmanb1.png').setAttribute('data-obj-id', currentId);
            createTile(x, y, 2, '', './Assets/Blocks/Snowman/snowmanb2.png').setAttribute('data-obj-id', currentId);
            createTile(x, y, 3, '', './Assets/Blocks/Snowman/SnowmanHead.png').setAttribute('data-obj-id', currentId);
        } else {
            createTile(x, y, 1, objType).setAttribute('data-obj-id', currentId);
        }
    });

    const labelEl = document.getElementById('random-island-type');
    if (labelEl) labelEl.innerText = 'Last ' + theme.label;
    saveState(); updateMinimap();
    showToast(theme.label + '!');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function generateMountain(themeIdx) {
    const SIZE = 8;
    const noise2d = (x, y, seed) => {
        const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
        return s - Math.floor(s);
    };
    const seed = Math.random() * 1000;
    const noise = (x, y) => (noise2d(x, y, seed) - 0.5) * 1.2;
    const themes = [
        {
            label: 'Mountain:"ALPINE"',
            base: 'stone', mid: 'mossystone', top: 'snow', peak: 'snowrocks',
            treePick: () => Math.random() < 0.6 ? 'snowed_tree' : 'snowman'
        },
        {
            label: 'Mountain:"VOLCANIC"',
            base: 'rock', mid: 'stone', top: 'redsand', peak: 'rock',
            treePick: () => null
        },
        {
            label: 'Mountain:"EARTHY"',
            base: 'dirt2', mid: 'stone', top: 'dirt', peak: 'dirt',
            treePick: () => Math.random() < 0.7 ? 'tree' : 'Hay'
        },
        {
            label: 'Mountain:"MOSSY"',
            base: 'rock', mid: 'mossystone', top: 'dirt', peak: 'dirt2',
            treePick: () => 'tree'
        }
    ];
    const theme = (typeof themeIdx === 'number' && themeIdx >= 0 && themeIdx < themes.length) ? themes[themeIdx] : themes[Math.floor(Math.random() * themes.length)];

    mapContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    const MAX_H = 6;
    const heightMap = {};
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cx = x - SIZE / 2 + 0.5;
            const cy = y - SIZE / 2 + 0.5;
            const dist = Math.sqrt(cx * cx + cy * cy);
            const norm = dist / (SIZE * 0.5);
            if (norm > 0.92) {
                heightMap[x + ',' + y] = -1;
                continue;
            }
            const profile = Math.pow(1 - norm, 1.6); 
            const h = Math.round(profile * MAX_H + noise(x, y));
            heightMap[x + ',' + y] = Math.max(0, Math.min(MAX_H, h));
        }
    }
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const h = heightMap[x + ',' + y];
            if (h === -1) {
                const t = createTile(x, y, 0, 'dirt', null, frag);
                t.style.opacity = '0';
                continue;
            }
            const baseType = h === 0 ? theme.base : theme.base;
            createTile(x, y, 0, baseType, null, frag);
        }
    }
    mapContainer.appendChild(frag);
    const tfGroups = {};
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const h = heightMap[x + ',' + y];
            if (h <= 0) continue;

            treeCounter++;
            const tfGroupId = 'tf_' + treeCounter;
            const baseTile = mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`);
            if (baseTile) baseTile.setAttribute('data-terraform-group', tfGroupId);

            for (let zi = 1; zi <= h; zi++) {
                let blockType;
                const ratio = zi / h;
                if (zi === h) {
                    blockType = h >= 5 ? theme.peak : (h >= 3 ? theme.top : theme.mid);
                } else if (ratio > 0.5) {
                    blockType = theme.mid;
                } else {
                    blockType = theme.base;
                }
                const t = createTile(x, y, zi, blockType);
                t.setAttribute('data-terraform-group', tfGroupId);
            }
            tfGroups[x + ',' + y] = { h, tfGroupId };
        }
    }
    let bestCell = null, bestH = -1;
    for (const key in tfGroups) {
        const [gx, gy] = key.split(',').map(Number);
        const cx = gx - SIZE / 2 + 0.5, cy = gy - SIZE / 2 + 0.5;
        const dist = Math.sqrt(cx*cx + cy*cy);
        const { h } = tfGroups[key];
        if (h > bestH && dist < SIZE * 0.25) { bestH = h; bestCell = { x: gx, y: gy, h }; }
    }
    if (bestCell && theme.treePick) {
        const objType = theme.treePick();
        if (objType) {
            treeCounter++;
            const currentId = 'obj_' + treeCounter;
            const { x, y, h } = bestCell;
            const baseZ = h + 1;
            if (objType === 'tree' || objType === 'snowed_tree') {
                const leafType = objType === 'tree' ? 'leaf' : 'snow2';
                for (let i = baseZ; i <= baseZ + 2; i++) createTile(x, y, i, 'wood').setAttribute('data-obj-id', currentId);
                for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) createTile(x+ox, y+oy, baseZ+3, leafType).setAttribute('data-obj-id', currentId);
                [{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}].forEach(l => createTile(x+l.dx, y+l.dy, baseZ+4, leafType).setAttribute('data-obj-id', currentId));
                createTile(x, y, baseZ+5, leafType).setAttribute('data-obj-id', currentId);
                if (objType === 'tree') startInfiniteLeaves(x, y, currentId);
            } else if (objType === 'snowman') {
                createTile(x, y, baseZ,   '', './Assets/Blocks/Snowman/snowmanb1.png').setAttribute('data-obj-id', currentId);
                createTile(x, y, baseZ+1, '', './Assets/Blocks/Snowman/snowmanb2.png').setAttribute('data-obj-id', currentId);
                createTile(x, y, baseZ+2, '', './Assets/Blocks/Snowman/SnowmanHead.png').setAttribute('data-obj-id', currentId);
            } else {
                createTile(x, y, baseZ, objType).setAttribute('data-obj-id', currentId);
            }
        }
    }

    const labelEl = document.getElementById('mountain-type');
    if (labelEl) labelEl.innerText = 'Last ' + theme.label;
    saveState(); updateMinimap();
    showToast(theme.label + '!');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

const ALL_BLOCKS = [
    { type: 'dirt', name: 'Grass' }, { type: 'dirt2', name: 'Dirt' }, { type: 'ShovedDirt', name: 'Shoved Dirt' }, { type: 'sand', name: 'Sand' },
    { type: 'redsand', name: 'Red Sand' }, { type: 'stone', name: 'Stone' }, { type: 'mossystone', name: 'Mossy Stone' },
    { type: 'water', name: 'Water' }, { type: 'snow', name: 'Snow' }, { type: 'snowrocks', name: 'Snow Rocks' },
    { type: 'ice', name: 'Ice' }, { type: 'rock', name: 'Rock' }, { type: 'flovers', name: 'Flowers' },
    { type: 'crops', name: 'Crops' }, { type: 'pumpkin', name: 'Pumpkin' }, { type: 'melon', name: 'Melon' }, { type: 'Hay', name: 'Hay' },
];

let selectedTiles = new Set();
let isRectSelecting = false;
let rectStartX = 0, rectStartY = 0;
const selRect = document.getElementById('selection-rect');

const fillGrid = document.getElementById('fill-blocks-grid');
ALL_BLOCKS.forEach(b => {
    const btn = document.createElement('div');
    btn.className = 'fill-block-btn';
    btn.title = b.name;
    const img = document.createElement('img');
    img.src = `./Assets/Blocks/${b.type}.png`;
    const lbl = document.createElement('span');
    lbl.textContent = b.name;
    btn.appendChild(img); btn.appendChild(lbl);
    btn.addEventListener('click', () => fillSelectedTiles(b.type));
    fillGrid.appendChild(btn);
});

function getSelectionRect(x1, y1, x2, y2) {
    return { left: Math.min(x1,x2), top: Math.min(y1,y2), right: Math.max(x1,x2), bottom: Math.max(y1,y2) };
}

function updateSelectionRectUI(x1, y1, x2, y2) {}

function getBodyScale() {
    const t = document.body.style.transform;
    if (!t) return 1;
    const m = t.match(/scale\(([^)]+)\)/);
    return m ? parseFloat(m[1]) : 1;
}

function getTilesInRect(x1, y1, x2, y2) {
    const r = getSelectionRect(x1, y1, x2, y2);
    const result = [];
    mapContainer.querySelectorAll('.tile').forEach(tile => {
        if (tile.style.opacity === '0') return;
        if (parseInt(tile.getAttribute('data-z')) !== 0) return;
        const rect = tile.getBoundingClientRect();
        const tileCX = rect.left + rect.width / 2;
        const tileCY = rect.top + rect.height / 2;
        if (tileCX >= r.left && tileCX <= r.right && tileCY >= r.top && tileCY <= r.bottom) result.push(tile);
    });
    return result;
}

function highlightSelectedTiles() {
    mapContainer.querySelectorAll('.tile').forEach(t => t.classList.remove('selected-tile'));
    selectedTiles.forEach(t => t.classList.add('selected-tile'));
    drawSelectionCanvas();
}

function updateFillButton() {
    drawSelectionCanvas();
    const btn = document.getElementById('fill-selected-btn');
    if (selectedTiles.size > 0) {
        btn.textContent = 'FILL ' + selectedTiles.size + ' BLOCK' + (selectedTiles.size !== 1 ? 'S' : '');
        btn.style.display = 'block';
        requestAnimationFrame(() => btn.classList.add('btn-visible'));
    } else {
        btn.classList.remove('btn-visible');
        setTimeout(() => { btn.style.display = 'none'; }, 200);
    }
}

function openFillPanel() {
    const panel = document.getElementById('fill-panel');
    const overlay = document.getElementById('fill-overlay');
    const info = document.getElementById('fill-panel-info');
    const closeBtn = document.getElementById('fill-panel-close-btn');
    info.textContent = selectedTiles.size + ' tile' + (selectedTiles.size !== 1 ? 's' : '') + ' selected';
    overlay.style.display = 'block';
    panel.style.display = 'flex';
    closeBtn.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.classList.add('overlay-visible');
        panel.classList.add('panel-visible');
        closeBtn.classList.add('panel-visible');
    }));
}

function closeFillPanel() {
    const panel = document.getElementById('fill-panel');
    const overlay = document.getElementById('fill-overlay');
    const closeBtn = document.getElementById('fill-panel-close-btn');
    panel.classList.remove('panel-visible');
    overlay.classList.remove('overlay-visible');
    closeBtn.classList.remove('panel-visible');
    setTimeout(() => { panel.style.display = 'none'; overlay.style.display = 'none'; closeBtn.style.display = 'none'; }, 250);
    selectedTiles.forEach(t => t.classList.remove('selected-tile'));
    selectedTiles.clear();
    updateFillButton();
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
}

function setTerraformHeight(h) {
    terraformHeight = h;
    document.querySelectorAll('.terraform-h-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.h) === h);
    });
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function fillSelectedTiles(blockType) {
    if (selectedTiles.size === 0) return;
    const isMultilayer = ['tree','snowed_tree','melon','Hay','snowman','pumpkin'].includes(blockType);
    const h = terraformHeight;

    selectedTiles.forEach(tile => {
        const x = parseInt(tile.getAttribute('data-x'));
        const y = parseInt(tile.getAttribute('data-y'));
        const z = parseInt(tile.getAttribute('data-z'));
        const existingObjId = tile.getAttribute('data-obj-id');
        if (existingObjId) {
            mapContainer.querySelectorAll(`[data-obj-id="${existingObjId}"]`).forEach(t => {
                if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
            });
        }
        const existingTfId = tile.getAttribute('data-terraform-group');
        if (existingTfId) {
            mapContainer.querySelectorAll(`[data-terraform-group="${existingTfId}"]`).forEach(t => {
                if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
            });
        }
        mapContainer.querySelectorAll(`.tile[data-x="${x}"][data-y="${y}"]`).forEach(t => {
            if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
        });

        if (isMultilayer) {
            const topZ = h; 
            treeCounter++;
            const currentId = 'obj_' + treeCounter;
            let tfGroupId = null;
            if (h > 1) {
                treeCounter++;
                tfGroupId = 'tf_' + treeCounter;
                for (let zi = 1; zi < h; zi++) {
                    const t = createTile(x, y, zi, blockType === 'snowed_tree' ? 'snow' : 'dirt');
                    t.setAttribute('data-terraform-group', tfGroupId);
                }
                tile.setAttribute('data-terraform-group', tfGroupId);
            } else {
                tile.removeAttribute('data-terraform-group');
            }
            if (blockType === 'tree' || blockType === 'snowed_tree') {
                const leafType = blockType === 'tree' ? 'leaf' : 'snow2';
                for (let i = topZ; i <= topZ + 2; i++) createTile(x, y, i, 'wood').setAttribute('data-obj-id', currentId);
                for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) createTile(x+ox, y+oy, topZ+3, leafType).setAttribute('data-obj-id', currentId);
                [{dx:0,dy:0},{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}].forEach(l => createTile(x+l.dx, y+l.dy, topZ+4, leafType).setAttribute('data-obj-id', currentId));
                createTile(x, y, topZ+5, leafType).setAttribute('data-obj-id', currentId);
                if (blockType === 'tree') startInfiniteLeaves(x, y, currentId);
            } else if (blockType === 'snowman') {
                createTile(x, y, topZ,   '', './Assets/Blocks/Snowman/snowmanb1.png').setAttribute('data-obj-id', currentId);
                createTile(x, y, topZ+1, '', './Assets/Blocks/Snowman/snowmanb2.png').setAttribute('data-obj-id', currentId);
                createTile(x, y, topZ+2, '', './Assets/Blocks/Snowman/SnowmanHead.png').setAttribute('data-obj-id', currentId);
            } else {
                createTile(x, y, topZ, blockType).setAttribute('data-obj-id', currentId);
            }
        } else {
            if (h === 1) {
                tile.src = `./Assets/Blocks/${blockType}.png`;
                tile.style.opacity = '1';
                tile.setAttribute('data-color', getBlockColor(blockType));
                tile.removeAttribute('data-obj-id');
                tile.removeAttribute('data-terraform-group');
            } else {
                treeCounter++;
                const tfGroupId = 'tf_' + treeCounter;
                tile.src = `./Assets/Blocks/${blockType}.png`;
                tile.style.opacity = '1';
                tile.setAttribute('data-color', getBlockColor(blockType));
                tile.removeAttribute('data-obj-id');
                tile.setAttribute('data-terraform-group', tfGroupId);
                for (let zi = 1; zi < h; zi++) {
                    const t = createTile(x, y, zi, blockType);
                    t.setAttribute('data-terraform-group', tfGroupId);
                }
            }
        }
    });
    placeSound.currentTime = 0; placeSound.play().catch(e => {});
    saveState();
    updateMinimap();
    closeFillPanel();
    showToast('Filled' + (h > 1 ? ' (H:' + h + ')' : '') + '!');
}

document.getElementById('stage').addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.ctrlKey || e.metaKey) return;
    if (e.target.classList.contains('tile')) return;
    if (selectedTiles.size === 0) return;
    selectedTiles.forEach(t => t.classList.remove('selected-tile'));
    selectedTiles.clear();
    updateFillButton();
});


(function () {
    let mode = 'idle'; 
    let panAnchorX = 0;
    let panAnchorY = 0;
    let panMoved = false;
    let pinchStartDist = 0;
    let pinchStartZoom = 0;
    let pinchMidStartX = 0;
    let pinchMidStartY = 0;
    let pinchPanStartX = 0;
    let pinchPanStartY = 0;

    function dist(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function mid(t1, t2) {
        return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
    }

    document.addEventListener('touchstart', (e) => {
        const inUI = e.target.closest(
            '#dock-container, #minimap-container, .game-title-container, #zoom-ui, ' +
            '#save-popup-overlay, #settings-popup-overlay, #welcome-overlay, ' +
            '#fill-panel, #fill-overlay, #block-search-overlay, #island-biome-overlay, ' +
            '#mountain-biome-overlay, #graphics-settings-overlay, #pointer-settings-overlay, ' +
            '#about-popup-overlay, #qr-popup-overlay, #confirm-delete-overlay, ' +
            '#fill-panel-close-btn, #fill-selected-btn'
        );
        if (inUI) return;

        if (e.touches.length === 2) {
            mode = 'pinch';
            pinchStartDist  = dist(e.touches[0], e.touches[1]);
            pinchStartZoom  = currentZoomPercent;
            const m = mid(e.touches[0], e.touches[1]);
            pinchMidStartX  = m.x;
            pinchMidStartY  = m.y;
            pinchPanStartX  = panX;
            pinchPanStartY  = panY;
        } else if (e.touches.length === 1 && mode === 'idle') {
            mode = 'pan';
            panMoved   = false;
            panAnchorX = e.touches[0].clientX - panX;
            panAnchorY = e.touches[0].clientY - panY;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (mode === 'pinch' && e.touches.length === 2) {
            e.preventDefault();

            const d = dist(e.touches[0], e.touches[1]);
            const scale = d / pinchStartDist;
            currentZoomPercent = Math.max(0, Math.min(1, pinchStartZoom * scale
                + (1 - scale) * pinchStartZoom 
                + (d - pinchStartDist) * 0.002 
            ));
            currentZoomPercent = Math.max(0, Math.min(1,
                pinchStartZoom + (d - pinchStartDist) * 0.003
            ));
            const m = mid(e.touches[0], e.touches[1]);
            panX = pinchPanStartX + (m.x - pinchMidStartX);
            panY = pinchPanStartY + (m.y - pinchMidStartY);

            applyZoom();

        } else if (mode === 'pan' && e.touches.length === 1) {
            const dx = e.touches[0].clientX - panAnchorX - panX;
            const dy = e.touches[0].clientY - panAnchorY - panY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) panMoved = true;
            if (!panMoved) return;

            e.preventDefault();
            panX = e.touches[0].clientX - panAnchorX;
            panY = e.touches[0].clientY - panAnchorY;
            applyZoom();
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            if (mode === 'pan' && !panMoved && selectedTiles.size > 0) {
                if (!e.target.classList.contains('tile')) {
                    selectedTiles.forEach(t => t.classList.remove('selected-tile'));
                    selectedTiles.clear();
                    updateFillButton();
                }
            }
            mode = 'idle';
        } else if (e.touches.length === 1 && mode === 'pinch') {
            mode = 'pan';
            panMoved   = false;
            panAnchorX = e.touches[0].clientX - panX;
            panAnchorY = e.touches[0].clientY - panY;
        }
    }, { passive: true });

    document.addEventListener('touchcancel', () => { mode = 'idle'; }, { passive: true });
})();
window.addEventListener('mousedown', (e) => {
    if (e.button !== 2) return;
    if (e.target.closest('#dock-container, #save-popup-overlay, #fill-panel, #fill-overlay, #welcome-overlay, #zoom-ui, #minimap-container, .game-title-container')) return;
    if (selectedTiles.size > 0) {
        selectedTiles.forEach(t => t.classList.remove('selected-tile'));
        selectedTiles.clear();
        updateFillButton();
    }
    isRectSelecting = true;
    rectStartX = e.clientX; rectStartY = e.clientY;
    updateSelectionRectUI(rectStartX, rectStartY, rectStartX, rectStartY);
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (!isRectSelecting) return;
    updateSelectionRectUI(rectStartX, rectStartY, e.clientX, e.clientY);
});

window.addEventListener('mouseup', (e) => {
    if (e.button !== 2 || !isRectSelecting) return;
    isRectSelecting = false;
    const tilesInRect = getTilesInRect(rectStartX, rectStartY, e.clientX, e.clientY);
    const allSelected = tilesInRect.length > 0 && tilesInRect.every(t => selectedTiles.has(t));
    if (allSelected) {
        tilesInRect.forEach(t => { t.classList.remove('selected-tile'); selectedTiles.delete(t); });
    } else {
        tilesInRect.forEach(t => { selectedTiles.add(t); t.classList.add('selected-tile'); });
    }
    highlightSelectedTiles();
    updateFillButton();
    if (selectedTiles.size === 0) {
        const panel = document.getElementById('fill-panel');
        if (panel.style.display !== 'none') closeFillPanel();
    }
    e.preventDefault();
});

window.addEventListener('contextmenu', (e) => { e.preventDefault(); });

window.addEventListener('keydown', (e) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (selectedTiles.size === 0) return;

    let deletedCount = 0;
    const objIdsToDelete = new Set();
    const tfGroupsToDelete = new Set();

    selectedTiles.forEach(tile => {
        const objId = tile.getAttribute('data-obj-id');
        if (objId) objIdsToDelete.add(objId);
        const tfId = tile.getAttribute('data-terraform-group');
        if (tfId) tfGroupsToDelete.add(tfId);
    });

    objIdsToDelete.forEach(objId => {
        mapContainer.querySelectorAll(`[data-obj-id="${objId}"]`).forEach(t => t.remove());
    });

    tfGroupsToDelete.forEach(tfId => {
        mapContainer.querySelectorAll(`[data-terraform-group="${tfId}"]`).forEach(t => {
            if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
            else { t.style.opacity = '0'; t.removeAttribute('data-terraform-group'); }
        });
    });

    selectedTiles.forEach(tile => {
        if (!document.body.contains(tile)) return;
        const x = parseInt(tile.getAttribute('data-x'));
        const y = parseInt(tile.getAttribute('data-y'));
        mapContainer.querySelectorAll(`.tile[data-x="${x}"][data-y="${y}"]`).forEach(t => {
            if (parseInt(t.getAttribute('data-z')) > 0) t.remove();
        });
        tile.style.opacity = '0';
        tile.removeAttribute('data-obj-id');
        tile.removeAttribute('data-terraform-group');
        tile.classList.remove('selected-tile');
        deletedCount++;
    });

    selectedTiles.clear();
    updateFillButton();
    placeSound.currentTime = 0; placeSound.play().catch(e => {});
    saveState();
    showToast('Deleted ' + deletedCount + ' block' + (deletedCount !== 1 ? 's' : '') + '!');
});

window.onload = () => {
    applyZoom();
    const firstSlot = document.getElementById('slot-eraser');
    lastSelectedSlotP1 = firstSlot;
    selectBlock('eraser', firstSlot, true);
    saveState();
    updateMinimap();
    const ov = document.getElementById('welcome-overlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
    fetchReadme();
};

const REPO_RAW = 'https://raw.githubusercontent.com/Adium1000/Isometric-island/main/';

function fetchReadme() {
    const loading = document.getElementById('readme-loading');
    const content = document.getElementById('welcome-readme');
    const SESSION_KEY = 'ii_readme_cache';
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
        loading.style.display = 'none';
        content.style.display = 'block';
        content.innerHTML = cached;
        return;
    }
    fetch(REPO_RAW + 'readme.md', { cache: 'force-cache' })
        .then(r => { if (!r.ok) throw new Error(); return r.text(); })
        .then(md => {
            const html = parseMarkdown(md);
            try { sessionStorage.setItem(SESSION_KEY, html); } catch { /* quota full — fine */ }
            loading.style.display = 'none';
            content.style.display = 'block';
            content.innerHTML = html;
        })
        .catch(() => { loading.innerHTML = 'Error while loading. <a href="https://github.com/Adium1000/Isometric-island/blob/main/readme.md" target="_blank" style="color:#adffa8;">Open Github &#8599;</a>'; });
}

function resolveImgSrc(src) {
    if (/^https?:\/\//i.test(src)) return src;
    return REPO_RAW + src.replace(/^\.?\//,'');
}

function isTableSeparator(line) { return /^\|?[\s:|-]+\|/.test(line) && /[-]/.test(line); }

function parseMarkdown(md) {
    let html = '';
    const lines = md.split('\n');
    let inUl = false, inOl = false, inPre = false, preBuffer = '';
    let tableBuffer = [];

    function closeList() { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } }

    function flushTable() {
        if (tableBuffer.length === 0) return;
        const parseRow = row => row.replace(/^\||\|$/g,'').split('|').map(c => c.trim());
        const headers = parseRow(tableBuffer[0]);
        html += '<table><thead><tr>' + headers.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>';
        for (let r = 2; r < tableBuffer.length; r++) {
            const cells = parseRow(tableBuffer[r]);
            html += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>';
        }
        html += '</tbody></table>';
        tableBuffer = [];
    }

    function inline(t) {
        return t
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/~~([^~]+)~~/g, '<del>$1</del>')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${resolveImgSrc(src)}" alt="${alt}">`)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    }

    for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        const fenceMatch = l.trim().match(/^```/);
        if (fenceMatch && !inPre) { inPre = true; preBuffer = ''; flushTable(); closeList(); continue; }
        if (inPre && l.trim().startsWith('```')) { html += `<pre><code>${preBuffer.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`; inPre = false; continue; }
        if (inPre) { preBuffer += l + '\n'; continue; }
        const isTableRow = l.trim().startsWith('|') || (l.includes('|') && !l.trim().startsWith('#'));
        if (isTableRow && (tableBuffer.length > 0 || (lines[i+1] && isTableSeparator(lines[i+1])))) { closeList(); tableBuffer.push(l); continue; }
        else if (tableBuffer.length > 0) { flushTable(); }
        if (/^### (.+)/.test(l)) { closeList(); html += '<h3>' + inline(l.replace(/^### /,'')) + '</h3>'; continue; }
        if (/^## (.+)/.test(l))  { closeList(); html += '<h2>' + inline(l.replace(/^## /,''))  + '</h2>'; continue; }
        if (/^# (.+)/.test(l))   { closeList(); html += '<h1>' + inline(l.replace(/^# /,''))   + '</h1>'; continue; }
        if (/^[-*_]{3,}$/.test(l.trim())) { closeList(); html += '<hr>'; continue; }
        if (/^> (.+)/.test(l)) { closeList(); html += '<blockquote>' + inline(l.replace(/^> /,'')) + '</blockquote>'; continue; }
        if (/^[-*+] (.+)/.test(l)) { if (inOl){html+='</ol>';inOl=false;} if(!inUl){html+='<ul>';inUl=true;} html+='<li>'+inline(l.replace(/^[-*+] /,''))+'</li>'; continue; }
        if (/^\d+\. (.+)/.test(l)) { if (inUl){html+='</ul>';inUl=false;} if(!inOl){html+='<ol>';inOl=true;} html+='<li>'+inline(l.replace(/^\d+\. /,''))+'</li>'; continue; }
        closeList();
        if (l.trim() === '') { html += '<br>'; continue; }
        html += '<p>' + inline(l) + '</p>';
    }
    flushTable(); closeList();
    return html;
}

let currentIslandCols = 8;
let currentIslandRows = 8;

function buildShapeGrid() {
    const grid = document.getElementById('island-shape-grid');
    grid.innerHTML = '';
    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = 'shape-cell';
            cell.dataset.r = r; cell.dataset.c = c;
            cell.addEventListener('mouseover', () => hoverShapeCell(r, c));
            cell.addEventListener('mouseleave', () => {});
            cell.addEventListener('click', () => applyIslandShape(r, c));
            grid.appendChild(cell);
        }
    }
    grid.addEventListener('mouseleave', () => {
        refreshShapeGrid();
        document.getElementById('shape-size-label').textContent = currentIslandCols + ' x ' + currentIslandRows;
    });
    refreshShapeGrid();
}

function refreshShapeGrid() {
    document.querySelectorAll('.shape-cell').forEach(el => {
        const cr = parseInt(el.dataset.r);
        const cc = parseInt(el.dataset.c);
        el.classList.remove('hovered');
        if (cr <= currentIslandRows && cc <= currentIslandCols) el.classList.add('current-size');
        else el.classList.remove('current-size');
    });
}

function hoverShapeCell(rows, cols) {
    document.querySelectorAll('.shape-cell').forEach(el => {
        const cr = parseInt(el.dataset.r);
        const cc = parseInt(el.dataset.c);
        el.classList.remove('current-size');
        if (cr <= rows && cc <= cols) { el.classList.add('hovered'); }
        else { el.classList.remove('hovered'); if (cr <= currentIslandRows && cc <= currentIslandCols) el.classList.add('current-size'); }
    });
    document.getElementById('shape-size-label').textContent = cols + ' x ' + rows;
}

function applyIslandShape(rows, cols) {
    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) t.remove();
    });
    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`)) createTile(x, y, 0, 'dirt', null, frag);
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Island: ' + cols + 'x' + rows + '!');
    closeSavePopup();
}

buildShapeGrid();

let currentClimate = 'off';
let weatherAnimFrame = null;
let weatherParticles = [];
const bgColors = { off: '#aad6ff', rain: '#607080', snow: '#c8ddf5', wind: '#b8c8a8' };
const climateIcons = { off: '', rain: '', snow: '', wind: '' };
const weatherCanvas = document.getElementById('weather-canvas');
const wCtx = weatherCanvas.getContext('2d');

function resizeWeatherCanvas() { weatherCanvas.width = window.innerWidth; weatherCanvas.height = window.innerHeight; }
resizeWeatherCanvas();
window.addEventListener('resize', resizeWeatherCanvas);

function setClimate(mode) {
    currentClimate = mode;
    ['off','rain','snow','wind'].forEach(m => { const b = document.getElementById('cbtn-' + m); if (b) b.classList.toggle('active', m === mode); });
    document.body.style.backgroundColor = bgColors[mode];
    if (weatherAnimFrame) cancelAnimationFrame(weatherAnimFrame);
    wCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
    weatherParticles = [];
    if (mode !== 'off') { initParticles(mode); animateWeather(mode); }
    applyGUITheme(mode);
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    const climateToastIcons = { off: './Assets/Icons/off.png', rain: './Assets/Icons/rainrr.png', snow: './Assets/Icons/rain.png', wind: './Assets/Icons/wind.png' };
    showToast(mode.toUpperCase() + '!', climateToastIcons[mode]);
}

function initParticles(mode) {
    const count = mode === 'wind' ? 60 : (mode === 'snow' ? 120 : 200);
    for (let i = 0; i < count; i++) weatherParticles.push(createParticle(mode, true));
}

function createParticle(mode, randomY = false) {
    const W = weatherCanvas.width, H = weatherCanvas.height;
    if (mode === 'rain') return { x: Math.random()*W, y: randomY ? Math.random()*H : -10, len: 12+Math.random()*14, speed: 14+Math.random()*10, opacity: 0.4+Math.random()*0.4 };
    if (mode === 'snow') return { x: Math.random()*W, y: randomY ? Math.random()*H : -10, r: 2+Math.random()*4, speedY: 1+Math.random()*2, speedX: (Math.random()-0.5)*1.5, opacity: 0.6+Math.random()*0.4, wobble: Math.random()*Math.PI*2, wobbleSpeed: 0.02+Math.random()*0.03 };
    if (mode === 'wind') { const len = 60+Math.random()*120; return { x: randomY ? Math.random()*W : -len, y: Math.random()*H, len, speed: 8+Math.random()*14, opacity: 0.15+Math.random()*0.3, life: 1.0, decay: 0.008+Math.random()*0.012 }; }
}

function animateWeather(mode) {
    wCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
    const W = weatherCanvas.width, H = weatherCanvas.height;
    for (let i = weatherParticles.length - 1; i >= 0; i--) {
        const p = weatherParticles[i];
        if (mode === 'rain') {
            wCtx.save(); wCtx.strokeStyle = `rgba(150,190,255,${p.opacity})`; wCtx.lineWidth = 1;
            wCtx.beginPath(); wCtx.moveTo(p.x, p.y); wCtx.lineTo(p.x-2, p.y+p.len); wCtx.stroke(); wCtx.restore();
            p.y += p.speed; p.x -= 2;
            if (p.y > H+20) weatherParticles[i] = createParticle(mode);
        } else if (mode === 'snow') {
            wCtx.save(); wCtx.fillStyle = `rgba(255,255,255,${p.opacity})`; wCtx.beginPath(); wCtx.arc(p.x, p.y, p.r, 0, Math.PI*2); wCtx.fill(); wCtx.restore();
            p.wobble += p.wobbleSpeed; p.y += p.speedY; p.x += p.speedX + Math.sin(p.wobble)*0.5;
            if (p.y > H+10) weatherParticles[i] = createParticle(mode);
        } else if (mode === 'wind') {
            wCtx.save(); wCtx.strokeStyle = `rgba(200,220,180,${p.opacity*p.life})`; wCtx.lineWidth = 1;
            wCtx.beginPath(); wCtx.moveTo(p.x, p.y); wCtx.lineTo(p.x+p.len, p.y+(Math.random()-0.5)*4); wCtx.stroke(); wCtx.restore();
            p.x += p.speed; p.life -= p.decay;
            if (p.x > W+p.len || p.life <= 0) weatherParticles[i] = createParticle(mode);
        }
    }
    weatherAnimFrame = requestAnimationFrame(() => animateWeather(mode));
}

function openSettingsPopup() {
    const swCursor = document.getElementById('sw-custom-cursor');
    if (swCursor) {
        swCursor.classList.toggle('on', window._customCursorEnabled !== false);
    }
    const overlay = document.getElementById('settings-popup-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeSettingsPopup() {
    const overlay = document.getElementById('settings-popup-overlay');
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

let currentTimp = 'zi';
const timpOverlay = document.createElement('div');
timpOverlay.id = 'timp-overlay';
timpOverlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;transition:background 1.2s ease,opacity 1.2s ease;opacity:0;';
document.body.appendChild(timpOverlay);

function setTimp(mode) {
    const norm = {'Day':'zi','day':'zi','Zi':'zi','Sunset':'apus','sunset':'apus','Night':'noapte','night':'noapte'};
    mode = norm[mode] || mode;
    currentTimp = mode;
    ['zi','apus','noapte'].forEach(m => {
        const b = document.getElementById('tbtn-' + m);
        if (b) b.classList.toggle('active', m === mode);
    });
    if (mode === 'zi') {
        timpOverlay.style.opacity = '0';
        document.querySelector('.game-title').style.color = '#523519';
        hideStars();
    } else if (mode === 'apus') {
        timpOverlay.style.background = 'linear-gradient(to bottom, #ff6030 0%, #ff9933 40%, #ffcc66 100%)';
        timpOverlay.style.opacity = '0.38';
        document.querySelector('.game-title').style.color = '#7a3200';
        hideStars();
    } else if (mode === 'noapte') {
        timpOverlay.style.background = 'linear-gradient(to bottom, #050d1a 0%, #0d1b3e 60%, #1a2a5a 100%)';
        timpOverlay.style.opacity = '0.72';
        document.querySelector('.game-title').style.color = '#b0c8ff';
        showStars();
    }
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    const timpLabel = { zi: 'DAY', apus: 'SUNSET', noapte: 'NIGHT' };
    const timpToastIcons = { zi: './Assets/Icons/day.png', apus: './Assets/Icons/resun.png', noapte: './Assets/Icons/night.png' };
    showToast((timpLabel[mode] || mode.toUpperCase()) + '!', timpToastIcons[mode]);
}

let starsContainer = null;

function showStars() {
    if (starsContainer) { starsContainer.style.opacity = '1'; return; }
    starsContainer = document.createElement('div');
    starsContainer.id = 'stars-container';
    starsContainer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity 1.5s ease;';
    const count = 80 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        const size = Math.random() < 0.7 ? 2 : Math.random() < 0.5 ? 3 : 4;
        const x = Math.random() * 100;
        const y = Math.random() * 65;
        const delay = Math.random() * 3;
        const dur = 1.5 + Math.random() * 2.5;
        star.style.cssText = `
            position:absolute;
            left:${x}%;top:${y}%;
            width:${size}px;height:${size}px;
            background:#fff;
            image-rendering:pixelated;
            animation: starTwinkle ${dur}s ${delay}s ease-in-out infinite alternate;
        `;
        starsContainer.appendChild(star);
    }
    document.body.appendChild(starsContainer);
    requestAnimationFrame(() => { starsContainer.style.opacity = '1'; });
}

function hideStars() {
    if (!starsContainer) return;
    starsContainer.style.opacity = '0';
    setTimeout(() => {
        if (starsContainer) { starsContainer.remove(); starsContainer = null; }
    }, 1500);
}

function drawQR(text) {
    const output = document.getElementById('qr-output');
    output.innerHTML = '';
    function buildQR() {
        output.innerHTML = '';
        try {
            new QRCode(output, {
                text: text,
                width: 240,
                height: 240,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
            setTimeout(() => {
                const cv = output.querySelector('canvas');
                const img = output.querySelector('img');
                if (cv) {
                    cv.style.cssText = 'display:block;width:240px;height:240px;image-rendering:pixelated;';
                    if (img) img.style.display = 'none';
                } else if (img) {
                    img.style.cssText = 'display:block;width:240px;height:240px;';
                }
            }, 100);
        } catch(e) {
            output.innerHTML = '<div style="color:#ff6060;font-size:8px;padding:10px;font-family:\'Press Start 2P\',cursive;">QR Error</div>';
        }
    }
    if (window.QRCode) {
        buildQR();
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = buildQR;
        script.onerror = () => { output.innerHTML = '<div style="color:#ff6060;font-size:8px;padding:10px;font-family:\'Press Start 2P\',cursive;">Nu se poate incarca QR</div>'; };
        document.head.appendChild(script);
    }
}

function showQRCode() {
    const code = document.getElementById('popup-code-output').value;
    if (!code) { showToast('No code yet!'); return; }
    const overlay = document.getElementById('qr-popup-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.classList.add('popup-visible');
        drawQR(code);
    }));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function closeQRPopup() {
    const overlay = document.getElementById('qr-popup-overlay');
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function closeWelcome() {
    const ov = document.getElementById('welcome-overlay');
    ov.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { ov.style.display = 'none'; }, 350);
}

(function() {
    const welcomeOv = document.getElementById('welcome-overlay');
    function syncLabel() {
        const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
        const scale = saved.scale || Math.round(window.devicePixelRatio * 100);
        const clamped = Math.max(30, Math.min(150, Math.round(scale / 10) * 10));
        const lbl = document.getElementById('welcome-zoom-value');
        if (lbl) lbl.textContent = clamped + '%';
    }
    const observer = new MutationObserver(() => {
        if (welcomeOv.classList.contains('popup-visible')) syncLabel();
    });
    observer.observe(welcomeOv, { attributes: true, attributeFilter: ['class'] });
    syncLabel();
})();

function welcomeNextStep() {
    const step1 = document.getElementById('welcome-step-1');
    const step2 = document.getElementById('welcome-step-2');
    step1.classList.add('slide-out');
    step1.addEventListener('animationend', function handler() {
        step1.removeEventListener('animationend', handler);
        step1.style.display = 'none';
        step2.classList.add('slide-in');
    });
}

const BLOCK_SEARCH_LIST = [
    { type: 'eraser',      name: 'Eraser',        tag: 'Tool',             cat: 'tools' },
    { type: 'dirt',        name: 'Grass',          tag: 'Natural Block',    cat: 'natural' },
    { type: 'flovers',     name: 'Flowers',        tag: 'Natural Deco',     cat: 'decoration' },
    { type: 'rock',        name: 'Rock',           tag: 'Natural Deco',     cat: 'decoration' },
    { type: 'dirt2',       name: 'Dirt',           tag: 'Natural Block',    cat: 'natural' },
    { type: 'ShovedDirt',  name: 'Shoved Dirt',    tag: 'Natural Block',    cat: 'natural' },
    { type: 'crops',       name: 'Crops',          tag: 'Natural Deco',     cat: 'decoration' },
    { type: 'stone',       name: 'Stone',          tag: 'Natural Block',    cat: 'natural' },
    { type: 'mossystone',  name: 'Mossy Stone',    tag: 'Natural Deco',     cat: 'decoration' },
    { type: 'sand',        name: 'Sand',           tag: 'Natural Block',    cat: 'natural' },
    { type: 'redsand',     name: 'Red Sand',       tag: 'Natural Block',    cat: 'natural' },
    { type: 'melon',       name: 'Watermelon',     tag: 'Deco (multilayer)',  cat: 'decoration' },
    { type: 'Hay',         name: 'Haystack',       tag: 'Deco (multilayer)',  cat: 'decoration' },
    { type: 'water',       name: 'Water',          tag: 'Natural Block',    cat: 'natural' },
    { type: 'tree',        name: 'Tree',           tag: 'Deco (multilayer)', cat: 'nature' },
    { type: 'pumpkin',     name: 'Pumpkin',        tag: 'Natural Deco',     cat: 'decoration' },
    { type: 'snow',        name: 'Snow',           tag: 'Natural Block',    cat: 'winter' },
    { type: 'snowrocks',   name: 'Snow Rocks',     tag: 'Natural Block',    cat: 'winter' },
    { type: 'ice',         name: 'Ice',            tag: 'Natural Block',    cat: 'winter' },
    { type: 'snowman',     name: 'Snowman',        tag: 'Deco (multilayer)', cat: 'winter' },
    { type: 'snowed_tree', name: 'Snowy Tree',     tag: 'Winter Deco',      cat: 'winter',  img: 'snowedtree' },
];

const BSEARCH_CATEGORIES = [
    { id: 'all',        label: 'ALL' },
    { id: 'natural',    label: 'NATURAL' },
    { id: 'decoration', label: 'DECO' },
    { id: 'nature',     label: 'NATURE' },
    { id: 'winter',     label: 'WINTER' },
    { id: 'tools',      label: 'TOOLS' },
];

let bsearchActiveCategory = 'all';
let bsearchOpen = false;

function buildBlockSearchMenu() {
    const catEl = document.getElementById('block-search-categories');
    catEl.innerHTML = '';
    BSEARCH_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'bsearch-cat-btn' + (cat.id === bsearchActiveCategory ? ' active' : '');
        btn.textContent = cat.label;
        btn.onclick = () => {
            bsearchActiveCategory = cat.id;
            document.querySelectorAll('.bsearch-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const q = document.getElementById('block-search-input').value;
            renderBlockSearchGrid(q);
        };
        catEl.appendChild(btn);
    });
    renderBlockSearchGrid('');
}

function renderBlockSearchGrid(query) {
    const grid = document.getElementById('block-search-grid');
    grid.innerHTML = '';
    const q = query.trim().toLowerCase();
    const filtered = BLOCK_SEARCH_LIST.filter(b => {
        const matchCat = bsearchActiveCategory === 'all' || b.cat === bsearchActiveCategory;
        const matchQ = !q || b.name.toLowerCase().includes(q) || b.tag.toLowerCase().includes(q) || b.type.toLowerCase().includes(q);
        return matchCat && matchQ;
    });

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.id = 'block-search-empty';
        empty.textContent = 'NO BLOCKS FOUND';
        grid.appendChild(empty);
        return;
    }

    filtered.forEach(b => {
        const item = document.createElement('div');
        item.className = 'bsearch-item';
        if (b.type === selectedBlockType) item.classList.add('selected');

        const imgSrc = b.img ? `./Assets/Blocks/${b.img}.png` : `./Assets/Blocks/${b.type}.png`;
        item.innerHTML = `
            <img src="${imgSrc}" alt="${b.name}" draggable="false">
            <div class="bsearch-item-name">${b.name}</div>
            <div class="bsearch-item-tag">${b.tag}</div>
        `;
        item.onclick = () => {
            let slot = document.querySelector(`#dock .slot[onclick*="selectBlock('${b.type}'"]`);
            if (!slot) {
                document.querySelectorAll('#dock .slot').forEach(s => {
                    if (s.getAttribute('onclick') && s.getAttribute('onclick').includes(`'${b.type}'`)) slot = s;
                });
            }
            if (slot) {
                const isP2 = slot.classList.contains('page-2');
                if (isP2 && currentPage !== 2) switchPage(2);
                else if (!isP2 && currentPage !== 1) switchPage(1);
                selectBlock(b.type, slot);
            } else {
                selectedBlockType = b.type;
                hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
            }
            closeBlockSearch();
        };
        grid.appendChild(item);
    });
}

function filterBlockSearch(q) {
    renderBlockSearchGrid(q);
}

function openBlockSearch() {
    if (bsearchOpen) return;
    bsearchOpen = true;
    bsearchActiveCategory = 'all';
    const overlay = document.getElementById('block-search-overlay');
    const wrapper = document.getElementById('block-search-wrapper');
    const popup   = document.getElementById('block-search-popup');
    overlay.style.display = 'flex';
    wrapper.style.display = 'block';
    popup.style.display   = 'flex';
    requestAnimationFrame(() => {
        overlay.classList.add('popup-visible');
        wrapper.classList.add('popup-visible');
    });
    buildBlockSearchMenu();
    setTimeout(() => {
        const input = document.getElementById('block-search-input');
        if (input) { input.value = ''; input.focus(); }
    }, 60);
}

function closeBlockSearch() {
    if (!bsearchOpen) return;
    bsearchOpen = false;
    const overlay = document.getElementById('block-search-overlay');
    const wrapper = document.getElementById('block-search-wrapper');
    const popup   = document.getElementById('block-search-popup');
    overlay.classList.remove('popup-visible');
    wrapper.classList.remove('popup-visible');
    setTimeout(() => {
        overlay.style.display = 'none';
        wrapper.style.display = 'none';
        popup.style.display   = 'none';
    }, 250);
}

function toggleBlockSearch() {
    if (bsearchOpen) closeBlockSearch(); else openBlockSearch();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bsearchOpen) { e.preventDefault(); closeBlockSearch(); }
});


function openIslandBiomePopup() {
    const overlay = document.getElementById('island-biome-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeIslandBiomePopup() {
    const overlay = document.getElementById('island-biome-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}
function selectIslandBiome(idx) {
    closeIslandBiomePopup();
    closeSavePopup();
    setTimeout(() => { generateRandomIsland(idx < 0 ? undefined : idx); }, 270);
}

function openMountainBiomePopup() {
    const overlay = document.getElementById('mountain-biome-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeMountainBiomePopup() {
    const overlay = document.getElementById('mountain-biome-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}
function selectMountainBiome(idx) {
    closeMountainBiomePopup();
    closeSavePopup();
    setTimeout(() => { generateMountain(idx < 0 ? undefined : idx); }, 270);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeIslandBiomePopup();
        closeMountainBiomePopup();
        closeMusicPopup();
    }
});

(function () {
    const CURSOR_DEFAULT  = { src: './Assets/Cursors/cross.png',     size: 24, ox: 0.5,  oy: 0.5  };
    const CURSOR_POINTER  = { src: './Assets/Cursors/hand-point.png', size: 24, ox: 0.15, oy: 0.05 };

    const POINTER_SELECTOR = [
        'a', 'button', 'input[type="button"]', 'input[type="submit"]',
        'select', 'label',
        '.slot', '.zoom-btn', '.zoom-step-btn', '.terraform-h-btn',
        '.btn-welcome-ok', '.btn-cancel-del', '.btn-confirm-del',
        '#save-btn', '#undo-btn', '#redo-btn', '#float-toggle', '#music-toggle',
        '#welcome-close-btn', '#popup-close-btn', '#qr-close-btn',
        '#block-search-close-btn', '#fill-panel-close-btn', '#fill-selected-btn',
        '#zoom-dot', '#zoom-track', '#btn-next-page', '#btn-prev-page',
        '[onclick]'
    ].join(',');
    function injectNoneStyle() {
        if (!document.getElementById('custom-cursor-none-style')) {
            const s = document.createElement('style');
            s.id = 'custom-cursor-none-style';
            s.textContent = '*, *::before, *::after { cursor: none !important; }';
            document.head.appendChild(s);
        }
    }
    function removeNoneStyle() {
        const s = document.getElementById('custom-cursor-none-style');
        if (s) s.remove();
    }
    injectNoneStyle();

    const el = document.createElement('img');
    el.id = 'custom-cursor';
    Object.assign(el.style, {
        position:       'fixed',
        top:            '0',
        left:           '0',
        pointerEvents:  'none',
        zIndex:         '2147483647',
        imageRendering: 'pixelated',
        display:        'none',
        willChange:     'transform',
    });
    document.body.appendChild(el);

    let currentCursor = null;

    function applyCursor(cfg) {
        if (currentCursor === cfg) return;
        currentCursor = cfg;
        el.src = cfg.src;
        el.style.width  = cfg.size + 'px';
        el.style.height = 'auto';
    }

    function moveCursor(e) {
        const cfg = currentCursor || CURSOR_DEFAULT;
        const x = e.clientX - cfg.size * cfg.ox;
        const y = e.clientY - cfg.size * cfg.oy;
        el.style.transform = `translate(${x}px,${y}px)`;
        el.style.display = 'block';
    }

    function updateCursorType(e) {
        const target = e.target;
        if (target && target.closest && target.closest(POINTER_SELECTOR)) {
            applyCursor(CURSOR_POINTER);
        } else {
            applyCursor(CURSOR_DEFAULT);
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (!window._customCursorEnabled) return;
        updateCursorType(e);
        moveCursor(e);
    }, { passive: true });

    document.addEventListener('mouseleave', () => { el.style.display = 'none'; });
    document.addEventListener('mouseenter', () => {
        if (!window._customCursorEnabled) return;
        el.style.display = 'block';
    });


    [CURSOR_DEFAULT, CURSOR_POINTER].forEach(c => { new Image().src = c.src; });

    if (localStorage.getItem('customCursor') === 'on') {
        applyCursor(CURSOR_DEFAULT);
    } else {
        el.style.display = 'none';
        removeNoneStyle();
    }

    window._customCursorEnabled = localStorage.getItem('customCursor') === 'on';

    window._setCustomCursorEnabled = function(enabled) {
        window._customCursorEnabled = enabled;
        localStorage.setItem('customCursor', enabled ? 'on' : 'off');
        if (enabled) {
            injectNoneStyle();
            el.style.display = 'block';
            applyCursor(CURSOR_DEFAULT);
        } else {
            el.style.display = 'none';
            removeNoneStyle();
        }
    };
})();

function toggleCustomCursor(btn) {
    const enabled = !window._customCursorEnabled;
    btn.classList.toggle('on', enabled);
    window._setCustomCursorEnabled(enabled);
}

function openPointerSettings() {
    const overlay = document.getElementById('pointer-settings-overlay');
    if (!overlay) return;
    const swCursor = document.getElementById('sw-custom-cursor');
    if (swCursor) swCursor.classList.toggle('on', !!window._customCursorEnabled);
    const swTip = document.getElementById('sw-block-tooltips');
    if (swTip) swTip.classList.toggle('on', window._blockTooltipsEnabled !== false);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closePointerSettings() {
    const overlay = document.getElementById('pointer-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

if (localStorage.getItem('blockTooltips') === null) localStorage.setItem('blockTooltips', 'on');
window._blockTooltipsEnabled = localStorage.getItem('blockTooltips') !== 'off';

(function initCursorItem() {
    const el = document.createElement('img');
    el.id = 'cursor-item-preview';
    el.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483646;image-rendering:pixelated;width:16px;height:16px;opacity:0.5;display:none;will-change:transform;';
    document.body.appendChild(el);

    function isAnyPopupOpen() {
        var overlays = document.querySelectorAll(
            '#save-popup-overlay, #settings-popup-overlay, #welcome-overlay, ' +
            '#qr-popup-overlay, #confirm-delete-overlay, #block-search-overlay, ' +
            '#island-biome-overlay, #mountain-biome-overlay, #pointer-settings-overlay, ' +
            '#about-popup-overlay, #fill-overlay, #graphics-settings-overlay'
        );
        for (var i = 0; i < overlays.length; i++) {
            var s = overlays[i].style.display;
            if (s && s !== 'none') return true;
        }
        return false;
    }

    document.addEventListener('mousemove', function(e) {
        if (!window._blockTooltipsEnabled || isAnyPopupOpen()) { el.style.display = 'none'; return; }
        var src = window._selectedBlockSrc || '';
        if (!src) { el.style.display = 'none'; return; }
        if (el.getAttribute('src') !== src) el.setAttribute('src', src);
        el.style.display = 'block';
        el.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY + 14) + 'px)';
    }, { passive: true });

    document.addEventListener('mouseleave', function() { el.style.display = 'none'; });
})();



function toggleBlockTooltips(btn) {
    window._blockTooltipsEnabled = !window._blockTooltipsEnabled;
    btn.classList.toggle('on', window._blockTooltipsEnabled);
    localStorage.setItem('blockTooltips', window._blockTooltipsEnabled ? 'on' : 'off');
    if (!window._blockTooltipsEnabled) {
        const el = document.getElementById('cursor-item-preview');
        if (el) el.style.display = 'none';
    }
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function openAboutPopup() {
    const overlay = document.getElementById('about-popup-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeAboutPopup() {
    const overlay = document.getElementById('about-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}

function openGraphicsSettings() {
    const overlay = document.getElementById('graphics-settings-overlay');
    if (!overlay) return;
    const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
    const swS = document.getElementById('sw-shadows');
    const swL = document.getElementById('sw-leaves');
    const swC = document.getElementById('sw-clouds');
    const swP = document.getElementById('sw-block-particles');
    if (swS) swS.classList.toggle('on', saved.shadows !== false);
    if (swL) swL.classList.toggle('on', saved.leaves !== false);
    if (swC) swC.classList.toggle('on', !!saved.clouds);
    if (swP) swP.classList.toggle('on', window._blockParticlesEnabled !== false);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeGraphicsSettings() {
    const overlay = document.getElementById('graphics-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}


window._blockParticlesEnabled = localStorage.getItem('blockParticles') !== 'off';

function toggleBlockParticles(btn) {
    window._blockParticlesEnabled = !window._blockParticlesEnabled;
    btn.classList.toggle('on', window._blockParticlesEnabled);
    localStorage.setItem('blockParticles', window._blockParticlesEnabled ? 'on' : 'off');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

(function idlePreload() {
    const LAZY_BLOCKS = [
        'pumpkin','snow','snowrocks','ice','snowman',
        'snowed_tree','p2','p1',
        'Blocks/Snowman/SnowmanHead','Blocks/Snowman/snowmanb1','Blocks/Snowman/snowmanb2',
    ];
    const GUI_THEMES = ['blue', 'green'];
    const GUI_FILES  = ['hotbar','selector','zoombar','zoomdot','zoom-','zoom+','save','undo','redo','bgon','bgoff','floaton','floatoff'];

    const queue = [
        ...LAZY_BLOCKS.map(b => `./Assets/Blocks/${b}.png`),
        ...GUI_THEMES.flatMap(t => GUI_FILES.map(f => `./Assets/GUI/${t}/${f}.png`)),
        './Assets/Audio/place.wav',
        './Assets/Audio/grass.wav',
        './Assets/Audio/pcls.wav',
        './Assets/Audio/BG.wav',
    ];

    let idx = 0;

    function loadNext(deadline) {
        while (idx < queue.length && (deadline.timeRemaining() > 2 || deadline.didTimeout)) {
            const src = queue[idx++];
            if (src.endsWith('.png')) {
                getCachedImage(src);
            } else if (src.endsWith('.wav') || src.endsWith('.mp3')) {
                fetch(src, { cache: 'force-cache' }).catch(() => {});
            }
        }
        if (idx < queue.length) scheduleNext();
    }

    function scheduleNext() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadNext, { timeout: 3000 });
        } else {
            setTimeout(() => loadNext({ timeRemaining: () => 10, didTimeout: false }), 500);
        }
    }

    setTimeout(scheduleNext, 1500);
})();
