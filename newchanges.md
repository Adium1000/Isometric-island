
## Comit (6e59022)

- Moved all the existent gameplay files such as  `index.html` , `game.js` , `style.css` , `sw.js` , `lang.js` , `manifest.json` in the /game subfolder

## Comit (32a9acf)

- Moved the Assets folder in the game folder because the game could not fiind the xD

## Comit (3920767)

- Started the landing page, a simple page for now


## Comit (6f5b3ee)

- Maked new changes sink in the main page of the launch pad 
- Started to make the wiki page 

## Comit (27937ea)

- Fixed some bugs in the launch pad 

## Comit (0e47eb2)- Added Phone Compability

I optimized `index.html` & `wiki.html` to work on small devices, here is how it went

On `Index.html`

- Firstlly the explore bar started to cut out and on small screens, you won't be able to acces some tabs
- The floating icons were cut out by the pedding and they won't show on small screens anymore
- The explore bar is now only-icons on the mobile

On `Wiki.html`

- Firstlly phone version of this website haved an weird bug where the page auto-scrolled down witout touching it, and it was because I asked claude to do a MD explorer, it worked on desktop but on mobile it just giltches out so I removed it
- The explore bar is now only-icons on the mobile

---
## Comits (44f912b), (72199af) , (000cd6b) , (c3b0f38) , (cc34474) , (dd1a663) , (e34e4df) , (c333d65), (f60153c)- Fixed Wiki Issues

Fixed the Wiki.html's Image rendering isssues
At some point because I moved the original game to the /game folder some icons were not in the same location readme should fiind them, as a fix i fix the path locations and it works good
Added Lists Render : for the wiki infos
Added Iframes render for the repo statistics
Added links render for donations & stuff
in this comits I was also redoing changes and trying again, I was frustarted because images wont render but it was just cache issue, so now it works :3