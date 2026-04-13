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
const DEFAULT_KEY_BINDINGS = [
    { id: 'undo',        label: 'Undo',         desc: 'Ctrl+Z',  key: 'z',  ctrl: true  },
    { id: 'redo',        label: 'Redo',         desc: 'Ctrl+Y',  key: 'y',  ctrl: true  },
    { id: 'search',      label: 'Block Search', desc: 'S',       key: 's',  ctrl: false },
    { id: 'grid',        label: 'Grid Overlay', desc: 'G',       key: 'g',  ctrl: false },
    { id: 'eraser',      label: 'Eraser',       desc: 'E',       key: 'e',  ctrl: false },
    { id: 'page',        label: 'Switch Page',  desc: 'P',       key: 'p',  ctrl: false },
    { id: 'music',       label: 'Music',        desc: 'M',       key: 'm',  ctrl: false },
    { id: 'float',       label: 'Float Mode',   desc: 'F',       key: 'f',  ctrl: false },
];

function _loadKeyBindings() {
    try {
        const saved = localStorage.getItem('islandKeyBindings');
        if (saved) {
            const parsed = JSON.parse(saved);
            return DEFAULT_KEY_BINDINGS.map(def => {
                const override = parsed.find(p => p.id === def.id);
                return override ? { ...def, key: override.key, ctrl: override.ctrl } : { ...def };
            });
        }
    } catch(e) {}
    return DEFAULT_KEY_BINDINGS.map(d => ({ ...d }));
}

function _saveKeyBindings() {
    localStorage.setItem('islandKeyBindings', JSON.stringify(
        window._keyBindings.map(b => ({ id: b.id, key: b.key, ctrl: b.ctrl }))
    ));
}

window._keyBindings = _loadKeyBindings();

window.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (window._kbListening) return;

    const key = e.key.toLowerCase();
    const bindings = window._keyBindings;

    const get = (id) => bindings.find(b => b.id === id);

    const undoB = get('undo');
    const redoB = get('redo');
    if (undoB && e.ctrlKey && key === undoB.key) { e.preventDefault(); undo(); return; }
    if (redoB && e.ctrlKey && key === redoB.key) { e.preventDefault(); redo(); return; }

    if (e.ctrlKey) return; 

    const searchB = get('search');
    if (searchB && !searchB.ctrl && key === searchB.key) { e.preventDefault(); toggleBlockSearch(); return; }

    const gridB = get('grid');
    if (gridB && !gridB.ctrl && key === gridB.key) {
        const sw = document.getElementById('sw-grid');
        if (sw) { toggleVisualOption('gridOverlay', sw); hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {}); }
        return;
    }

    const eraserB = get('eraser');
    if (eraserB && !eraserB.ctrl && key === eraserB.key) {
        if (currentPage !== 1) switchPage(1);
        const eraserSlot = document.getElementById('slot-eraser');
        selectBlock('eraser', eraserSlot);
        return;
    }

    const pageB = get('page');
    if (pageB && !pageB.ctrl && key === pageB.key) { switchPage(currentPage === 1 ? 2 : 1); return; }

    const musicB = get('music');
    if (musicB && !musicB.ctrl && key === musicB.key) { openMusicPopup(); return; }

    const floatB = get('float');
    if (floatB && !floatB.ctrl && key === floatB.key) { openFloatPopup(); return; }
});

