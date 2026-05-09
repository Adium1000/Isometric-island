
## Comit [(6e59022)](https://github.com/Adium1000/Isometric-island/commit/6e59022c284630e08eb67312d9d80920992706b9)

- Moved all the existent gameplay files such as  `index.html` , `game.js` , `style.css` , `sw.js` , `lang.js` , `manifest.json` in the /game subfolder

## Comit [(32a9acf)](https://github.com/Adium1000/Isometric-island/commit/32a9acfb84c69bed659c125838d4ecc9218a32d4)

- Moved the Assets folder in the game folder because the game could not fiind the xD

## Comit [(3920767)](https://github.com/Adium1000/Isometric-island/commit/3920767a7b1bcaf564c9eb38017a4816044ce13f#diff-0eb547304658805aad788d320f10bf1f292797b5e6d745a3bf617584da017051)

- Started the landing page, a simple page for now


## Comit [(6f5b3ee)](https://github.com/Adium1000/Isometric-island/commit/6f5b3ee93924d5d7697e12c604d421f9e5d5d81f)

- Maked new changes sink in the main page of the launch pad 
- Started to make the wiki page 

## Comit [(27937ea)](https://github.com/Adium1000/Isometric-island/commit/27937eab3768622fec7b2602327fad149d288f6f)

- Fixed some bugs in the launch pad 

## Comit [(0e47eb2)](https://github.com/Adium1000/Isometric-island/commit/0e47eb2c8d5ab3013bacc57fcc7d9114fac3e43c) - Added Phone Compability

I optimized `index.html` & `wiki.html` to work on small devices, here is how it went

On `Index.html`

- Firstlly the explore bar started to cut out and on small screens, you won't be able to acces some tabs
- The floating icons were cut out by the pedding and they won't show on small screens anymore
- The explore bar is now only-icons on the mobile

On `Wiki.html`

- Firstlly phone version of this website haved an weird bug where the page auto-scrolled down witout touching it, and it was because I asked claude to do a MD explorer, it worked on desktop but on mobile it just giltches out so I removed it
- The explore bar is now only-icons on the mobile

---
## Comits [(44f912b)](https://github.com/Adium1000/Isometric-island/commit/44f912b43f365c689b580fbdfa0d7786ee026fe2) , [(72199af)](https://github.com/Adium1000/Isometric-island/commit/72199af2cfecd2249c0f9e90f1ff745b63172051) , [(000cd6b)](https://github.com/Adium1000/Isometric-island/commit/000cd6ba8fcdaf8d50ffa57833007bcd28025940) , [(c3b0f38)](https://github.com/Adium1000/Isometric-island/commit/c3b0f38f34ee89601d716e4cb6d5cc68bb0b6217) , [(cc34474)](https://github.com/Adium1000/Isometric-island/commit/cc344747e36bcba6bfba58bea704bba7b1b3d60d) , [(dd1a663)](https://github.com/Adium1000/Isometric-island/commit/dd1a663abb02ef62863e8e381167907a11fe7aaf) , [(e34e4df)](https://github.com/Adium1000/Isometric-island/commit/e34e4df4d39418b51a3bdf393e81f446800b82b6) , [(c333d65)](https://github.com/Adium1000/Isometric-island/commit/c333d652b5205498a7e6b23400caa7973c301b99) , [(f60153c)](https://github.com/Adium1000/Isometric-island/commit/f60153c6e821a1a968b53f208a917c8cce092d01) - Fixed Wiki Issues

Fixed the Wiki.html's Image rendering isssues
At some point because I moved the original game to the /game folder some icons were not in the same location readme should fiind them, as a fix i fix the path locations and it works good
Added Lists Render : for the wiki infos
Added Iframes render for the repo statistics
Added links render for donations & stuff
in this comits I was also redoing changes and trying again, I was frustarted because images wont render but it was just cache issue, so now it works :3