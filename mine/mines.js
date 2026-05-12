//    __  ____                  _   
//   /  |/  (_)__  ___ ___     (_)__
//  / /|_/ / / _ \/ -_|_-<_   / (_-<
// /_/  /_/_/_//_/\__/___(_)_/ /___/
//                        |___/     

let _hotbarSound, _placeSound, _pclsSound;
function getHotbarSound()  { if(!_hotbarSound)  _hotbarSound  = new Audio('./Assets/Audio/hotbar.wav');  return _hotbarSound; }
function getPlaceSound()   { if(!_placeSound)   _placeSound   = new Audio('./Assets/Audio/place.wav');   return _placeSound; }
function getPclsSound()    { if(!_pclsSound)    _pclsSound    = new Audio('./Assets/Audio/pcls.wav');    return _pclsSound; }
function playClick()  { try { const s=getHotbarSound(); s.currentTime=0; s.play(); } catch(e){} }
function playReveal() { try { const s=getPlaceSound();  s.currentTime=0; s.play(); } catch(e){} }
function playFlag()   { try { const s=getPclsSound();   s.currentTime=0; s.play(); } catch(e){} }
function playExplode() { /* am ramas fara chef sa fac aseturi dati mi pace */ }
function playWin()    { /* si aci am zis ca nam chef */ }
const TILE_W = 24, TILE_H = 12;
const B = {
    hidden:'dirt', revealed:'path', numtile:'stone',
    flagged:'mossystone', mine:'rock', exploded:'redsand', hover:'dirt2',
};
const NUM_COLORS = ['','#2080ff','#20b030','#ff3030','#8020d0','#ff8020','#20c0c0','#d020a0','#808080'];
const DIFFICULTIES = {
    easy:  {cols:8,  rows:8,  mines:10},
    medium:{cols:12, rows:12, mines:25},
    hard:  {cols:16, rows:16, mines:50},
};
let G = { cols:0,rows:0,mines:0,cells:[],revealed:[],flags:[],
          explodedIdx:-1,started:false,over:false,won:false,
          timerVal:0,timerID:null,hovIdx:-1,diff:'easy' };