function openKeyBindingsPopup() {
    const overlay = document.getElementById('keybindings-popup-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    _renderKeyBindingsList();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function closeKeyBindingsPopup() {
    const overlay = document.getElementById('keybindings-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    window._kbListening = null;
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function _keyDisplayName(key, ctrl) {
    if (ctrl) return 'Ctrl+' + key.toUpperCase();
    const special = { ' ': 'Space', 'arrowup': '↑', 'arrowdown': '↓', 'arrowleft': '←', 'arrowright': '→', 'escape': 'Esc', 'tab': 'Tab', 'backspace': 'Bksp', 'delete': 'Del', 'enter': 'Enter' };
    return special[key] || key.toUpperCase();
}

function _renderKeyBindingsList() {
    const list = document.getElementById('keybindings-list');
    if (!list) return;
    list.innerHTML = '';
    window._keyBindings.forEach((binding, idx) => {
        const conflict = window._keyBindings.find((b, i) => i !== idx && b.key === binding.key && b.ctrl === binding.ctrl);

        const row = document.createElement('div');
        row.className = 'kb-row';
        row.innerHTML = `
            <span class="kb-label">${binding.label}</span>
            <button class="kb-key-btn${conflict ? ' conflict' : ''}" id="kb-btn-${binding.id}" onclick="startListeningKey('${binding.id}')">${_keyDisplayName(binding.key, binding.ctrl)}</button>
        `;
        list.appendChild(row);
        if (conflict) {
            const badge = document.createElement('div');
            badge.className = 'kb-conflict-badge';
            badge.style.cssText = 'width:100%;text-align:center;';
            badge.textContent = '⚠ CONFLICT WITH ' + conflict.label.toUpperCase();
            list.appendChild(badge);
        }
    });
}

window._kbListening = null;
window._kbKeydownHandler = null;

function startListeningKey(bindingId) {
    if (window._kbKeydownHandler) {
        document.removeEventListener('keydown', window._kbKeydownHandler, true);
        window._kbKeydownHandler = null;
    }

    window._kbListening = bindingId;
    const btn = document.getElementById('kb-btn-' + bindingId);
    if (btn) {
        btn.classList.add('listening');
        btn.textContent = '...';
    }

    const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const key = e.key.toLowerCase();
        if (['control','shift','alt','meta','capslock'].includes(key)) return;
        if (key === 'escape') {
            window._kbListening = null;
            document.removeEventListener('keydown', handler, true);
            window._kbKeydownHandler = null;
            _renderKeyBindingsList();
            return;
        }

        const ctrl = e.ctrlKey;
        const binding = window._keyBindings.find(b => b.id === bindingId);
        if (binding) {
            binding.key = key;
            binding.ctrl = ctrl;
            _saveKeyBindings();
        }

        window._kbListening = null;
        document.removeEventListener('keydown', handler, true);
        window._kbKeydownHandler = null;
        _renderKeyBindingsList();
        hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    };

    window._kbKeydownHandler = handler;
    document.addEventListener('keydown', handler, true);
}

function resetKeyBindings() {
    window._keyBindings = DEFAULT_KEY_BINDINGS.map(d => ({ ...d }));
    _saveKeyBindings();
    _renderKeyBindingsList();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

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
    const track = document.getElementById('music-volume-track');
    if (track && !track._volumeInited) _initVolumeBar();
    else { const dot = document.getElementById('music-volume-dot'); if (dot) dot.style.left = (_musicVolume * 100) + '%'; }
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
let _musicVolume = 0.8;

function _applyMusicVolume(v) {
    _musicVolume = Math.max(0, Math.min(1, v));
    getBgMusic().volume = _musicVolume;
    try { getPlaceSound().volume  = _musicVolume; } catch(_) {}
    try { getGrassSound().volume  = _musicVolume; } catch(_) {}
    try { getPclsSound().volume   = _musicVolume; } catch(_) {}
    try { getEraserSound().volume = _musicVolume; } catch(_) {}
    try { hotbarSound.volume      = _musicVolume; } catch(_) {}
    const dot = document.getElementById('music-volume-dot');
    if (dot) dot.style.left = (_musicVolume * 100) + '%';
}

function _initVolumeBar() {
    const track = document.getElementById('music-volume-track');
    if (!track) return;

    const dot = document.getElementById('music-volume-dot');
    if (dot) dot.style.left = (_musicVolume * 100) + '%';

    function updateFromX(clientX) {
        const rect = track.getBoundingClientRect();
        _applyMusicVolume((clientX - rect.left) / rect.width);
    }

    track.addEventListener('mousedown', (e) => {
        updateFromX(e.clientX);
        const onMove = ev => updateFromX(ev.clientX);
        const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });

    track.addEventListener('touchstart', (e) => {
        updateFromX(e.touches[0].clientX);
        const onMove = ev => updateFromX(ev.touches[0].clientX);
        const onEnd  = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    }, { passive: true });

    track._volumeInited = true;
}

let _floatSpeed = 0.5; 
const _floatBaseDurations = { updown: 6, leftright: 8, spin: 12, jiggle: 1.2 };
function _applyFloatSpeed(v) {
    _floatSpeed = Math.max(0, Math.min(1, v));
    const dot = document.getElementById('float-speed-dot');
    if (dot) dot.style.left = (_floatSpeed * 100) + '%';
    _applyFloatAnimationDuration();
    try { localStorage.setItem('floatSpeed', _floatSpeed); } catch(_) {}
}

function _applyFloatAnimationDuration() {
    const mode = currentFloatMode;
    if (!mode || mode === 'off') return;
    const base = _floatBaseDurations[mode] || 4;
    const duration = base * (1 - _floatSpeed * 0.75);
    map.style.animationDuration = duration.toFixed(2) + 's';
}
function _initFloatSpeedBar() {
    const track = document.getElementById('float-speed-track');
    if (!track) return;

    const dot = document.getElementById('float-speed-dot');
    if (dot) dot.style.left = (_floatSpeed * 100) + '%';

    function updateFromX(clientX) {
        const rect = track.getBoundingClientRect();
        _applyFloatSpeed((clientX - rect.left) / rect.width);
    }

    track.addEventListener('mousedown', (e) => {
        updateFromX(e.clientX);
        const onMove = ev => updateFromX(ev.clientX);
        const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });

    track.addEventListener('touchstart', (e) => {
        updateFromX(e.touches[0].clientX);
        const onMove = ev => updateFromX(ev.touches[0].clientX);
        const onEnd  = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    }, { passive: true });

    track._floatSpeedInited = true;
}


let currentFloatMode = 'off';

function openFloatPopup() {
    const overlay = document.getElementById('float-popup-overlay');
    if (!overlay) return;
    _syncFloatPopupCards();
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    const track = document.getElementById('float-speed-track');
    if (track && !track._floatSpeedInited) _initFloatSpeedBar();
    else { const dot = document.getElementById('float-speed-dot'); if (dot) dot.style.left = (_floatSpeed * 100) + '%'; }
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeFloatPopup() {
    const overlay = document.getElementById('float-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function _syncFloatPopupCards() {
    ['off','updown','leftright','spin','jiggle'].forEach(id => {
        const card = document.getElementById('fmode-' + id);
        if (card) card.classList.toggle('active', currentFloatMode === id);
    });
}
function setFloatMode(mode) {
    currentFloatMode = mode;
    isFloating = (mode !== 'off');
    map.classList.remove('floating-island', 'floating-island-lr', 'floating-island-spin', 'floating-island-jiggle');
    map.style.animationDuration = '';
    if (mode === 'updown')         map.classList.add('floating-island');
    else if (mode === 'leftright') map.classList.add('floating-island-lr');
    else if (mode === 'spin')      map.classList.add('floating-island-spin');
    else if (mode === 'jiggle')    map.classList.add('floating-island-jiggle');
    if (isFloating) _applyFloatAnimationDuration();
    const folder = getGUIFolder(currentGUITheme);
    floatBtn.src = isFloating ? folder + 'floaton.png' : folder + 'floatoff.png';
    _syncFloatPopupCards();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    applyZoom();
}
function toggleFloat() {
    if (currentFloatMode === 'off') {
        openFloatPopup();
    } else {
        setFloatMode('off');
    }
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
    const savedFloatSpeed = localStorage.getItem('floatSpeed');
    if (savedFloatSpeed !== null) _floatSpeed = parseFloat(savedFloatSpeed);

   
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
        if (saved.showAir === true) {
            const sw = document.getElementById('sw-show-air');
            if (sw) sw.classList.add('on');
            setTimeout(() => applyShowAir(true), 500);
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
    } else if (option === 'showAir') {
        applyShowAir(isOn);
    }

    const saved = JSON.parse(localStorage.getItem('visualOptions') || '{}');
    saved[option] = isOn;
    localStorage.setItem('visualOptions', JSON.stringify(saved));
}

let showAirEnabled = false;

function applyShowAir(isOn) {
    showAirEnabled = isOn;
    document.querySelectorAll('#map .tile').forEach(t => {
        if (isOn) {
            if (t.style.opacity === '0') {
                t.style.opacity = '1';
                t._airSrcBackup = t.src;
                t.src = './Assets/Blocks/air.png';
                t._isAirVisible = true;
            }
        } else {
            if (t._isAirVisible) {
                t.style.opacity = '0';
                if (t._airSrcBackup) t.src = t._airSrcBackup;
                t._isAirVisible = false;
                delete t._airSrcBackup;
            }
        }
    });
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
        if (window._activeRadialTool) {
            const tool = window._activeRadialTool;
            const tx = parseInt(img.getAttribute('data-x'));
            const ty = parseInt(img.getAttribute('data-y'));
            if (tool === 'magic_wand') {
                _magicWandSelect(img);
                return;
            }
            if (tool === 'line_tool') {
                _lineToolClick(img);
                return;
            }
            if (tool === 'circle_tool') {
                _circleToolClick(img);
                return;
            }
            if (tool === 'terraform') {
                _terraformStart(img, e.clientY);
                const onMove = (ev) => _terraformMove(ev.clientY);
                const onUp   = () => { _terraformEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
                return;
            }
        }
        if (e.altKey) {
            const tileSrc = img.src || '';
            if (tileSrc && img.style.opacity !== '0') {
                const marker = 'Assets/Blocks/';
                const mi = tileSrc.indexOf(marker);
                const rawName = (mi !== -1 ? tileSrc.slice(mi + marker.length) : tileSrc).replace(/\.png$/i, '').split('/').pop();
                const allSlots = document.querySelectorAll('.slot');
                let matched = false;
                for (const slot of allSlots) {
                    const slotType = slot.dataset.type || slot.getAttribute('onclick')?.match(/selectBlock\('([^']+)'/)?.[1];
                    if (!slotType || slot.id === 'btn-next-page' || slot.id === 'btn-prev-page') continue;
                    const slotImg = slot.querySelector('img');
                    if (!slotImg) continue;
                    const slotSrc = slotImg.getAttribute('src') || '';
                    const slotName = slotSrc.replace(/\.png$/i, '').split('/').pop().toLowerCase();
                    if (slotName === rawName.toLowerCase() || slotType.toLowerCase() === rawName.toLowerCase()) {
                        if (slot.classList.contains('page-2') && currentPage !== 2) switchPage(2);
                        else if (slot.classList.contains('page-1') && currentPage !== 1) switchPage(1);
                        selectBlock(slotType, slot);
                        showToast('Picked: ' + (rawName.charAt(0).toUpperCase() + rawName.slice(1)), './Assets/Blocks/' + rawName + '.png');
                        matched = true;
                        break;
                    }
                }
                if (!matched) showToast('Block not in hotbar!');
            }
            return;
        }
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
        handleInteractionBrushed(img, x, y, z);
        if (!slideToPlace) { isDrawing = false; saveState(); updateMinimap(); }
    };
    img.addEventListener('mouseenter', (e) => {
        if (!isDrawing) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!slideToPlace) return;
        handleInteractionBrushed(img, x, y, z);
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
            '#pointer-settings-overlay[style*="flex"], #about-popup-overlay[style*="flex"], ' +
            '#photo-filters-overlay[style*="flex"]'
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
        handleInteractionBrushed(img, x, y, z);
        saveState();
        updateMinimap();
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
    const VERSION3 = 3;
    bw.write(VERSION3, 4);
    bw.write(cols, 5);
    bw.write(rows, 5);
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
    const cols         = version >= 3 ? br.read(5) : br.read(4);
    const rows         = version >= 3 ? br.read(5) : br.read(4);
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

function generateShareURL() {
    const code = generateIslandCode();
    const url = window.location.origin + window.location.pathname + '#island=' + encodeURIComponent(code);
    history.replaceState(null, '', '#island=' + encodeURIComponent(code));
    navigator.clipboard.writeText(url).then(() => {
        showToast('Share link copied!');
        updateOGTags(code);
    }).catch(() => {
        showToast('Copy: ' + url);
    });
}

function updateOGTags(islandCode) {
    try {
        const ogCanvas = document.createElement('canvas');
        ogCanvas.width = 1200;
        ogCanvas.height = 630;
        const ctx = ogCanvas.getContext('2d');
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, 1200, 630);
        const grad = ctx.createRadialGradient(600, 315, 50, 600, 315, 500);
        grad.addColorStop(0, '#1a3a5c');
        grad.addColorStop(1, '#050d1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 630);
        const tiles = mapContainer.getElementsByClassName('tile');
        const centerX = 600;
        const centerY = 290;
        const size = 12; 
        let minIsoX = Infinity, maxIsoX = -Infinity, minIsoY = Infinity, maxIsoY = -Infinity;
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (t.style.opacity === '0') continue;
            const x = parseInt(t.getAttribute('data-x'));
            const y = parseInt(t.getAttribute('data-y'));
            const z = parseInt(t.getAttribute('data-z'));
            const isoX = (x - y) * (size * 1.5);
            const isoY = (x + y) * (size * 0.75) - (z * 1);
            if (isoX < minIsoX) minIsoX = isoX;
            if (isoX > maxIsoX) maxIsoX = isoX;
            if (isoY < minIsoY) minIsoY = isoY;
            if (isoY > maxIsoY) maxIsoY = isoY;
        }
        const offsetX = minIsoX === Infinity ? 0 : -(minIsoX + maxIsoX) / 2;
        const offsetY = minIsoY === Infinity ? 0 : -(minIsoY + maxIsoY) / 2;
        for (let i = 0; i < tiles.length; i++) {
            const t = tiles[i];
            if (t.style.opacity === '0') continue;
            const x = parseInt(t.getAttribute('data-x'));
            const y = parseInt(t.getAttribute('data-y'));
            const z = parseInt(t.getAttribute('data-z'));
            const color = t.getAttribute('data-color') || '#7ec86a';
            const isoX = (x - y) * (size * 1.5);
            const isoY = (x + y) * (size * 0.75) - (z * 1);
            ctx.fillStyle = color;
            ctx.fillRect(centerX + isoX + offsetX - size/2, centerY + isoY + offsetY - size/2, size, size);
        }
        ctx.fillStyle = '#ffdf80';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Isometric Island', 600, 580);

        ctx.fillStyle = '#a0d4ff';
        ctx.font = '22px monospace';
        ctx.fillText('Click to explore this island!', 600, 610);
        const dataUrl = ogCanvas.toDataURL('image/png');
        const ogImg = document.getElementById('og-image');
        const twImg = document.getElementById('tw-image');
        if (ogImg) ogImg.setAttribute('content', dataUrl);
        if (twImg) twImg.setAttribute('content', dataUrl);

        const shareUrl = window.location.href;
        const ogUrl = document.getElementById('og-url');
        const ogTitle = document.getElementById('og-title');
        const twTitle = document.getElementById('tw-title');
        const ogDesc = document.getElementById('og-description');
        const twDesc = document.getElementById('tw-description');
        if (ogUrl) ogUrl.setAttribute('content', shareUrl);
        if (ogTitle) ogTitle.setAttribute('content', 'My Isometric Island 🏝');
        if (twTitle) twTitle.setAttribute('content', 'My Isometric Island 🏝');
        if (ogDesc) ogDesc.setAttribute('content', 'I built an island! Open the link to explore it in Isometric Island.');
        if (twDesc) twDesc.setAttribute('content', 'I built an island! Open the link to explore it in Isometric Island.');
    } catch(e) {
        console.warn('OG image generation failed:', e);
    }
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
    checkIsland1x1();
    autoSaveSession();
}
const SESSION_ISLAND_KEY = 'ii_session_island';
let _autoSaveTimer = null;
function autoSaveSession() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
        try {
            const code = generateIslandCode();
            localStorage.setItem(SESSION_ISLAND_KEY, code);
        } catch(e) { /* quota full or similar — ignore */ }
    }, 800);
}
function clearSessionIsland() {
    localStorage.removeItem(SESSION_ISLAND_KEY);
}
function getSessionIsland() {
    try { return localStorage.getItem(SESSION_ISLAND_KEY); } catch(e) { return null; }
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
    const scale = getBodyScale();
    const cx = (rect.left + rect.width / 2) / scale;
    const cy = (rect.top + rect.height / 2) / scale;
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

function squashStretchTile(tile) {
    tile.classList.remove('tile-place-anim');
    void tile.offsetWidth;
    tile.classList.add('tile-place-anim');
    tile.addEventListener('animationend', () => tile.classList.remove('tile-place-anim'), { once: true });
}

function checkIsland1x1() {
    const visibleZ0 = Array.from(mapContainer.querySelectorAll('.tile[data-z="0"]'))
        .filter(t => t.style.opacity !== '0');
    if (visibleZ0.length === 1) {
        show1x1Popup();
    }
}

function show1x1Popup() {
    const overlay = document.getElementById('one-by-one-overlay');
    if (!overlay || overlay.style.display === 'flex') return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function close1x1Popup() {
    const overlay = document.getElementById('one-by-one-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 280);
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
                else {
                    t.removeAttribute('data-terraform-group');
                    if (showAirEnabled) {
                        t._airSrcBackup = t.src;
                        t.src = './Assets/Blocks/air.png';
                        t.style.opacity = '1';
                        t._isAirVisible = true;
                    } else {
                        t.style.opacity = '0';
                    }
                }
            });
        } else if (!objId) {
            spawnDestroyParticles(tile);
            if (showAirEnabled) {
                tile._airSrcBackup = tile.src;
                tile.src = './Assets/Blocks/air.png';
                tile.style.opacity = '1';
                tile._isAirVisible = true;
            } else {
                tile.style.opacity = '0';
            }
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
        if (tile._isAirVisible) {
            tile._isAirVisible = false;
            delete tile._airSrcBackup;
        }
        tile.src = `./Assets/Blocks/${selectedBlockType}.png`;
        tile.style.opacity = "1";
        tile.setAttribute('data-color', getBlockColor(selectedBlockType));
        tile.removeAttribute('data-obj-id');
        if (selectedBlockType !== 'eraser') squashStretchTile(tile);
    }
    const grassBlocks = ['dirt', 'flovers', 'rock', 'dirt2', 'crops', 'tree', 'wood', 'leaf'];
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

(function initMinimapZoom() {
    const mc = document.getElementById('minimap-container');
    if (!mc) return;
    let _savedZoom = null;
    let _zoomRaf   = null;

    function animateTo(target) {
        cancelAnimationFrame(_zoomRaf);
        function step() {
            const diff = target - currentZoomPercent;
            if (Math.abs(diff) < 0.005) { currentZoomPercent = target; applyZoom(); return; }
            currentZoomPercent += diff * 0.08;
            applyZoom();
            _zoomRaf = requestAnimationFrame(step);
        }
        _zoomRaf = requestAnimationFrame(step);
    }

    function onPress() { _savedZoom = currentZoomPercent; animateTo(1.0); }
    function onRelease() {
        if (_savedZoom === null) return;
        const t = _savedZoom; _savedZoom = null; animateTo(t);
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
    map.classList.add('island-shaking');
    map.addEventListener('animationend', function onShakeDone() {
        map.classList.remove('island-shaking');
        map.removeEventListener('animationend', onShakeDone);
        mapContainer.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) createTile(x, y, 0, 'dirt', null, frag);
        mapContainer.appendChild(frag);
        saveState(); updateMinimap(); closeSavePopup();
        showToast('Succesfully Deleted!');
    }, { once: true });
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function openConfirmDelete() {
    const overlay = document.getElementById('confirm-delete-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeConfirmDelete() {
    const overlay = document.getElementById('confirm-delete-overlay');
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

function closeAllPopups() {
    const ALL_POPUP_IDS = [
        'confirm-delete-overlay', 'save-popup-overlay', 'music-popup-overlay',
        'float-popup-overlay', 'settings-popup-overlay', 'gui-settings-overlay', 'grid-res-overlay',
        'graphics-settings-overlay', 'about-popup-overlay', 'qr-popup-overlay',
        'block-search-overlay', 'island-biome-overlay', 'mountain-biome-overlay',
        'pointer-settings-overlay', 'fill-overlay', 'welcome-overlay',
        'photo-filters-overlay',
    ];
    ALL_POPUP_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('popup-visible');
        el.style.display = 'none';
    });
}

function confirmDeleteIsland() {
    closeAllPopups();
    setTimeout(() => { deleteIslandWithSnake(); }, 120);
}

function deleteIslandWithSnake() {
    const SIZE = currentIslandCols || 8;
    map.style.transition = 'opacity 0.38s ease, transform 0.38s cubic-bezier(0.4,0,1,1)';
    map.style.opacity = '0';
    map.style.transform = (map.style.transform || '').replace(/translateY\([^)]*\)/g, '').trim() + ' translateY(60px)';

    eraserSound.currentTime = 0; eraserSound.play().catch(e => {});

    setTimeout(() => {
        mapContainer.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                createTile(x, y, 0, 'dirt', null, frag);
            }
        }
        mapContainer.appendChild(frag);
        saveState(); updateMinimap();
        showToast('Succesfully Deleted!');
        hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
        map.style.transition = 'none';
        map.style.transform = (map.style.transform || '').replace(/translateY\([^)]*\)/g, '').trim() + ' translateY(-60px)';
        map.style.opacity = '0';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                map.style.transition = 'opacity 0.42s ease, transform 0.42s cubic-bezier(0.22,1,0.36,1)';
                map.style.opacity = '1';
                map.style.transform = (map.style.transform || '').replace(/translateY\([^)]*\)/g, '').trim();
            });
        });
    }, 420);
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
    { type: 'wood', name: 'Wood' }, { type: 'leaf', name: 'Leaf' },
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
    const z = parseFloat(document.documentElement.style.zoom);
    if (z && z !== 1) return z;
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
            '#fill-panel-close-btn, #fill-selected-btn, #photo-filters-overlay'
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
    if (e.target.closest('#dock-container, #save-popup-overlay, #fill-panel, #fill-overlay, #welcome-overlay, #zoom-ui, #minimap-container, .game-title-container, #radial-menu-overlay, #brush-popup-overlay, #mirror-popup-overlay')) return;
    _radialHoldTimer = setTimeout(() => {
        _radialHoldTimer = null;
        _radialMenuActive = true;
        isRectSelecting = false;
        const selRect = document.getElementById('selection-rect');
        if (selRect) selRect.style.display = 'none';
        showRadialMenu();
    }, 220);

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
    if (_radialMenuActive) {
        isRectSelecting = false;
        const selRect = document.getElementById('selection-rect');
        if (selRect) selRect.style.display = 'none';
        const idx = _getRadialHovered(e.clientX, e.clientY);
        if (idx !== _radialHoveredIdx) { _radialHoveredIdx = idx; _buildRadialSVG(idx); }
        return;
    }
    if (!isRectSelecting) return;
    updateSelectionRectUI(rectStartX, rectStartY, e.clientX, e.clientY);
});

