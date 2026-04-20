                                                                                                                            
// ▄▄▄                                                  ▄▄▄      ▄▄▄                                       ▄▄▄▄▄▄▄      ▄▄▄▄   
// ███                                                  ████▄  ▄████                                       ▀▀▀▀████   ▄██████▄ 
// ███       ▀▀█▄ ████▄ ▄████ ██ ██  ▀▀█▄ ▄████ ▄█▀█▄   ███▀████▀███  ▀▀█▄ ████▄  ▀▀█▄ ▄████ ▄█▀█▄ ████▄     ▄▄██▀    ███  ███ 
// ███      ▄█▀██ ██ ██ ██ ██ ██ ██ ▄█▀██ ██ ██ ██▄█▀   ███  ▀▀  ███ ▄█▀██ ██ ██ ▄█▀██ ██ ██ ██▄█▀ ██ ▀▀       ███▄   ███▄▄███ 
// ████████ ▀█▄██ ██ ██ ▀████ ▀██▀█ ▀█▄██ ▀████ ▀█▄▄▄   ███      ███ ▀█▄██ ██ ██ ▀█▄██ ▀████ ▀█▄▄▄ ██      ███████▀ ██ ▀████▀  
//                         ██                ██                                           ██                                   
//                       ▀▀▀               ▀▀▀                                          ▀▀▀                                    
//Isometric Island Language Manager 3.0