let TILES = [], SCALE = 1;
const mapEl = document.getElementById('map');
function idxOf(r,c){ return r*G.cols+c; }
function inBounds(r,c){ return r>=0&&r<G.rows&&c>=0&&c<G.cols; }
function isoLeft(c,r){ return (c-r)*(TILE_W/2); }
function isoTop(c,r){ return (c+r)*(TILE_H/2); }
function initGame(diff) {
    clearInterval(G.timerID);
    const cfg = DIFFICULTIES[diff];
    G = {
        cols:cfg.cols,rows:cfg.rows,mines:cfg.mines,
        cells:new Array(cfg.rows*cfg.cols).fill(0),
        revealed:new Array(cfg.rows*cfg.cols).fill(false),
        flags:new Array(cfg.rows*cfg.cols).fill(false),
        explodedIdx:-1,started:false,over:false,won:false,
        timerVal:0,timerID:null,hovIdx:-1,diff,
    };
    document.getElementById('timer-val').textContent = '0';
    document.getElementById('mines-left').textContent = cfg.mines;
    hideMsg();
    clearWinParticles();
    buildTiles(false);
}
function placeMines(safeR, safeC) {
    const safe = new Set();
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++)
        if(inBounds(safeR+dr,safeC+dc)) safe.add(idxOf(safeR+dr,safeC+dc));
    let placed=0;
    while(placed<G.mines){
        const i=Math.floor(Math.random()*G.rows*G.cols);
        if(!safe.has(i)&&G.cells[i]===0){ G.cells[i]=-1; placed++; }
    }
    for(let r=0;r<G.rows;r++) for(let c=0;c<G.cols;c++){
        if(G.cells[idxOf(r,c)]===-1) continue;
        let n=0;
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++)
            if(inBounds(r+dr,c+dc)&&G.cells[idxOf(r+dr,c+dc)]===-1) n++;
        G.cells[idxOf(r,c)]=n;
    }
}
function buildTiles(isIntro) {
    mapEl.innerHTML = ''; TILES=[];
    const gridW = (G.cols+G.rows)*(TILE_W/2);
    const gridH = (G.cols+G.rows)*(TILE_H/2)+TILE_H;
    const vpW = window.innerWidth-20, vpH = window.innerHeight-120;
    SCALE = Math.min(vpW/gridW, vpH/gridH, 4);
    SCALE = Math.max(SCALE, 0.5);
    mapEl.style.width  = gridW+'px';
    mapEl.style.height = gridH+'px';
    const offX = G.rows*(TILE_W/2), offY = 0;
    for(let r=0;r<G.rows;r++) for(let c=0;c<G.cols;c++){
        const i=idxOf(r,c);
        const img=document.createElement('img');
        img.className='tile';
        img.src=`./Assets/Blocks/${B.hidden}.png`;
        img.setAttribute('data-r',r); img.setAttribute('data-c',c);
        const left=offX+isoLeft(c,r), top=offY+isoTop(c,r);
        img.style.left=left+'px'; img.style.top=top+'px'; img.style.zIndex=c+r;
        if(isIntro){
            const delay = (r+c)*22;
            img.classList.add('tile-intro');
            img.style.animationDelay = delay+'ms';
        }
        const num=document.createElement('div');
        num.className='tile-num';
        num.style.left=(left+TILE_W/2)+'px';
        num.style.top=(top+TILE_H*0.10)+'px';
        num.style.zIndex=c+r+1;
        mapEl.appendChild(img); mapEl.appendChild(num);
        TILES[i]={img,num};
        img.addEventListener('click',onLeft);
        img.addEventListener('contextmenu',onRight);
        img.addEventListener('mouseenter',onEnter);
        img.addEventListener('mouseleave',onLeave);
    }
}
function renderCell(r,c){
    const i=idxOf(r,c), t=TILES[i]; if(!t) return;
    const isRev=G.revealed[i], isFlag=G.flags[i], isMine=G.cells[i]===-1;
    const num=G.cells[i], isHov=G.hovIdx===i&&!G.over, isExp=G.explodedIdx===i;
    let block;
    if(isExp) block=B.exploded;
    else if(isRev&&isMine) block=B.mine;
    else if(isRev&&num>0) block=B.numtile;
    else if(isRev) block=B.revealed;
    else if(isFlag) block=B.flagged;
    else if(isHov) block=B.hover;
    else block=B.hidden;
    t.img.src=`./Assets/Blocks/${block}.png`;
    t.img.classList.toggle('revealed',isRev);
    const fs=Math.max(5,Math.floor(TILE_W*0.28));
    t.num.style.fontSize=fs+'px';
    if(isRev&&!isMine&&num>0){
        t.num.style.color=NUM_COLORS[num]||'#fff';
        t.num.textContent=num; t.num.style.display='block';
    } else if(isRev&&isMine){
        t.num.style.fontSize=Math.max(7,Math.floor(TILE_W*0.38))+'px';
        t.num.style.color='#ff2020';
        t.num.textContent='\u{1F4A3}'; t.num.style.display='block';
    } else if(isFlag&&!isRev){
        t.num.style.fontSize=Math.max(7,Math.floor(TILE_W*0.38))+'px';
        t.num.style.color='#fff';
        t.num.textContent='\u{1F6A9}'; t.num.style.display='block';
    } else { t.num.textContent=''; t.num.style.display='none'; }
}