window.addEventListener('mouseup', (e) => {
    if (e.button !== 2) return;
    if (_radialHoldTimer) { clearTimeout(_radialHoldTimer); _radialHoldTimer = null; }
    if (_radialMenuActive) {
        _radialMenuActive = false;
        handleRadialSelect();
        hideRadialMenu();
        isRectSelecting = false;
        e.preventDefault();
        return;
    }
    if (!isRectSelecting) return;
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
    const _hide = () => { if (typeof window.hideCacheLoading === 'function') window.hideCacheLoading(); };
    const _agreedAlready = (function() {
        try { return localStorage.getItem('ii_agreed_v2') === '1'; } catch(_) { return false; }
    })();
    if (!_agreedAlready) {
        if (typeof showAgreementOverlay === 'function') {
            showAgreementOverlay(() => _runInit(true));
        } else {
            _runInit(false);
        }
        return;
    }
    _runInit(false);
    function _runInit(skipSessionRestore) {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    let hashIslandCode = null;
    if (hash && hash.startsWith('#island=')) {
        try {
            hashIslandCode = decodeURIComponent(hash.slice('#island='.length));
        } catch(e) { hashIslandCode = null; }
    }
    if (urlParams.has('embed')) {
        document.body.style.background = '#aad6ff';
        document.body.style.overflow = 'hidden';
        [
            '.game-title-container',
            '#minimap-container',
            '#dock-container',
            '#zoom-ui',
            '#code-bar',
            '#fill-panel',
            '#block-name-display',
            '#save-toast',
            '#welcome-overlay',
            '#save-popup-overlay',
            '#settings-popup-overlay',
            '#community-overlay',
            '#float-popup-overlay',
            '#music-popup-overlay',
            '#embed-popup-overlay',
            '#confirm-delete-overlay',
            '#load-popup-overlay',
            '#island-biome-overlay',
            '#mountain-biome-overlay',
            '#qr-popup-overlay',
            '#gui-settings-overlay',
            '#pointer-settings-overlay',
            '#graphics-settings-overlay',
            '#photo-filters-overlay',
            '#block-search-overlay',
            '#block-search-wrapper',
            '#weather-canvas',
        ].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.setProperty('display', 'none', 'important');
            });
        });
        const stage = document.getElementById('stage');
        if (stage) {
            stage.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;';
        }
        const map = document.getElementById('map');
        if (map) map.style.pointerEvents = 'none';
        const silent = { play(){ return Promise.resolve(); }, pause(){}, get currentTime(){ return 0; }, set currentTime(_){}, get loop(){ return false; }, set loop(_){}, get src(){ return ''; } };
        window._placeSound = silent;
        window._grassSound = silent;
        window._pclsSound  = silent;
        window._bgMusic    = silent;
        window._eraserSound= silent;
        if (typeof hotbarSound !== 'undefined') {
            try { hotbarSound.volume = 0; } catch(_){}
        }
        if (typeof weatherAnimFrame !== 'undefined' && weatherAnimFrame) {
            cancelAnimationFrame(weatherAnimFrame);
        }
        window._origSetClimate = window.setClimate;
        window.setClimate = function(mode) {
            currentClimate = mode;
            document.body.style.background = '#aad6ff';
        };
        currentZoomPercent = 0.10;
        applyZoom();
        panY = window.innerHeight * 0.15;
        applyZoom();
        saveState();
        const islandCode = urlParams.get('island');
        if (islandCode) {
            try {
                loadIslandCode(decodeURIComponent(islandCode));
                updateMinimap();
            } catch(e) { console.warn('Embed load error:', e); }
        }
        _hide();
        return;
    }
    applyZoom();
    const firstSlot = document.getElementById('slot-eraser');
    lastSelectedSlotP1 = firstSlot;
    selectBlock('eraser', firstSlot, true);
    saveState();
    updateMinimap();
    if (hashIslandCode) {
        try {
            const loaded = loadIslandCode(hashIslandCode);
            if (loaded) {
                updateMinimap();
                _hide();
                showToast('Island loaded from link!');
                return;
            } else {
                _hide();
                if (typeof window.showNotFound === 'function') {
                    window.showNotFound(window.location.hash.slice(1));
                }
                return;
            }
        } catch(e) {
            console.warn('Hash island load error:', e);
            _hide();
            if (typeof window.showNotFound === 'function') {
                window.showNotFound(window.location.hash.slice(1));
            }
            return;
        }
    }
    if (window.location.hash && window.location.hash.length > 1 && !window.location.hash.startsWith('#island=')) {
        _hide();
        if (typeof window.showNotFound === 'function') {
            window.showNotFound(window.location.hash.slice(1));
        }
        return;
    }
    const sessionCode = !skipSessionRestore && getSessionIsland();
    if (sessionCode) {
        try {
            const restored = loadIslandCode(sessionCode);
            if (restored) {
                updateMinimap();
                _hide();
                showToast('Island Restored from the last sesion.');
                return;
            }
        } catch(e) {
            console.warn('Session restore error:', e);
        }
    }

    _hide();
    function _showWelcome() {
        const ov = document.getElementById('welcome-overlay');
        ov.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
        fetchReadme();
    }
    _showWelcome();
    }
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
const SHAPE_GRID_MAX = 16;

function buildShapeGrid() {
    const grid = document.getElementById('island-shape-grid');
    grid.innerHTML = '';
    const cellPx = 22;
    grid.style.gridTemplateColumns = `repeat(${SHAPE_GRID_MAX}, ${cellPx}px)`;
    for (let r = 1; r <= SHAPE_GRID_MAX; r++) {
        for (let c = 1; c <= SHAPE_GRID_MAX; c++) {
            const cell = document.createElement('div');
            cell.className = 'shape-cell shape-cell-sm';
            cell.dataset.r = r; cell.dataset.c = c;
            cell.addEventListener('mouseover', () => hoverShapeCell(r, c));
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
    const cur = document.getElementById('grid-res-current');
    if (cur) cur.textContent = currentIslandCols + ' x ' + currentIslandRows;
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
    closeGridResPopup();
}


function applyCirclePreset(size) {
    const rows = size, cols = size;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const r  = (Math.min(cols, rows) / 2) - 0.5;
    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) { t.remove(); return; }
        if (parseInt(t.getAttribute('data-z')) === 0) {
            const dx = tx - cx, dy = ty - cy;
            if (dx*dx + dy*dy > r*r) t.remove();
        }
    });

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const dx = x - cx, dy = y - cy;
            if (dx*dx + dy*dy <= r*r) {
                if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`))
                    createTile(x, y, 0, 'dirt', null, frag);
            }
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Circle ' + cols + 'x' + rows + '!');
    closeSavePopup();
    closeGridResPopup();
}

buildShapeGrid();

function applyDonutPreset(size, holeR) {
    const rows = size, cols = size;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const outerR = (Math.min(cols, rows) / 2) - 0.5;
    const innerR = holeR;

    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) { t.remove(); return; }
        if (parseInt(t.getAttribute('data-z')) === 0) {
            const dx = tx - cx, dy = ty - cy;
            const d2 = dx*dx + dy*dy;
            if (d2 > outerR*outerR || d2 < innerR*innerR) t.remove();
        }
    });

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const dx = x - cx, dy = y - cy;
            const d2 = dx*dx + dy*dy;
            if (d2 <= outerR*outerR && d2 >= innerR*innerR) {
                if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`))
                    createTile(x, y, 0, 'dirt', null, frag);
            }
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Donut ' + cols + 'x' + rows + '!');
    closeSavePopup(); closeGridResPopup(); closeSettingsPopup();
}

