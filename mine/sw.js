//    ____           _   
//   / __/    __    (_)__
//  _\ \| |/|/ /   / (_-<
// /___/|__,__(_)_/ /___/
//             |___/     


const CACHE = 'isometric-island-v1';
const ASSETS = [
    './',
    './mines.html',
    './mines.css',
    './mines.js',
    './manifest.json',
    './Assets/Blocks/dirt.png',
    './Assets/Blocks/dirt2.png',
    './Assets/Blocks/path.png',
    './Assets/Blocks/stone.png',
    './Assets/Blocks/mossystone.png',
    './Assets/Blocks/rock.png',
    './Assets/Blocks/redsand.png',
    './Assets/Audio/hotbar.wav',
    './Assets/Audio/place.wav',
    './Assets/Audio/pcls.wav',
    './Assets/Icons/icon-192.png',
    './Assets/Icons/icon-512.png',
];
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