function renderAll(){
    for(let r=0;r<G.rows;r++) for(let c=0;c<G.cols;c++) renderCell(r,c);
    document.getElementById('mines-left').textContent=G.mines-G.flags.filter(Boolean).length;
}
function floodReveal(r,c,depth=0){
    if(!inBounds(r,c)) return;
    const i=idxOf(r,c);
    if(G.revealed[i]||G.flags[i]) return;
    G.revealed[i]=true;
    setTimeout(()=>{ renderCell(r,c); animateTilePop(i); }, depth*18);
    if(G.cells[i]===0)
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++)
            if(dr||dc) floodReveal(r+dr,c+dc,depth+1);
}
function animateTilePop(i){
    const t=TILES[i]; if(!t) return;
    t.num.classList.remove('tile-pop');
    void t.num.offsetWidth;
    t.num.classList.add('tile-pop');
    t.num.addEventListener('animationend',()=>t.num.classList.remove('tile-pop'),{once:true});
}

function checkWin(){
    for(let i=0;i<G.rows*G.cols;i++) if(G.cells[i]!==-1&&!G.revealed[i]) return false;
    return true;
}
function onLeft(e){
    e.preventDefault(); if(G.over) return;
    const r=+this.getAttribute('data-r'), c=+this.getAttribute('data-c');
    const i=idxOf(r,c);
    if(G.flags[i]||G.revealed[i]) return;
    if(!G.started){
        G.started=true; placeMines(r,c);
        G.timerID=setInterval(()=>{
            G.timerVal++;
            document.getElementById('timer-val').textContent=G.timerVal;
        },1000);
    }
    playReveal();
    if(G.cells[i]===-1){
        G.explodedIdx=i; G.revealed[i]=true; G.over=true;
        clearInterval(G.timerID);
        const shakerEl = document.getElementById('map-shaker');
        shakerEl.classList.add('island-shaking');
        shakerEl.addEventListener('animationend',()=>shakerEl.classList.remove('island-shaking'),{once:true});
        playExplode();
        for(let j=0;j<G.rows*G.cols;j++) if(G.cells[j]===-1) G.revealed[j]=true;
        renderAll();
        setTimeout(()=>showMsg('BOOM!','Game Over!\nTime: '+G.timerVal+'s',false),900);
    } else {
        floodReveal(r,c);
        if(checkWin()){
            G.over=true; G.won=true; clearInterval(G.timerID);
            renderAll(); playWin();
            spawnWinParticles();
            toast('You Won!!');
            setTimeout(()=>showMsg('Victory!','Time: '+G.timerVal+'s\nMine: '+G.mines,true),500);
        }
    }
}
function onRight(e){
    e.preventDefault(); if(G.over) return;
    const r=+this.getAttribute('data-r'), c=+this.getAttribute('data-c');
    const i=idxOf(r,c);
    if(G.revealed[i]) return;
    G.flags[i]=!G.flags[i];
    playFlag();
    renderCell(r,c);
    document.getElementById('mines-left').textContent=G.mines-G.flags.filter(Boolean).length;
}
function onEnter(){
    if(G.over) return;
    const r=+this.getAttribute('data-r'),c=+this.getAttribute('data-c'),i=idxOf(r,c);
    if(!G.revealed[i]&&!G.flags[i]){ G.hovIdx=i; renderCell(r,c); }
}
function onLeave(){
    const r=+this.getAttribute('data-r'),c=+this.getAttribute('data-c'),i=idxOf(r,c);
    if(G.hovIdx===i){ G.hovIdx=-1; renderCell(r,c); }
}
let _tt=null;
mapEl.addEventListener('touchstart',e=>{
    const img=e.target.closest('.tile'); if(!img) return;
    e.preventDefault();
    _tt=setTimeout(()=>{ _tt=null; img.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true})); },420);
},{passive:false});
mapEl.addEventListener('touchend',()=>{ clearTimeout(_tt); _tt=null; },{passive:false});
function spawnWinParticles(){
    const container=document.getElementById('win-particles');
    container.innerHTML='';
    const cols=['#ffdf80','#80ffb0','#ff9940','#60c8ff','#ff8080','#fff'];
    for(let i=0;i<60;i++){
        const el=document.createElement('div');
        el.className='w-particle';
        const size=4+Math.random()*6;
        el.style.cssText=`
            width:${size}px;height:${size}px;
            left:${Math.random()*100}%;
            top:${-10-Math.random()*20}%;
            background:${cols[Math.floor(Math.random()*cols.length)]};
            animation-duration:${1.2+Math.random()*1.4}s;
            animation-delay:${Math.random()*0.6}s;
        `;
        container.appendChild(el);
    }
    setTimeout(clearWinParticles, 2500);
}
function clearWinParticles(){ document.getElementById('win-particles').innerHTML=''; } 
let _toastTimer=null;
function toast(msg){
    const el=document.getElementById('toast');
    el.textContent=msg; el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer=setTimeout(()=>el.classList.remove('show'),2000);
}
function showMsg(title,sub,win){
    const icon=win?'🏆':'💥';
    document.getElementById('msg-icon').textContent=icon;
    const ic=document.getElementById('msg-icon');
    ic.style.animation='none'; void ic.offsetWidth;
    ic.style.animation='';
    document.getElementById('msg-title').textContent=title;
    document.getElementById('msg-title').style.color=win?'#80ffb0':'#ff6060';
    document.getElementById('msg-sub').textContent=sub;
    const ov=document.getElementById('msg-overlay');
    ov.style.display='flex';
    requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('popup-visible')));
}
function hideMsg(){
    const ov=document.getElementById('msg-overlay');
    ov.classList.remove('popup-visible');
    setTimeout(()=>{ ov.style.display='none'; },300);
}
(function(){
    const wrap=document.getElementById('map-wrap');
    let viewZoom=1.0, panX=0, panY=0;

    function applyView(){
        const s = SCALE * viewZoom;
        const mw = parseFloat(mapEl.style.width)  || 0;
        const mh = parseFloat(mapEl.style.height) || 0;
        const ww = wrap.clientWidth;
        const wh = wrap.clientHeight;
        const tx = (ww - mw * s) / 2 + panX;
        const ty = (wh - mh * s) / 2 + panY;
        mapEl.style.transformOrigin = '0 0';
        mapEl.style.left = '0';
        mapEl.style.top  = '0';
        mapEl.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    }
    const _origInit = initGame;
    initGame = function(diff, _intro){
        panX=0; panY=0; viewZoom=1.0;
        const cfg = DIFFICULTIES[diff];
        G = {
            cols:cfg.cols,rows:cfg.rows,mines:cfg.mines,
            cells:new Array(cfg.rows*cfg.cols).fill(0),
            revealed:new Array(cfg.rows*cfg.cols).fill(false),
            flags:new Array(cfg.rows*cfg.cols).fill(false),
            explodedIdx:-1,started:false,over:false,won:false,
            timerVal:0,timerID:null,hovIdx:-1,diff,
        };
        clearInterval(G.timerID);
        document.getElementById('timer-val').textContent = '0';
        document.getElementById('mines-left').textContent = cfg.mines;
        hideMsg();
        clearWinParticles();
        buildTiles(!!_intro);
        applyView();
    };
    window.addEventListener('resize',()=>initGame(G.diff));
    initGame('easy', true);
    setTimeout(()=>{
        document.querySelector('.game-title-container').classList.add('intro-done');
        document.getElementById('hud').classList.add('intro-done');
    }, 80);
    document.getElementById('btn-restart').onclick = ()=>{ playClick(); initGame(G.diff); };
    document.getElementById('msg-btn').onclick     = ()=>{ playClick(); initGame(G.diff); };
    document.querySelectorAll('.diff-btn').forEach(btn=>{
        btn.onclick = ()=>{
            playClick();
            document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            initGame(btn.dataset.diff);
        };
    });
    wrap.addEventListener('wheel', e=>{
        e.preventDefault();
        const rect = wrap.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const oldS = SCALE * viewZoom;
        const factor = e.deltaY > 0 ? 0.88 : 1.12;
        viewZoom = Math.max(0.3, Math.min(8, viewZoom * factor));
        const newS = SCALE * viewZoom;
        const mw = parseFloat(mapEl.style.width)||0, mh = parseFloat(mapEl.style.height)||0;
        const ww = wrap.clientWidth, wh = wrap.clientHeight;
        const originX = (ww - mw*oldS)/2 + panX;
        const originY = (wh - mh*oldS)/2 + panY;
        panX = mx - (mx - originX) * (newS/oldS) - (ww - mw*newS)/2;
        panY = my - (my - originY) * (newS/oldS) - (wh - mh*newS)/2;
        applyView();
    }, {passive:false});
    let dragging=false, dragStartX=0, dragStartY=0, panStartX=0, panStartY=0, dragMoved=false;
    wrap.addEventListener('mousedown', e=>{
        if(e.button!==0) return;
        dragging=true; dragMoved=false;
        dragStartX=e.clientX; dragStartY=e.clientY;
        panStartX=panX; panStartY=panY;
        wrap.style.cursor='grabbing';
    });
    window.addEventListener('mousemove', e=>{
        if(!dragging) return;
        const dx=e.clientX-dragStartX, dy=e.clientY-dragStartY;
        if(Math.abs(dx)>4||Math.abs(dy)>4) dragMoved=true;
        if(dragMoved){ panX=panStartX+dx; panY=panStartY+dy; applyView(); }
    });
    window.addEventListener('mouseup', ()=>{ if(!dragging) return; dragging=false; wrap.style.cursor=''; });
    wrap.addEventListener('click', e=>{ if(dragMoved){ e.stopPropagation(); dragMoved=false; } }, true);
    let touches={}, pinchStartDist=0, pinchStartZoom=1,
        touchPanStartX=0, touchPanStartY=0, touchPanPX=0, touchPanPY=0, touchDragMoved=false;
    function dist(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }
    wrap.addEventListener('touchstart', e=>{
        [...e.changedTouches].forEach(t=>{ touches[t.identifier]=t; });
        const ids=Object.keys(touches);
        if(ids.length===2){
            const ta=touches[ids[0]], tb=touches[ids[1]];
            pinchStartDist=dist(ta,tb); pinchStartZoom=viewZoom;
        } else if(ids.length===1){
            const t=touches[ids[0]];
            touchPanStartX=t.clientX; touchPanStartY=t.clientY;
            touchPanPX=panX; touchPanPY=panY; touchDragMoved=false;
        }
    },{passive:true});
    wrap.addEventListener('touchmove', e=>{
        [...e.changedTouches].forEach(t=>{ touches[t.identifier]=t; });
        const ids=Object.keys(touches);
        if(ids.length===2){
            e.preventDefault();
            const ta=touches[ids[0]], tb=touches[ids[1]], d=dist(ta,tb);
            viewZoom=Math.max(0.3,Math.min(8, pinchStartZoom*(d/pinchStartDist)));
            applyView();
        } else if(ids.length===1){
            const t=touches[ids[0]], dx=t.clientX-touchPanStartX, dy=t.clientY-touchPanStartY;
            if(Math.abs(dx)>6||Math.abs(dy)>6) touchDragMoved=true;
            if(touchDragMoved){ panX=touchPanPX+dx; panY=touchPanPY+dy; applyView(); }
        }
    },{passive:false});
    wrap.addEventListener('touchend', e=>{
        [...e.changedTouches].forEach(t=>{ delete touches[t.identifier]; });
        const ids=Object.keys(touches);
        if(ids.length===1){
            const t=touches[ids[0]];
            touchPanStartX=t.clientX; touchPanStartY=t.clientY;
            touchPanPX=panX; touchPanPY=panY; pinchStartZoom=viewZoom;
        }
    },{passive:true});
})();