function applyDiamondPreset(size) {
    const rows = size, cols = size;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const r = cx - 0.5;

    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) { t.remove(); return; }
        if (parseInt(t.getAttribute('data-z')) === 0) {
            const dx = Math.abs(tx - cx), dy = Math.abs(ty - cy);
            if (dx + dy > r) t.remove();
        }
    });

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
            if (dx + dy <= r) {
                if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`))
                    createTile(x, y, 0, 'dirt', null, frag);
            }
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Diamond ' + cols + 'x' + rows + '!');
    closeSavePopup(); closeGridResPopup(); closeSettingsPopup();
}
function applyCrossPreset(size) {
    const rows = size, cols = size;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const armW = Math.floor(size / 3);

    const inCross = (x, y) => {
        const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
        return dx <= armW || dy <= armW;
    };

    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) { t.remove(); return; }
        if (parseInt(t.getAttribute('data-z')) === 0) {
            if (!inCross(tx, ty)) t.remove();
        }
    });

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (inCross(x, y)) {
                if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`))
                    createTile(x, y, 0, 'dirt', null, frag);
            }
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Cross ' + cols + 'x' + rows + '!');
    closeSavePopup(); closeGridResPopup(); closeSettingsPopup();
}

function applyStarPreset(size) {
    const rows = size, cols = size;
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const outerR = cx - 0.2;
    const innerR = outerR * 0.42;
    const points = 5;

    const inStar = (x, y) => {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > outerR + 0.5) return false;
        const angle = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        const sectorAngle = (angle % (Math.PI * 2 / points)) / (Math.PI * 2 / points);
        const edgeR = sectorAngle < 0.5
            ? innerR + (outerR - innerR) * (sectorAngle * 2)
            : innerR + (outerR - innerR) * ((1 - sectorAngle) * 2);
        return dist <= edgeR + 0.7;
    };

    Array.from(mapContainer.getElementsByClassName('tile')).forEach(t => {
        const tx = parseInt(t.getAttribute('data-x'));
        const ty = parseInt(t.getAttribute('data-y'));
        if (tx >= cols || ty >= rows) { t.remove(); return; }
        if (parseInt(t.getAttribute('data-z')) === 0) {
            if (!inStar(tx, ty)) t.remove();
        }
    });

    const frag = document.createDocumentFragment();
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (inStar(x, y)) {
                if (!mapContainer.querySelector(`.tile[data-x="${x}"][data-y="${y}"][data-z="0"]`))
                    createTile(x, y, 0, 'dirt', null, frag);
            }
        }
    }
    mapContainer.appendChild(frag);
    currentIslandCols = cols; currentIslandRows = rows;
    saveState(); refreshShapeGrid();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    showToast('Star ' + cols + 'x' + rows + '!');
    closeSavePopup(); closeGridResPopup(); closeSettingsPopup();
}

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

function openGridResPopup() {
    const overlay = document.getElementById('grid-res-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    refreshShapeGrid();
}
function closeGridResPopup() {
    const overlay = document.getElementById('grid-res-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
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
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
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
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
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

function openFunPopup() {
    const ov = document.getElementById('fun-popup-overlay');
    if (!ov) return;
    ov.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
}
function closeFunPopup() {
    const ov = document.getElementById('fun-popup-overlay');
    if (!ov) return;
    ov.classList.remove('popup-visible');
    setTimeout(() => { ov.style.display = 'none'; }, 320);
}

const _EMOJI_BASE = {
    dirt:'🟫', dirt2:'🟫', ShovedDirt:'🟫',
    sand:'🟡', redsand:'🟠',
    stone:'⬜', mossystone:'🟩', rock:'🔘',
    snow:'❄️', ice:'🧊', snowrocks:'🩶',
    water:'🌊',
    flovers:'🌸', crops:'🌾',
    melon:'🍈', Hay:'🌾', pumpkin:'🎃',
};
const _EMOJI_OBJ = {
    tree:'🌲', snowed_tree:'🎄', leaf:'🍃', snow2:'❄️',
    wood:'🪵', snowman:'⛄',
    melon:'🍈', Hay:'🌾', pumpkin:'🎃', crops:'🌾', flovers:'🌸',
    rock:'🪨', mossystone:'🟩',
};

function openIslandEmojiPopup() {
    const ov = document.getElementById('island-emoji-overlay');
    if (!ov) return;
    generateIslandEmoji();
    ov.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
}
function closeIslandEmojiPopup() {
    const ov = document.getElementById('island-emoji-overlay');
    if (!ov) return;
    ov.classList.remove('popup-visible');
    setTimeout(() => { ov.style.display = 'none'; }, 320);
}
function generateIslandEmoji() {
    const tiles = mapContainer.querySelectorAll('.tile[data-x][data-y][data-z]');
    const gridEl = document.getElementById('island-emoji-grid');
    if (!tiles.length) { gridEl.textContent = '⬛ no tiles'; return; }
    function tileType(t) {
        const src = t.getAttribute('src') || '';
        const m = src.match(/\/Blocks\/(?:[^/]+\/)?([^/]+?)\.png/i);
        return m ? m[1] : '';
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const base = {}, obj = {};
    tiles.forEach(t => {
        if (t.style.opacity === '0') return;
        const x = +t.dataset.x, y = +t.dataset.y, z = +t.dataset.z;
        const type = tileType(t);
        if (z === 0) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            if (!base[y]) base[y] = {};
            base[y][x] = type;
        } else {
            if (!obj[y]) obj[y] = {};
            if (type) obj[y][x] = type;
        }
    });
    if (minX === Infinity) { gridEl.textContent = '⬛ empty island'; return; }

    const rows = [];
    for (let y = minY; y <= maxY; y++) {
        let row = '';
        for (let x = minX; x <= maxX; x++) {
            const b = base[y] && base[y][x];
            const o = obj[y] && obj[y][x];
            if (!b) { row += '⬛'; continue; }
            row += (o && _EMOJI_OBJ[o]) ? _EMOJI_OBJ[o] : (_EMOJI_BASE[b] || '🟫');
        }
        rows.push(row);
    }
    gridEl.textContent = rows.join('\n');
}
function copyIslandEmoji() {
    const text = document.getElementById('island-emoji-grid').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('Emoji island copied! 🏝️'));
}

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
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
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
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}
function selectMountainBiome(idx) {
    closeMountainBiomePopup();
    closeSavePopup();
    setTimeout(() => { generateMountain(idx < 0 ? undefined : idx); }, 270);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window._activeRadialTool) {
            _radialToolCleanup();
            window._activeRadialTool = null;
            showToast('Tool disabled');
            return;
        }
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
    const swTrail = document.getElementById('sw-cursor-trail');
    if (swTrail) swTrail.classList.toggle('on', !!window._cursorTrailEnabled);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closePointerSettings() {
    const overlay = document.getElementById('pointer-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
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
            '#about-popup-overlay, #fill-overlay, #graphics-settings-overlay, #photo-filters-overlay'
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
        var s = getBodyScale();
        el.style.transform = 'translate(' + (e.clientX / s + 14) + 'px,' + (e.clientY / s + 14) + 'px)';
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
(function initCursorTrail() {
    const COLORS = ['#ffdf80', '#ffd060', '#ffc040', '#e8a020', '#c47010'];
    const MAX_PARTICLES = 28;
    let particles = [];
    let animId = null;
    let mouseX = 0, mouseY = 0;
    let isOverStage = false;
    const trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'cursor-trail-canvas';
    trailCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483640;';
    document.body.appendChild(trailCanvas);
    const ctx = trailCanvas.getContext('2d');

    function resize() {
        trailCanvas.width  = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    function spawnParticle(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 1.2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.6,
            size: 2 + Math.random() * 3,
            life: 1,
            decay: 0.045 + Math.random() * 0.035,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
        if (particles.length > MAX_PARTICLES) particles.shift();
    }

    function loop() {
        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= p.decay;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            ctx.globalAlpha = p.life * p.life;
            ctx.fillStyle = p.color;
            const s = p.size * p.life;
            ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s));
        }
        ctx.globalAlpha = 1;
        if (particles.length > 0) {
            animId = requestAnimationFrame(loop);
        } else {
            animId = null;
        }
    }

    let spawnThrottle = 0;
    document.addEventListener('mousemove', function(e) {
        if (!window._cursorTrailEnabled) return;
        const stage = document.getElementById('stage');
        if (!stage) return;
        const r = stage.getBoundingClientRect();
        isOverStage = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!isOverStage) return;
        mouseX = e.clientX;
        mouseY = e.clientY;
        spawnThrottle++;
        if (spawnThrottle % 2 !== 0) return; 
        spawnParticle(mouseX, mouseY);
        if (!animId) animId = requestAnimationFrame(loop);
    }, { passive: true });
    window._cursorTrailEnabled = localStorage.getItem('cursorTrail') === 'on';
})();

