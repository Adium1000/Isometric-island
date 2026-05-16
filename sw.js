//   .M"""bgd `7MMF'     A     `7MF'
//  ,MI    "Y   `MA     ,MA     ,V  
//  `MMb.        VM:   ,VVM:   ,V   
//    `YMMNq.     MM.  M' MM.  M'   
//  .     `MM     `MM A'  `MM A'    
//  Mb     dM      :MM;    :MM;     
//  P"Ybmmd"        VF      VF      
                                
                                
const CACHE = 'isometric-v1';
const ASSETS = ['./', './index.html', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
