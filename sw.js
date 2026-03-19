//  ,---.                          ,--.                 ,--.   ,--.              ,--.                  
// '   .-'  ,---. ,--.--.,--.  ,--.`--' ,---. ,---.     |  |   |  | ,---. ,--.--.|  |,-. ,---. ,--.--. 
// `.  `-. | .-. :|  .--' \  `'  / ,--.| .--'| .-. :    |  |.'.|  || .-. ||  .--'|     /| .-. :|  .--' 
// .-'    |\   --.|  |     \    /  |  |\ `--.\   --.    |   ,'.   |' '-' '|  |   |  \  \\   --.|  |    
// `-----'  `----'`--'      `--'   `--' `---' `----'    '--'   '--' `---' `--'   `--'`--'`----'`--'    
                                                                                                    

const CACHE_NAME = 'isometric-island-v1';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './Assets/Audio/place.wav',
    './Assets/Audio/hotbar.wav',
    './Assets/GUI/hotbar.png',
    './Assets/GUI/selector.png',
    './Assets/GUI/zoombar.png',
    './Assets/GUI/zoomdot.png',
    './Assets/GUI/zoom-.png',
    './Assets/GUI/zoom+.png',
    './Assets/GUI/save.png',
    './Assets/GUI/undo.png',
    './Assets/GUI/redo.png',
    './Assets/GUI/bgon.png',
    './Assets/GUI/bgoff.png',
    './Assets/GUI/floaton.png',
    './Assets/GUI/floatoff.png',
    './Assets/Blocks/eraser.png',
    './Assets/Blocks/dirt.png',
    './Assets/Blocks/dirt2.png',
    './Assets/Blocks/ShovedDirt.png',
    './Assets/Blocks/flovers.png',
    './Assets/Blocks/rock.png',
    './Assets/Blocks/crops.png',
    './Assets/Blocks/stone.png',
    './Assets/Blocks/mossystone.png',
    './Assets/Blocks/sand.png',
    './Assets/Blocks/redsand.png',
    './Assets/Blocks/melon.png',
    './Assets/Blocks/Hay.png',
    './Assets/Blocks/water.png',
    './Assets/Blocks/tree.png',
];

const LAZY_PATTERNS = [
    /Assets\/Blocks\//,
    /Assets\/GUI\//,
    /Assets\/Audio\//,
    /Assets\/Icons\//,
];

const NETWORK_FIRST_PATTERNS = [
    /raw\.githubusercontent\.com/,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
            return Promise.allSettled(
                PRECACHE_ASSETS.map(url =>
                    cache.add(url).catch(() => { })
                )
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;
    if (event.request.method !== 'GET' || url.startsWith('chrome-extension')) return;
    if (NETWORK_FIRST_PATTERNS.some(p => p.test(url))) {
        event.respondWith(networkFirst(event.request));
        return;
    }
    if (LAZY_PATTERNS.some(p => p.test(url)) || url.includes(self.location.origin)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Asset not available offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response('Network unavailable', { status: 503 });
    }
}