function toggleCursorTrail(btn) {
    window._cursorTrailEnabled = !window._cursorTrailEnabled;
    btn.classList.toggle('on', window._cursorTrailEnabled);
    localStorage.setItem('cursorTrail', window._cursorTrailEnabled ? 'on' : 'off');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
const BLOCK_NAMES_RO = {
    'dirt':         'Grass',
    'dirt2':        'Dirt',
    'ShovedDirt':   'Shoveled Dirt',
    'flovers':      'Flowers',
    'rock':         'Rock',
    'crops':        'Crops',
    'stone':        'Stone',
    'mossystone':   'Mossy Stone',
    'sand':         'Sand',
    'redsand':      'Red Sand',
    'water':        'Water',
    'snow':         'Snow',
    'snowrocks':    'Snow Rocks',
    'ice':          'Ice',
    'pumpkin':      'Pumpkin',
    'Hay':          'Haystack',
    'melon':        'Melon',
    'tree':         'Tree',
    'snowed_tree':  'Snowy Tree',
    'snowman':      'Snowman',
    'wood':         'Wood',
    'leaf':         'Leaves',
    'snow2':        'Snow Leaves',
    'snowmanb1':    'Snowman Body',
    'snowmanb2':    'Snowman Mid',
    'SnowmanHead':  'Snowman Head',
    'eraser':       'Eraser',
};

function getBlockNameRo(src) {
    const marker = 'Assets/Blocks/';
    const mi = src.indexOf(marker);
    const raw = (mi !== -1 ? src.slice(mi + marker.length) : src)
        .replace(/\.png$/i, '')
        .split('/')
        .pop();
    return BLOCK_NAMES_RO[raw] || (raw.charAt(0).toUpperCase() + raw.slice(1));
}

function openAnalyticsPopup() {
    const overlay = document.getElementById('analytics-popup-overlay');
    if (!overlay) return;

    const tiles = mapContainer.getElementsByClassName('tile');
    const counts = {};
    let total = 0;
    let maxZ = 0;

    for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (t.style.opacity === '0') continue;
        const z = parseInt(t.getAttribute('data-z') || '0');
        if (z > maxZ) maxZ = z;
        const src = t.src || '';
        const marker = 'Assets/Blocks/';
        const mi = src.indexOf(marker);
        const raw = (mi !== -1 ? src.slice(mi + marker.length) : src)
            .replace(/\.png$/i, '')
            .split('/')
            .pop();
        if (raw.startsWith('falling') || raw === 'eraser') continue;
        counts[raw] = (counts[raw] || 0) + 1;
        total++;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    document.getElementById('analytics-total').textContent = total;
    document.getElementById('analytics-types').textContent = sorted.length;
    document.getElementById('analytics-layers').textContent = maxZ + 1;

    const list = document.getElementById('analytics-list');
    list.innerHTML = '';

    if (sorted.length === 0) {
        list.innerHTML = '<div style="color:var(--gui-text-dim);font-size:7px;text-align:center;padding:16px;">No blocks placed yet!</div>';
    } else {
        const maxCount = sorted[0][1];
        sorted.forEach(([raw, count]) => {
            const name = BLOCK_NAMES_RO[raw] || (raw.charAt(0).toUpperCase() + raw.slice(1));
            const pct = Math.round((count / total) * 100);
            const barW = Math.max(4, Math.round((count / maxCount) * 100));
            const row = document.createElement('div');
            row.className = 'analytics-row';
            row.innerHTML = `
                <img class="analytics-icon" src="./Assets/Blocks/${raw}.png" onerror="this.style.display='none'">
                <div class="analytics-info">
                    <div class="analytics-name">${name}</div>
                    <div class="analytics-bar-wrap">
                        <div class="analytics-bar" style="width:${barW}%"></div>
                    </div>
                </div>
                <div class="analytics-count">${count}<span class="analytics-pct">&nbsp;(${pct}%)</span></div>
            `;
            list.appendChild(row);
        });
    }

    if (typeof closeSavePopup === 'function') closeSavePopup();
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}

function closeAnalyticsPopup() {
    const overlay = document.getElementById('analytics-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 350);
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
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
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
    const swA = document.getElementById('sw-show-air');
    if (swA) swA.classList.toggle('on', !!saved.showAir);
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
}
function closeGraphicsSettings() {
    const overlay = document.getElementById('graphics-settings-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
    setTimeout(() => { overlay.style.display = 'none'; }, 260);
}


window._blockParticlesEnabled = localStorage.getItem('blockParticles') !== 'off';

(function initPhotoFilters() {
    const FILTERS = {
        none:    '',
        gameboy: 'brightness(1.05) contrast(1.1) saturate(0) sepia(0.15) hue-rotate(80deg)',
        crt:     'contrast(1.25) brightness(0.88) saturate(1.1)',
        sepia:   'sepia(0.85) brightness(1.05) contrast(1.05)',
        hc:      'contrast(2.2) brightness(1.1) saturate(1.3)',
    };

    const TINTS = {
        none:    '',
        gameboy: 'rgba(15,56,15,0.18)',
        crt:     'rgba(0,255,80,0.06)',
        sepia:   '',
        hc:      '',
    };

    let overlay = null;

    function getOverlay() {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'photo-filter-tint';
            overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;transition:background 0.3s;';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function getCRTOverlay() {
        let el = document.getElementById('photo-filter-crt');
        if (!el) {
            el = document.createElement('div');
            el.id = 'photo-filter-crt';
            document.body.appendChild(el);
        }
        return el;
    }

    function applyFilter(name) {
        const stage = document.getElementById('stage');
        const map = document.getElementById('map');
        const weatherCanvas = document.getElementById('weather-canvas');
        const f = FILTERS[name] || '';
        if (stage)  stage.style.filter  = f;
        if (map)    map.style.filter    = f;
        if (weatherCanvas) weatherCanvas.style.filter = f;
        const tintEl = getOverlay();
        tintEl.style.background = TINTS[name] || '';
        const crtEl = getCRTOverlay();
        crtEl.style.display = name === 'crt' ? 'block' : 'none';
        if (name === 'gameboy') {
            document.documentElement.style.setProperty('--pf-gameboy', '1');
        } else {
            document.documentElement.style.removeProperty('--pf-gameboy');
        }
    }

    function syncCards(name) {
        ['none','gameboy','crt','sepia','hc'].forEach(k => {
            const c = document.getElementById('pfcard-' + k);
            if (c) c.classList.toggle('active', k === name);
        });
    }

    window._currentPhotoFilter = localStorage.getItem('photoFilter') || 'none';
    applyFilter(window._currentPhotoFilter);

    window.setPhotoFilter = function(name) {
        window._currentPhotoFilter = name;
        localStorage.setItem('photoFilter', name);
        applyFilter(name);
        syncCards(name);
        hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    };

    window.openPhotoFilters = function() {
        const ovl = document.getElementById('photo-filters-overlay');
        if (!ovl) return;
        syncCards(window._currentPhotoFilter);
        ovl.style.display = 'flex';
        requestAnimationFrame(() => ovl.classList.add('popup-visible'));
        hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    };

    window.closePhotoFilters = function() {
        const ovl = document.getElementById('photo-filters-overlay');
        if (!ovl) return;
        ovl.classList.remove('popup-visible');
        pclsSound.currentTime = 0; pclsSound.play().catch(e => {});
        setTimeout(() => { ovl.style.display = 'none'; }, 260);
    };
})();

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
(function() {
    let titleClickCount = 0;
    let titleClickTimer = null;

    window.handleTitleClick = function() {
        titleClickCount++;
        clearTimeout(titleClickTimer);
        titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 2000);

        if (titleClickCount >= 10) {
            titleClickCount = 0;
            clearTimeout(titleClickTimer);
            launchConfetti();
        }
    };

    function launchConfetti() {
        const COLORS = ['#ff595e','#ffca3a','#6a4c93','#1982c4','#8ac926','#ff924c','#ff6b9d','#c77dff','#4cc9f0','#f72585'];
        const SHAPES = ['square','circle','strip'];
        const COUNT = 140;
        const title = document.getElementById('game-title-el');
        const rect = title ? title.getBoundingClientRect() : { left: window.innerWidth/2, top: 60, width: 0 };
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        for (let i = 0; i < COUNT; i++) {
            const p = document.createElement('div');
            const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const size  = 6 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 280;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 200 - Math.random() * 150;
            const rot = Math.random() * 720 - 360;
            p.style.cssText = [
                'position:fixed',
                'pointer-events:none',
                'z-index:2147483647',
                `background:${color}`,
                `width:${shape === 'strip' ? Math.round(size*0.4)+'px' : size+'px'}`,
                `height:${shape === 'strip' ? size*2.5+'px' : size+'px'}`,
                shape === 'circle' ? 'border-radius:50%' : '',
                `left:${originX - size/2}px`,
                `top:${originY - size/2}px`,
                'opacity:1',
            ].join(';');
            document.body.appendChild(p);

            let startTime = null;
            const duration = 900 + Math.random() * 600;
            const gravity = 320;
            (function animate(ts) {
                if (!startTime) startTime = ts;
                const t = (ts - startTime) / duration;
                if (t >= 1) { p.remove(); return; }
                p.style.left = (originX - size/2 + vx * t) + 'px';
                p.style.top  = (originY - size/2 + vy * t + 0.5 * gravity * t * t) + 'px';
                p.style.opacity = Math.max(0, 1 - t * 1.1);
                p.style.transform = `rotate(${rot * t}deg)`;
                requestAnimationFrame(animate);
            })(performance.now());
        }
        if (title) {
            title.style.transition = 'color 0.15s';
            const orig = title.style.color || '';
            title.style.color = '#ffca3a';
            setTimeout(() => { title.style.color = orig; title.style.transition = ''; }, 400);
        }
        hotbarSound.currentTime = 0; hotbarSound.play().catch(e => {});
    }
})();
let _radialHoldTimer = null;
let _radialMenuActive = false;
let _radialHoveredIdx = -1;
let _currentBrushSize = 1;
let _currentMirrorMode = 'off';
let _presentationMode = false;

function togglePresentationMode() {
    _presentationMode = !_presentationMode;
    document.body.classList.toggle('presentation-mode', _presentationMode);
    showToast(_presentationMode ? 'Presentation ON' : 'Presentation OFF');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
}

const _RADIAL_ITEMS = [
    { icon: '', label: ['BRUSH', 'SIZE'],  action: 'brush'  },
    { icon: '',  label: ['MIRROR', 'MODE'], action: 'mirror' },
    { icon: '',  label: ['GRID',  'OVERLAY'], action: 'grid' },
    { icon: '',  label: ['SETTINGS'], action: 'settings' },
    { icon: '',  label: ['PRESENT', 'MODE'], action: 'presentation' },
    { icon: '', label: ['MAGIC', 'WAND'],   action: 'magic_wand'   },
    { icon: '', label: ['TERRA', 'FORM'],   action: 'terraform'    },
    { icon: '', label: ['LINE', 'TOOL'],    action: 'line_tool'    },
    { icon: '', label: ['CIRCLE', 'TOOL'],  action: 'circle_tool'  },
];

function _getThemeColor(varName, fallback) {
    return getComputedStyle(document.body).getPropertyValue(varName).trim() || fallback;
}
function _buildRadialSVG(hovIdx) {
    const svg    = document.getElementById('radial-svg');
    const labels = document.getElementById('radial-labels');
    if (!svg || !labels) return;
    labels.innerHTML = '';
    const clrBg     = _getThemeColor('--gui-bg-dark',  '#1e1006');
    const clrBorder = _getThemeColor('--gui-border',   '#4a2808');
    const clrAccent = _getThemeColor('--gui-accent',   '#ffdf80');
    const clrActive = _getThemeColor('--gui-active',   '#6b4726');
    const clrAccBrd = _getThemeColor('--gui-shadow',   '#b8860b');

    const cx = 150, cy = 150, outerR = 128, innerR = 60;
    const n = _RADIAL_ITEMS.length;
    const gapDeg = 8;
    const sliceDeg = 360 / n - gapDeg;
    const PX = 4;
    let rects = '';

    for (let i = 0; i < n; i++) {
        const startDeg = i * (360 / n) - 90 + gapDeg / 2;
        const hov = i === hovIdx;
        const gridActive = _RADIAL_ITEMS[i].action === 'grid' && gridOverlayEnabled;
        const presActive = _RADIAL_ITEMS[i].action === 'presentation' && _presentationMode;
        const toolActive = ['magic_wand','terraform','line_tool','circle_tool'].includes(_RADIAL_ITEMS[i].action) && window._activeRadialTool === _RADIAL_ITEMS[i].action;
        const fill   = hov ? clrAccent : (gridActive || presActive || toolActive ? clrActive : clrBg);
        const border = hov ? clrAccBrd : clrBorder;

        const steps = 72;
        for (let s = 0; s <= steps; s++) {
            const deg = startDeg + s * (sliceDeg / steps);
            const rad = deg * Math.PI / 180;
            const radSteps = Math.ceil((outerR - innerR) / PX);
            for (let r = 0; r < radSteps; r++) {
                const radius = innerR + r * PX + PX / 2;
                const px = cx + Math.cos(rad) * radius;
                const py = cy + Math.sin(rad) * radius;
                const sx = Math.round((px - PX / 2) / PX) * PX;
                const sy = Math.round((py - PX / 2) / PX) * PX;
                rects += `<rect x="${sx}" y="${sy}" width="${PX}" height="${PX}" fill="${fill}"/>`;
            }
        }
        for (let s = 0; s <= steps; s++) {
            const deg = startDeg + s * (sliceDeg / steps);
            const rad = deg * Math.PI / 180;
            for (const R of [outerR, innerR]) {
                const px = cx + Math.cos(rad) * R;
                const py = cy + Math.sin(rad) * R;
                const sx = Math.round((px - PX / 2) / PX) * PX;
                const sy = Math.round((py - PX / 2) / PX) * PX;
                rects += `<rect x="${sx}" y="${sy}" width="${PX}" height="${PX}" fill="${border}"/>`;
            }
        }
        const midRad = (startDeg + sliceDeg / 2) * Math.PI / 180;
        const lr = (outerR + innerR) / 2;
        const lx = cx + Math.cos(midRad) * lr;
        const ly = cy + Math.sin(midRad) * lr;

        const el = document.createElement('div');
        let labelClass = 'radial-label';
        if (hov) labelClass += ' radial-label-hov';
        else if (gridActive || presActive || toolActive) labelClass += ' radial-label-active';
        el.className = labelClass;
        el.style.cssText = `left:${lx}px;top:${ly}px;`;

        const ico = document.createElement('span');
        ico.className = 'radial-ico';
        ico.textContent = _RADIAL_ITEMS[i].icon;
        el.appendChild(ico);
        _RADIAL_ITEMS[i].label.forEach(line => {
            const s = document.createElement('span');
            s.style.display = 'block';
            s.textContent = line;
            el.appendChild(s);
        });
        labels.appendChild(el);
    }
    const dotSize = 6;
    rects += `<rect x="${cx - dotSize}" y="${cy - 1}" width="${dotSize * 2}" height="2" fill="${clrAccent}"/>`;
    rects += `<rect x="${cx - 1}" y="${cy - dotSize}" width="2" height="${dotSize * 2}" fill="${clrAccent}"/>`;

    svg.innerHTML = rects;
}

function _getRadialHovered(mx, my) {
    const menu = document.getElementById('radial-menu');
    if (!menu) return -1;
    const rect = menu.getBoundingClientRect();
    const scale = rect.width / 300;
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outerR = 128 * scale, innerR = 60 * scale;
    if (dist < innerR || dist > outerR) return -1;
    const n = _RADIAL_ITEMS.length;
    let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (ang < 0) ang += 360;
    return Math.min(Math.floor(ang / (360 / n)), n - 1);
}

function showRadialMenu() {
    const ov = document.getElementById('radial-menu-overlay');
    if (!ov) return;
    _radialHoveredIdx = -1;
    _buildRadialSVG(-1);
    ov.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('radial-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
}

function hideRadialMenu() {
    const ov = document.getElementById('radial-menu-overlay');
    if (!ov) return;
    ov.classList.remove('radial-visible');
    setTimeout(() => { ov.style.display = 'none'; }, 220);
}

function handleRadialSelect() {
    if (_radialHoveredIdx < 0) return;
    const action = _RADIAL_ITEMS[_radialHoveredIdx].action;
    if (action === 'brush')        openBrushPopup();
    if (action === 'mirror')       openMirrorPopup();
    if (action === 'grid')         _toggleRadialGrid();
    if (action === 'settings')     openSettingsPopup();
    if (action === 'presentation') togglePresentationMode();
    if (action === 'magic_wand')   _activateRadialTool('magic_wand');
    if (action === 'terraform')    _activateRadialTool('terraform');
    if (action === 'line_tool')    _activateRadialTool('line_tool');
    if (action === 'circle_tool')  _activateRadialTool('circle_tool');
}

function _toggleRadialGrid() {
    const sw = document.getElementById('sw-grid');
    if (sw) {
        toggleVisualOption('gridOverlay', sw);
    } else {
        gridOverlayEnabled = !gridOverlayEnabled;
        applyGridOverlay(gridOverlayEnabled);
    }
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
    showToast(gridOverlayEnabled ? 'Grid ON' : 'Grid OFF');
}
window._activeRadialTool = null;

function _activateRadialTool(tool) {
    if (window._activeRadialTool === tool) {
        window._activeRadialTool = null;
        _radialToolCleanup();
        showToast('Tool disabled');
        return;
    }
    _radialToolCleanup();
    window._activeRadialTool = tool;
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
    const names = { magic_wand: 'Magic Wand', terraform: 'Terraforming', line_tool: 'Line Tool', circle_tool: 'Circle Tool' };
    showToast(names[tool] + ' active');
    _radialToolSetup(tool);
}

function _radialToolCleanup() {
    document.body.classList.remove('tool-line-active','tool-circle-active','tool-magic-active','tool-terraform-active');
    window._lineToolStart = null;
    window._circleToolStart = null;
    const prev = document.getElementById('_tool-preview');
    if (prev) prev.remove();
}

function _radialToolSetup(tool) {
    if (tool === 'magic_wand')  document.body.classList.add('tool-magic-active');
    if (tool === 'terraform')   document.body.classList.add('tool-terraform-active');
    if (tool === 'line_tool')   document.body.classList.add('tool-line-active');
    if (tool === 'circle_tool') document.body.classList.add('tool-circle-active');
}
function _magicWandSelect(startTile) {
    const sx = parseInt(startTile.getAttribute('data-x'));
    const sy = parseInt(startTile.getAttribute('data-y'));
    const sz = parseInt(startTile.getAttribute('data-z'));
    const targetSrc = startTile.src;
    if (!targetSrc || startTile.style.opacity === '0') return;
    const cols = currentIslandCols || 8;
    const rows = currentIslandRows || 8;
    const visited = new Set();
    const queue = [[sx, sy]];
    visited.add(sx + ',' + sy);

    while (queue.length) {
        const [cx, cy] = queue.shift();
        const t = mapContainer.querySelector(`.tile[data-x="${cx}"][data-y="${cy}"][data-z="${sz}"]`);
        if (!t || t.style.opacity === '0') continue;
        const tBase = t.src.split('/').pop();
        const sBase = targetSrc.split('/').pop();
        if (tBase !== sBase) continue;
        selectedTiles.add(t);
        t.classList.add('selected-tile');
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !visited.has(nx+','+ny)) {
                visited.add(nx+','+ny);
                queue.push([nx, ny]);
            }
        }
    }
    if (typeof drawSelectionCanvas === 'function') drawSelectionCanvas();
    if (typeof updateFillButton === 'function') updateFillButton();
    showToast('Selected: ' + selectedTiles.size + ' tiles');
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
}
let _terraformStartY = null;
let _terraformTile   = null;
let _terraformLastDelta = 0;

function _terraformStart(tile, clientY) {
    _terraformTile = tile;
    _terraformStartY = clientY;
    _terraformLastDelta = 0;
}

function _terraformMove(clientY) {
    if (!_terraformTile || _terraformStartY === null) return;
    const dy = _terraformStartY - clientY; 
    const steps = Math.floor(dy / 20);
    if (steps === _terraformLastDelta) return;
    const diff = steps - _terraformLastDelta;
    _terraformLastDelta = steps;
    _terraformApply(_terraformTile, diff);
}

function _terraformEnd() {
    if (_terraformTile) { saveState(); updateMinimap(); }
    _terraformTile = null;
    _terraformStartY = null;
    _terraformLastDelta = 0;
}

function _terraformApply(tile, delta) {
    const x = parseInt(tile.getAttribute('data-x'));
    const y = parseInt(tile.getAttribute('data-y'));
    const z = parseInt(tile.getAttribute('data-z'));
    const newZ = Math.max(0, z + delta);
    if (newZ === z) return;
    const col = Array.from(mapContainer.querySelectorAll(`.tile[data-x="${x}"][data-y="${y}"]`));
    col.forEach(t => {
        const tz = parseInt(t.getAttribute('data-z'));
        const nz = Math.max(0, tz + delta);
        t.setAttribute('data-z', nz);
        const posTop = (x + y) * (TILE_H / 2) - (nz * TILE_H);
        t.style.top  = posTop + 'px';
        t.setAttribute('data-pos-top', posTop);
        t.style.zIndex = (x + y) + nz;
    });
    showToast('Z: ' + (z + delta));
}
window._lineToolStart = null;

function _lineToolClick(tile) {
    const x = parseInt(tile.getAttribute('data-x'));
    const y = parseInt(tile.getAttribute('data-y'));
    const z = parseInt(tile.getAttribute('data-z'));

    if (!window._lineToolStart) {
        window._lineToolStart = { x, y, z };
        showToast('Line point started');
        tile.classList.add('selected-tile');
        return;
    }
    const { x: x0, y: y0, z: z0 } = window._lineToolStart;
    const pts = _bresenham(x0, y0, x, y);
    saveState();
    pts.forEach(([px, py]) => {
        const t = mapContainer.querySelector(`.tile[data-x="${px}"][data-y="${py}"][data-z="${z0}"]`);
        if (t) handleInteraction(t, px, py, z0);
    });
    window._lineToolStart = null;
    updateMinimap();
    showToast('Line Placed! (' + pts.length + ' tile-uri)');
    selectedTiles.forEach(t => t.classList.remove('selected-tile'));
    selectedTiles.clear();
}

function _bresenham(x0, y0, x1, y1) {
    const pts = [];
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let cx = x0, cy = y0;
    while (true) {
        pts.push([cx, cy]);
        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 <  dx) { err += dx; cy += sy; }
    }
    return pts;
}