(function () {
    const LS_KEY = 'ii_language';

    let _strings  = {};
    let _fallback = {};
    let _active   = 'en';
    function t(key) {
        return _get(_strings, key) || _get(_fallback, key) || key;
    }
    function _get(obj, path) {
        let cur = obj;
        for (const p of path.split('.')) {
            if (!cur || typeof cur !== 'object') return null;
            cur = cur[p];
        }
        return cur != null && typeof cur !== 'object' ? String(cur) : null;
    }
    function getLangList() {
        return (window.__LANG_INDEX__ || []).slice();
    }
    function _applyDOM() {
        document.querySelectorAll('[data-t]').forEach(el => {
            const v = t(el.getAttribute('data-t'));
            if (v && v !== el.getAttribute('data-t')) el.textContent = v;
        });
        document.querySelectorAll('[data-t-placeholder]').forEach(el => {
            const v = t(el.getAttribute('data-t-placeholder'));
            if (v && v !== el.getAttribute('data-t-placeholder')) el.placeholder = v;
        });
    }
    function _qs(sel) { return document.querySelector(sel); }
    function _id(id)  { return document.getElementById(id); }

    function _setText(id, key) {
        const el = _id(id); if (el) el.textContent = t(key);
    }
    function _setQS(sel, key) {
        const el = _qs(sel); if (el) el.textContent = t(key);
    }
    function _setChildText(parentId, childSel, key) {
        const p = _id(parentId); if (!p) return;
        const c = p.querySelector(childSel); if (c) c.textContent = t(key);
    }
    function _setSwitchLabel(switchId, key) {
        const sw = _id(switchId); if (!sw) return;
        const row = sw.closest('.visual-option-row'); if (!row) return;
        const label = row.querySelector('.visual-option-label'); if (!label) return;
        if (label.querySelector('[data-t]')) return;
        const textNode = Array.from(label.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
        if (textNode) textNode.textContent = t(key);
        else label.appendChild(document.createTextNode(t(key)));
    }
    function _applyDOMExtra() {
        _setQS('#graphics-settings-popup h2', 'graphics_settings.title');
        _setSwitchLabel('sw-shadows',         'graphics_settings.shadows');
        _setSwitchLabel('sw-leaves',          'graphics_settings.leaves');
        _setSwitchLabel('sw-clouds',          'graphics_settings.clouds');
        _setSwitchLabel('sw-block-particles', 'graphics_settings.block_particles');
        _setSwitchLabel('sw-show-air',        'graphics_settings.show_air');
        _setQS('#photo-filters-popup h2', 'photo_filters.title');
        _setChildText('pfcard-none',    '.photo-filter-name', 'photo_filters.none');
        _setChildText('pfcard-gameboy', '.photo-filter-name', 'photo_filters.gameboy');
        _setChildText('pfcard-crt',     '.photo-filter-name', 'photo_filters.crt');
        _setChildText('pfcard-sepia',   '.photo-filter-name', 'photo_filters.sepia');
        _setChildText('pfcard-hc',      '.photo-filter-name', 'photo_filters.high_contrast');
        _setQS('#keybindings-popup h2', 'keybindings.title');
        _setText('keybindings-subtitle',  'keybindings.subtitle');
        _setText('keybindings-reset-btn', 'keybindings.reset');
        _setQS('#mirror-popup h2', 'mirror.title');
        _setChildText('mmode-off', '.mirror-card-label', 'mirror.off');
        _setChildText('mmode-x',   '.mirror-card-label', 'mirror.x');
        _setChildText('mmode-y',   '.mirror-card-label', 'mirror.y');
        _setChildText('mmode-xy',  '.mirror-card-label', 'mirror.both');
        const mirrorStatus = _id('mirror-status');
        if (mirrorStatus) {
            const activeName = _id('mirror-active-name');
            const curVal = activeName ? activeName.textContent : 'Off';
            mirrorStatus.innerHTML = t('mirror.active') + ' <strong id="mirror-active-name">' + curVal + '</strong>';
        }
        _setQS('#brush-popup h2', 'brush.title');
        _setQS('#float-popup h2', 'float_popup.title');
        _setChildText('fmode-off',       '.float-mode-label', 'float_popup.off');
        _setChildText('fmode-updown',    '.float-mode-label', 'float_popup.updown');
        _setChildText('fmode-leftright', '.float-mode-label', 'float_popup.leftright');
        _setChildText('fmode-spin',      '.float-mode-label', 'float_popup.spin');
        _setChildText('fmode-jiggle',    '.float-mode-label', 'float_popup.jiggle');
        _setQS('#float-speed-bar-row .visual-option-label', 'float_popup.speed_label');
        _setQS('#music-popup h2', 'music_popup.title');
        const musicRows = document.querySelectorAll('#music-popup .visual-option-row');
        if (musicRows[0]) {
            const lbl = musicRows[0].querySelector('.visual-option-label');
            if (lbl) lbl.textContent = t('music_popup.bg_music');
        }
        if (musicRows[1]) {
            const lbl = musicRows[1].querySelector('.visual-option-label');
            if (lbl) lbl.textContent = t('music_popup.volume_label');
        }
        _setQS('#settings-menu-popup h2', 'settings_menu.title');
        _setQS('#analytics-popup h2', 'analytics.title');
        const statLabels = document.querySelectorAll('#analytics-summary-row .analytics-stat-label');
        if (statLabels[0]) statLabels[0].textContent = t('analytics.total_label');
        if (statLabels[1]) statLabels[1].textContent = t('analytics.types_label');
        if (statLabels[2]) statLabels[2].textContent = t('analytics.layers_label');
        _setQS('#achievements-popup h2', 'achievements.title');
        _setQS('#save-slots-popup h2', 'save_slots.title');
        [0, 1, 2].forEach(i => {
            const emptyEl = _id('save-slot-empty-' + i);
            if (emptyEl) emptyEl.textContent = t('save_slots.empty');
            const loadBtn = _id('save-slot-load-' + i);
            if (loadBtn) loadBtn.textContent = t('save_slots.load');
            const delBtn = _id('save-slot-del-' + i);
            if (delBtn) delBtn.textContent = t('save_slots.delete');
            const card = _id('save-slot-' + i);
            if (card) {
                const saveBtn = card.querySelector('.save-slot-btn.save');
                if (saveBtn) saveBtn.textContent = t('save_slots.save') || 'SAVE';
                const labelEl = card.querySelector('.save-slot-label');
                if (labelEl) labelEl.textContent = t('save_slots.slot') + ' ' + (i + 1);
            }
        });
        if (typeof _renderKeyBindingsList === 'function') {
            if (window._keyBindings) {
                const labelMap = {
                    undo:   t('keybindings.actions.undo'),
                    redo:   t('keybindings.actions.redo'),
                    search: t('keybindings.actions.search'),
                    grid:   t('keybindings.actions.grid'),
                    eraser: t('keybindings.actions.eraser'),
                    page:   t('keybindings.actions.page'),
                    music:  t('keybindings.actions.music'),
                    float:  t('keybindings.actions.float'),
                };
                window._keyBindings.forEach(b => {
                    if (labelMap[b.id]) b.label = labelMap[b.id];
                });
            }
            _renderKeyBindingsList();
        }
        _applyHotbarNames();
    }
    function _applyHotbarNames() {
        const blockMap = {
            eraser: 'blocks.eraser', dirt: 'blocks.dirt', flovers: 'blocks.flovers',
            rock: 'blocks.rock', dirt2: 'blocks.dirt2', ShovedDirt: 'blocks.ShovedDirt',
            crops: 'blocks.crops', stone: 'blocks.stone', mossystone: 'blocks.mossystone',
            sand: 'blocks.sand', redsand: 'blocks.redsand', melon: 'blocks.melon',
            Hay: 'blocks.Hay', water: 'blocks.water', tree: 'blocks.tree',
            pumpkin: 'blocks.pumpkin', snow: 'blocks.snow', snowrocks: 'blocks.snowrocks',
            ice: 'blocks.ice', snowman: 'blocks.snowman', snowed_tree: 'blocks.snowed_tree',
            wood: 'blocks.wood', leaf: 'blocks.leaf',
        };
        document.querySelectorAll('.slot').forEach(slot => {
            const onclick = slot.getAttribute('onclick') || '';
            const match = onclick.match(/selectBlock\('([^']+)'/);
            if (!match) return;
            const blockType = match[1];
            const key = blockMap[blockType];
            if (!key) return;
            const name = t(key).replace(/'/g, "\\'");
            slot.setAttribute('onmouseover', "showName('" + name + "')");
        });
    }
    function setLang(code) {
        const data = window.__LANG_DATA__ && window.__LANG_DATA__[code];
        if (!data) {
            console.warn('[Lang] limba nu e încărcată:', code);
            return;
        }
        _strings = data;
        _active  = code;
        try { localStorage.setItem(LS_KEY, code); } catch (_) {}
        _applyDOM();
        _applyDOMExtra();
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: code } }));
        console.log('[Lang] limbă activă:', code);
    }
    function _boot() {
        _fallback = (window.__LANG_DATA__ && window.__LANG_DATA__['en']) || {};

        let saved = null;
        try { saved = localStorage.getItem(LS_KEY); } catch (_) {}

        const available = getLangList().map(l => l.code);
        let target = (saved && available.includes(saved)) ? saved : null;
        if (!target) {
            const nav = (navigator.language || 'en').split('-')[0].toLowerCase();
            if (available.includes(nav)) target = nav;
        }
        if (!target) target = 'en';

        console.log('[Lang] limbi disponibile:', available, '| țintă:', target);
        setLang(target);

        window.dispatchEvent(new CustomEvent('langReady', { detail: { lang: _active } }));
    }
    window.LangManager = {
        t,
        setLang,
        getLang:     () => _active,
        getLangList,
        isReady:     () => true,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _boot);
    } else {
        _boot();
    }
})();