window._circleToolStart = null;
function _circleToolClick(tile) {
    const x = parseInt(tile.getAttribute('data-x'));
    const y = parseInt(tile.getAttribute('data-y'));
    const z = parseInt(tile.getAttribute('data-z'));

    if (!window._circleToolStart) {
        window._circleToolStart = { x, y, z };
        showToast('Started Circle');
        tile.classList.add('selected-tile');
        return;
    }
    const { x: cx, y: cy, z: z0 } = window._circleToolStart;
    const rx = Math.abs(x - cx);
    const ry = Math.abs(y - cy);
    const pts = _ellipsePoints(cx, cy, rx, ry);
    saveState();
    pts.forEach(([px, py]) => {
        const t = mapContainer.querySelector(`.tile[data-x="${px}"][data-y="${py}"][data-z="${z0}"]`);
        if (t) handleInteraction(t, px, py, z0);
    });
    window._circleToolStart = null;
    updateMinimap();
    showToast('Pasted Circle (' + pts.length + ' tile-uri)');
    selectedTiles.forEach(t => t.classList.remove('selected-tile'));
    selectedTiles.clear();
}

function _ellipsePoints(cx, cy, rx, ry) {
    const pts = new Map();
    if (rx === 0 && ry === 0) return [[cx, cy]];
    const steps = Math.max(rx, ry) * 8 + 16;
    for (let i = 0; i < steps; i++) {
        const angle = (2 * Math.PI * i) / steps;
        const px = Math.round(cx + rx * Math.cos(angle));
        const py = Math.round(cy + ry * Math.sin(angle));
        pts.set(px + ',' + py, [px, py]);
    }
    return Array.from(pts.values());
}
const _BRUSH_SIZES = [1, 2, 3, 5, 7];

function openBrushPopup() {
    const ov = document.getElementById('brush-popup-overlay');
    if (!ov) return;
    _buildBrushGrid();
    _drawBrushPreview();
    ov.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
}

window.closeBrushPopup = function () {
    const ov = document.getElementById('brush-popup-overlay');
    if (!ov) return;
    ov.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(() => {});
    setTimeout(() => { ov.style.display = 'none'; }, 300);
};

function _buildBrushGrid() {
    const grid = document.getElementById('brush-size-grid');
    if (!grid) return;
    grid.innerHTML = '';
    _BRUSH_SIZES.forEach(sz => {
        const btn = document.createElement('button');
        btn.className = 'brush-sz-btn' + (sz === _currentBrushSize ? ' active' : '');
        btn.textContent = sz + 'x' + sz;
        btn.onclick = () => {
            _currentBrushSize = sz;
            window.RADIAL_BRUSH_SIZE = sz;
            document.querySelectorAll('.brush-sz-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _drawBrushPreview();
            hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
        };
        grid.appendChild(btn);
    });
}

function _drawBrushPreview() {
    const canvas = document.getElementById('brush-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const G = 11;
    const cw = W / G, ch = H / G;
    const center = Math.floor(G / 2);
    ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= G; i++) {
        ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(W, i * ch); ctx.stroke();
    }
    for (let dy = 0; dy < _currentBrushSize; dy++) {
        for (let dx = 0; dx < _currentBrushSize; dx++) {
            const gx = center + dx, gy = center + dy;
            if (gx < 0 || gx >= G || gy < 0 || gy >= G) continue;
            ctx.fillStyle = (dx === 0 && dy === 0) ? '#ffdf80' : '#8b5e34';
            ctx.fillRect(gx * cw + 1, gy * ch + 1, cw - 2, ch - 2);
        }
    }
    ctx.strokeStyle = 'rgba(255,223,128,0.5)'; ctx.lineWidth = 1.5;
    if (_currentMirrorMode === 'x' || _currentMirrorMode === 'xy') {
        const mx = (G / 2) * cw;
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
    }
    if (_currentMirrorMode === 'y' || _currentMirrorMode === 'xy') {
        const my = (G / 2) * ch;
        ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(W, my); ctx.stroke();
    }
}

window.RADIAL_BRUSH_SIZE = _currentBrushSize;
function openMirrorPopup() {
    const ov = document.getElementById('mirror-popup-overlay');
    if (!ov) return;
    _syncMirrorCards();
    ov.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('popup-visible')));
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
}

window.closeMirrorPopup = function () {
    const ov = document.getElementById('mirror-popup-overlay');
    if (!ov) return;
    ov.classList.remove('popup-visible');
    pclsSound.currentTime = 0; pclsSound.play().catch(() => {});
    setTimeout(() => { ov.style.display = 'none'; }, 300);
};

window.setMirrorMode = function (mode) {
    _currentMirrorMode = mode;
    window.RADIAL_MIRROR_MODE = mode;
    _syncMirrorCards();
    _drawBrushPreview();
    hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {});
};

function _syncMirrorCards() {
    ['off','x','y','xy'].forEach(m => {
        const btn = document.getElementById('mmode-' + m);
        if (btn) btn.classList.toggle('active', m === _currentMirrorMode);
    });
    const nameEl = document.getElementById('mirror-active-name');
    if (nameEl) nameEl.textContent = { off:'Off', x:'Mirror X', y:'Mirror Y', xy:'Both X+Y' }[_currentMirrorMode] || _currentMirrorMode;
}

window.RADIAL_MIRROR_MODE = _currentMirrorMode;
function handleInteractionBrushed(tile, x, y, z) {
    const bSize = _currentBrushSize;
    const mMode = _currentMirrorMode;
    const cols  = currentIslandCols || 8;
    const rows  = currentIslandRows || 8;
    if (bSize === 1 && mMode === 'off') {
        handleInteraction(tile, x, y, z);
        return;
    }
    const offsets = [];
    for (let dy = 0; dy < bSize; dy++) {
        for (let dx = 0; dx < bSize; dx++) {
            offsets.push([dx, dy]);
        }
    }

    const positions = new Set();
    offsets.forEach(([dx, dy]) => {
        const bx = x + dx, by = y + dy;
        if (bx < 0 || by < 0 || bx >= cols || by >= rows) return;
        positions.add(bx + ',' + by);
        if (mMode === 'x' || mMode === 'xy') {
            const mx = (cols - 1) - bx;
            if (mx >= 0 && mx < cols) positions.add(mx + ',' + by);
        }
        if (mMode === 'y' || mMode === 'xy') {
            const my = (rows - 1) - by;
            if (my >= 0 && my < rows) positions.add(bx + ',' + my);
        }
        if (mMode === 'xy') {
            const mx2 = (cols - 1) - bx, my2 = (rows - 1) - by;
            if (mx2 >= 0 && mx2 < cols && my2 >= 0 && my2 < rows) positions.add(mx2 + ',' + my2);
        }
    });

    positions.forEach(key => {
        const [tx, ty] = key.split(',').map(Number);
        const t = mapContainer.querySelector(`.tile[data-x="${tx}"][data-y="${ty}"][data-z="${z}"]`);
        if (t) handleInteraction(t, tx, ty, z);
    });
}
(function() {
    const ACH_KEY = 'ii_achievements';

    const ACHIEVEMENTS = [
              {
            id: 'first_tree',
            title: 'First Tree',
            desc: 'Place a tree on the island',
            icon: './Assets/Blocks/tree.png',
            group: 'normal',
            unlocked: false,
        },
        {
            id: 'random_island',
            title: 'Maybe you can cook',
            desc: 'Generate a random island',
            icon: './Assets/Icons/hotbar.png',
            group: 'normal',
            unlocked: false,
        },
        {
            id: 'settings_opened',
            title: 'Advanced in tehnology',
            desc: 'Open Settings',
            icon: './Assets/Icons/maintenance.png',
            group: 'normal',
            unlocked: false,
        },
        {
            id: 'easter_confetti',
            title: 'Clicky',
            desc: 'Click on the title 10 times for some confeti',
            icon: './Assets/Blocks/flovers.png',
            group: 'easter',
            unlocked: false,
        },
        {
            id: 'easter_flavortown',
            title: 'FLAVORTOWN',
            desc: 'Somewere "Flavortown" will still be here',
            icon: './Assets/Blocks/pumpkin.png',
            group: 'easter',
            unlocked: false,
        },
        {
            id: 'easter_1x1',
            title: 'Not an Island',
            desc: 'Did you really think a 1x1 grid is an island?',
            icon: './Assets/Blocks/dirt.png',
            group: 'easter',
            unlocked: false,
        },
        {
            id: 'float_mode',
            title: 'It floats!',
            desc: 'Make your island float',
            icon: './Assets/GUI/floaton.png',
            group: 'normal',
            unlocked: false,
        },
        {
            id: 'emoji_tab',
            title: 'You are crazyy stop!',
            desc: 'Open the Island as Emoji tab',
            icon: './Assets/Blocks/flovers.png',
            group: 'easter',
            unlocked: false,
        },
        {
            id: 'share_link',
            title: "It's good to share",
            desc: 'Share your island link',
            icon: './Assets/Icons/share.png',
            group: 'normal',
            unlocked: false,
        },
        {
            id: 'potato_mode',
            title: 'Potato Mode ON',
            desc: 'Turn off al graphics settings',
            icon: './Assets/Blocks/dirt.png',
            group: 'easter',
            unlocked: false,
        },
    ];
    function loadAchievements() {
        try {
            const saved = JSON.parse(localStorage.getItem(ACH_KEY) || '{}');
            ACHIEVEMENTS.forEach(a => { if (saved[a.id]) a.unlocked = true; });
        } catch(_) {}
    }

    function saveAchievements() {
        try {
            const obj = {};
            ACHIEVEMENTS.forEach(a => { if (a.unlocked) obj[a.id] = true; });
            localStorage.setItem(ACH_KEY, JSON.stringify(obj));
        } catch(_) {}
    }
    function unlockAchievement(id) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach || ach.unlocked) return;
        ach.unlocked = true;
        saveAchievements();
        showAchievementToast(ach);
        const ovl = document.getElementById('achievements-popup-overlay');
        if (ovl && ovl.style.display !== 'none') renderAchievementsPopup();
    }
    let _toastQueue = [];
    let _toastActive = false;

    function showAchievementToast(ach) {
        _toastQueue.push(ach);
        if (!_toastActive) processToastQueue();
    }

    function processToastQueue() {
        if (_toastQueue.length === 0) { _toastActive = false; return; }
        _toastActive = true;
        const ach = _toastQueue.shift();

        let toast = document.getElementById('ach-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ach-toast';

            const sidebar = document.createElement('div');
            sidebar.id = 'ach-toast-sidebar';
            const sideImg = document.createElement('img');
            sideImg.id = 'ach-toast-icon';
            sidebar.appendChild(sideImg);

            const body = document.createElement('div');
            body.id = 'ach-toast-body';
            const lbl = document.createElement('div');
            lbl.id = 'ach-toast-label';
            lbl.textContent = 'Achievement Unlocked!';
            const title = document.createElement('div');
            title.id = 'ach-toast-title';
            body.appendChild(lbl);
            body.appendChild(title);

            toast.appendChild(sidebar);
            toast.appendChild(body);
            document.body.appendChild(toast);
        }

        const icon = document.getElementById('ach-toast-icon');
        const titleEl = document.getElementById('ach-toast-title');
        if (icon)   icon.src = ach.icon;
        if (titleEl) titleEl.textContent = ach.title;

        clearTimeout(toast._hideTimer);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        }));

        toast._hideTimer = setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => processToastQueue(), 350);
        }, 3000);

        if (typeof hotbarSound !== 'undefined') {
            try { hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {}); } catch(_) {}
        }
    }
    function openAchievementsPopup() {
        renderAchievementsPopup();
        const overlay = document.getElementById('achievements-popup-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
        if (typeof hotbarSound !== 'undefined') { hotbarSound.currentTime = 0; hotbarSound.play().catch(() => {}); }
    }

    function closeAchievementsPopup() {
        const overlay = document.getElementById('achievements-popup-overlay');
        if (!overlay) return;
        overlay.classList.remove('popup-visible');
        if (typeof pclsSound !== 'undefined') { pclsSound.currentTime = 0; pclsSound.play().catch(() => {}); }
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }

    function renderAchievementsPopup() {
        const list    = document.getElementById('ach-list');
        const fill    = document.getElementById('ach-progress-bar-fill');
        const progLbl = document.getElementById('ach-progress-label');
        if (!list) return;

        const total    = ACHIEVEMENTS.length;
        const unlocked = ACHIEVEMENTS.filter(a => a.unlocked).length;
        const pct      = total ? Math.round((unlocked / total) * 100) : 0;

        if (fill)    fill.style.width = pct + '%';
        if (progLbl) progLbl.textContent = unlocked + ' / ' + total + ' Unlocked';

        list.innerHTML = '';
        const addSection = (label, items) => {
            const sec = document.createElement('div');
            sec.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:6px;color:var(--gui-text-dim,#a07850);letter-spacing:1.5px;margin:6px 0 4px;';
            sec.textContent = label;
            list.appendChild(sec);

            items.forEach(ach => {
                const row = document.createElement('div');
                row.className = 'ach-row ' + (ach.unlocked ? 'unlocked' : 'locked');
                const iconWrap = document.createElement('div');
                iconWrap.className = 'ach-icon-wrap';
                if (ach.unlocked) {
                    const img = document.createElement('img');
                    img.src = ach.icon;
                    img.alt = ach.title;
                    iconWrap.appendChild(img);
                } else {
                    const lockSpan = document.createElement('span');
                    lockSpan.className = 'ach-lock-icon';
                    lockSpan.textContent = '?';
                    lockSpan.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:14px;color:var(--gui-border,#523519);';
                    iconWrap.appendChild(lockSpan);
                }
                const info = document.createElement('div');
                info.className = 'ach-info';
                const titleDiv = document.createElement('div');
                titleDiv.className = 'ach-title';
                titleDiv.textContent = ach.title;
                const descDiv = document.createElement('div');
                descDiv.className = 'ach-desc';
                descDiv.textContent = ach.unlocked ? ach.desc : '???';
                info.appendChild(titleDiv);
                info.appendChild(descDiv);
                const badge = document.createElement('div');
                badge.className = 'ach-badge ' + (ach.unlocked ? 'done' : 'pending');
                badge.textContent = ach.unlocked ? 'OK' : '?';

                row.appendChild(iconWrap);
                row.appendChild(info);
                row.appendChild(badge);
                list.appendChild(row);
            });
        };

        addSection('Achievements', ACHIEVEMENTS.filter(a => a.group === 'normal'));
        addSection('Easter Eggs', ACHIEVEMENTS.filter(a => a.group === 'easter'));
    }
    window.openAchievementsPopup  = openAchievementsPopup;
    window.closeAchievementsPopup = closeAchievementsPopup;
    window._unlockAchievement     = unlockAchievement;
    const _origHandleInteraction = handleInteraction;
    window.handleInteraction = function(tile, x, y, z) {
        const prevCount = treeCounter;
        _origHandleInteraction.apply(this, arguments);
        if ((selectedBlockType === 'tree' || selectedBlockType === 'snowed_tree') && treeCounter > prevCount) {
            unlockAchievement('first_tree');
        }
    };
    const _origGenRand = generateRandomIsland;
    window.generateRandomIsland = function() {
        _origGenRand.apply(this, arguments);
        unlockAchievement('random_island');
    };
    const _origOpenSettings = openSettingsPopup;
    window.openSettingsPopup = function() {
        _origOpenSettings.apply(this, arguments);
        unlockAchievement('settings_opened');
    };

    
    const _origTitleClick = window.handleTitleClick;
    let _achClickCount = 0, _achClickTimer = null;
    window.handleTitleClick = function() {
        if (_origTitleClick) _origTitleClick.apply(this, arguments);
        _achClickCount++;
        clearTimeout(_achClickTimer);
        _achClickTimer = setTimeout(() => { _achClickCount = 0; }, 2500);
        if (_achClickCount >= 10) {
            _achClickCount = 0;
            clearTimeout(_achClickTimer);
            unlockAchievement('easter_confetti');
        }
    };

    
    const _origOpenLoadPopup = window.openLoadPopup;
    window.openLoadPopup = function() {
        const input = document.getElementById('popup-code-input');
        if (input && input.value.trim().toUpperCase() === 'FLAVORTOWN') {
            unlockAchievement('easter_flavortown');
        }
        if (_origOpenLoadPopup) _origOpenLoadPopup.apply(this, arguments);
        else {
            const val = input ? input.value.trim() : '';
            if (!val) return;
            if (val.toUpperCase() === 'FLAVORTOWN') { showToast('Flavortown is the best :3'); return; }
            const ok = loadIslandCode(val);
            if (!ok) showToast('Invalid Code!');
            else { closeSavePopup(); showToast('Succesfully Loaded!'); }
        }
    };

    
    const _origShow1x1 = window.show1x1Popup;
    window.show1x1Popup = function() {
        unlockAchievement('easter_1x1');
        if (_origShow1x1) _origShow1x1.apply(this, arguments);
    };
    loadAchievements();
})();
const SAVE_SLOT_KEY = 'islandSaveSlot_';
const SAVE_SLOT_COUNT = 3;

function openSaveSlotsPopup() {
    const overlay = document.getElementById('save-slots-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('popup-visible')));
    renderSaveSlots();
}

function closeSaveSlotsPopup() {
    const overlay = document.getElementById('save-slots-overlay');
    if (!overlay) return;
    overlay.classList.remove('popup-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 270);
}

function _getSlotData(idx) {
    try {
        const raw = localStorage.getItem(SAVE_SLOT_KEY + idx);
        return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
}

function _setSlotData(idx, data) {
    try { localStorage.setItem(SAVE_SLOT_KEY + idx, JSON.stringify(data)); } catch(e) {}
}

function _deleteSlotData(idx) {
    try { localStorage.removeItem(SAVE_SLOT_KEY + idx); } catch(e) {}
}

function _renderSlotThumb(canvas, thumbData) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!thumbData) return;
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = thumbData;
}

function _captureMinimap() {
    const mm = document.getElementById('minimap');
    if (!mm) return null;
    try { return mm.toDataURL('image/png'); } catch(e) { return null; }
}

function renderSaveSlots() {
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
        const data = _getSlotData(i);
        const emptyEl = document.getElementById('save-slot-empty-' + i);
        const metaEl  = document.getElementById('save-slot-meta-' + i);
        const loadBtn = document.getElementById('save-slot-load-' + i);
        const delBtn  = document.getElementById('save-slot-del-' + i);
        const thumb   = document.getElementById('save-slot-thumb-' + i);

        if (data) {
            if (emptyEl) emptyEl.style.display = 'none';
            if (metaEl)  metaEl.textContent = data.date || '—';
            if (loadBtn) loadBtn.disabled = false;
            if (delBtn)  delBtn.disabled = false;
            if (thumb)   _renderSlotThumb(thumb, data.thumb || null);
        } else {
            if (emptyEl) emptyEl.style.display = 'flex';
            if (metaEl)  metaEl.textContent = '—';
            if (loadBtn) loadBtn.disabled = true;
            if (delBtn)  delBtn.disabled = true;
            if (thumb) {
                const ctx = thumb.getContext('2d');
                ctx.clearRect(0, 0, thumb.width, thumb.height);
            }
        }
    }
}

function saveToSlot(idx) {
    const code = generateIslandCode();
    const thumb = _captureMinimap();
    const now = new Date();
    const date = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    _setSlotData(idx, { code, thumb, date });
    renderSaveSlots();
    showToast('Saved to Slot ' + (idx + 1) + '!');
}

function loadFromSlot(idx) {
    const data = _getSlotData(idx);
    if (!data || !data.code) { showToast('Slot ' + (idx + 1) + ' is empty!'); return; }
    const ok = loadIslandCode(data.code);
    if (!ok) { showToast('Error loading slot ' + (idx + 1) + '!'); return; }
    closeSaveSlotsPopup();
    closeSavePopup();
    showToast('Loaded Slot ' + (idx + 1) + '!');
}

function deleteSlot(idx) {
    _deleteSlotData(idx);
    renderSaveSlots();
    showToast('Slot ' + (idx + 1) + ' deleted!');
}
(function() {
    const TIPS_KEY = 'ii_tips_seen';
    const TIPS_HIDDEN_KEY = 'ii_tips_hidden';
    const TIPS = {
        'save-btn':       '',
        'undo-btn':       '',
        'redo-btn':       '',
        'float-toggle':   '',
        'music-toggle':   '',
        'zoom-ui':        '',
        'minimap-container': '',
        'settings-popup': '',
        'achievements-popup-overlay':'',
        'float-popup':    '',
        'music-popup':    '',
        'community-popup': '',
    };
    function isHidden() {
        return localStorage.getItem(TIPS_HIDDEN_KEY) === '1';
    }
    function markSeen(id) {
        try {
            const seen = JSON.parse(localStorage.getItem(TIPS_KEY) || '{}');
            seen[id] = 1;
            localStorage.setItem(TIPS_KEY, JSON.stringify(seen));
        } catch(_) {}
    }
    function isSeen(id) {
        try {
            const seen = JSON.parse(localStorage.getItem(TIPS_KEY) || '{}');
            return !!seen[id];
        } catch(_) { return false; }
    }
    function allSeen() {
        return Object.keys(TIPS).every(id => isSeen(id));
    }
    function updateCloseTipsBtn() {
        const btn = document.getElementById('close-tips-btn');
        if (!btn) return;
        const hide = isHidden() || allSeen();
        btn.style.display = hide ? 'none' : '';
    }
    function showTip(anchorId, text) {
        if (isHidden() || isSeen(anchorId)) return;
        const existing = document.getElementById('tip-' + anchorId);
        if (existing) existing.remove();
        const anchor = document.getElementById(anchorId);
        if (!anchor) { markSeen(anchorId); updateCloseTipsBtn(); return; }
        const bubble = document.createElement('div');
        bubble.className = 'tip-bubble';
        bubble.id = 'tip-' + anchorId;
        bubble.textContent = text;
        bubble.innerHTML = '<span style="color:var(--gui-accent,#ffdf80);font-size:9px;margin-right:4px;"></span>' + text;
        const rect = anchor.getBoundingClientRect();
        bubble.style.cssText = `
            position:fixed;
            top:${rect.bottom + 6}px;
            left:${rect.left + rect.width/2}px;
            transform:translateX(-50%);
            pointer-events:none;
        `;
        document.body.appendChild(bubble);
        const dismiss = () => {
            markSeen(anchorId);
            bubble.remove();
            updateCloseTipsBtn();
            anchor.removeEventListener('click', dismiss);
            anchor.removeEventListener('mousedown', dismiss);
        };
        anchor.addEventListener('click', dismiss, {once: true});
        anchor.addEventListener('mousedown', dismiss, {once: true});
        setTimeout(dismiss, 5000);
    }
    const hooks = [
        { fn: 'openSavePopup',         id: 'save-btn',                  tip: TIPS['save-btn'] },
        { fn: 'openFloatPopup',         id: 'float-toggle',              tip: TIPS['float-toggle'] },
        { fn: 'openMusicPopup',         id: 'music-toggle',              tip: TIPS['music-toggle'] },
        { fn: 'openSettingsPopup',      id: 'settings-popup',            tip: TIPS['settings-popup'] },
        { fn: 'openAchievementsPopup',  id: 'achievements-popup-overlay',tip: TIPS['achievements-popup-overlay'] },
        { fn: 'openCommunityPopup',     id: 'community-popup',           tip: TIPS['community-popup'] },
    ];
    hooks.forEach(({fn, id, tip}) => {
        const orig = window[fn];
        window[fn] = function() {
            const ret = orig ? orig.apply(this, arguments) : undefined;
            const anchorMap = {
                'save-btn': 'save-btn',
                'float-toggle': 'float-toggle',
                'music-toggle': 'music-toggle',
                'settings-popup': 'save-btn',
                'achievements-popup-overlay': 'save-btn',
                'community-popup': 'save-btn',
            };
            showTip(anchorMap[id] || 'save-btn', tip);
            return ret;
        };
    });
    document.addEventListener('DOMContentLoaded', () => {
        const dockTips = [
            { id: 'save-btn',     tip: TIPS['save-btn'] },
            { id: 'undo-btn',     tip: TIPS['undo-btn'] },
            { id: 'redo-btn',     tip: TIPS['redo-btn'] },
            { id: 'float-toggle', tip: TIPS['float-toggle'] },
            { id: 'music-toggle', tip: TIPS['music-toggle'] },
            { id: 'zoom-ui',      tip: TIPS['zoom-ui'] },
            { id: 'minimap-container', tip: TIPS['minimap-container'] },
        ];

        dockTips.forEach(({id, tip}) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('mouseenter', () => showTip(id, tip), {passive: true});
        });
        updateCloseTipsBtn();
    });
    window._closeTips = function() {
        localStorage.setItem(TIPS_HIDDEN_KEY, '1');
        document.querySelectorAll('.tip-bubble').forEach(b => b.remove());
        updateCloseTipsBtn();
        if (typeof hotbarSound !== 'undefined') { hotbarSound.currentTime = 0; hotbarSound.play().catch(()=>{}); }
    };
    const origShowTip = showTip;
    window._showTip = showTip;
})();
