![Banner](.github/Banners/todolist.png)
# Here is my todo list where I list ideeas to remember them for later, take a look!

ignore the cluter :) no time to sort the most heh
also placing on the side of a block is not possible rn right?
-a proper way to retrigger it would be nice tuto

- tutorial video
- MoreBlocks
- X people building right now" counter live (discarded)
- build that island replica game mini
- Notificări stacked - acum toast-ul se suprascrie, poți face o coadă verticală cu mai multe toasts simultane // 
- Timelapse recorder — înregistrezi fiecare acțiune și poți reda construcția de la zero ca un gif/video
- Undo/Redo Visual History: O listă cu ultimele acțiuni pe care poți da click. (depricat)
- Replace Tool (Brush): Înlocuiește blocurile sub brush, dar păstrează înălțimea lor Z.



edit layer mode
choose Y layers to edit for exemple if  we choose all we can edit all, but if we chooose Y=2 this layer is focused , the rest of them use a ghoast effect of 50%

Language Update
Wave 1
- Multi-language support - RO, EN, ES, FR, DE pentru UI
Wave 2
- RTL support - pentru arabă/ebraică


Island Comunity update
- Search icon, Bar
- Tabs down of the windows 
- Account Icon in the right Up: when clicked appears another popup with info about : Maps shared , delete button


More sounds
- make an exclamation sound!
- weird sound


---

Maybe cookies policy


   
What I added:

Plan B
Add more legal documents
-Acceptable User Policy AUP
(-Imprint or legal Notice)
-Dmca and Copyright policy for comunity maps
- radial menu 
- optimization banner
:Magic Wand
:Terraforming Brush
:Line Tool
:Circle Tool
- Realizaări
:Primul Copac (plaseaza un copac)
:Poate iese ceva: Genereaza o insula random
:Mai avansat: deschide meniul de setari
:Hopa! Găsește un easter egg (:: cca ::)
- add show air blocks (noted)
- float speed bar (NOTED)
- Account delete system
- Drag & Drop Hotbar: Posibilitatea de a rearanja ordinea blocurilor în hotbar-ul de jos.(noted)
- Animated Hotbar: Icoanele din hotbar să sară (bounce) când treci cu mouse-ul peste ele. (noted)
- Save Slots: Butoane cu "Slot 1", "Slot 2" care să aibă o mică imagine (thumbnail) cu insula salvată. (now)
- Cursor Trail: Un efect mic de particule care urmărește mouse-ul doar pe spațiul canvas-ului. (now)
- mai multe realizari (done)
plutește!
Fă insula sa plutească
Nebunie
Dechide tabul de island as an emoji
E bine să împarți
Copiaza linkul unei insule (buton din file)
Modul cartof
dezactivezi totul din graphics
- Tutorial Non-Intruziv: Mici semne de întrebare care apar doar prima dată când deschizi o secțiune.
- Offline indicator
- Efect de "squash & stretch" 
- Island resolution 16x
- 404 page
- add user icon google show in the comunity maps, logout icon, in popup map preview
Explicit Warning (explicit icon)
- island as an emoji (fun)
- Meniu Radial (Quick Actions): Dacă utilizatorul ține apăsat Click Dreapta, să apară un meniu circular pe centrul ecranului de unde poate alege Brush size, mirror mode si cand alege o optiune sa i se deschida popup ul dorit de configurare 
advanced brush options
- Shareable URL cu insula encoded
- 1x1 → "really?"
- Statistics popup
- embed islads show everywere
- Minimap moove
- about menu
- cursor tooltips
- add generate popup
- Add custom cursors
- decompile all of my game into HTML, CSS , JAVA
- use Chrome's PWA app
- make the game playable on small screens 
- day/night/rain/snow switch 
- Electron release
- Android Build
- Design Save button
- Add Icon to the page
- Random island button
- Hold tooltip
- export as an png or as a codes
- RE do main banner
- design a banner for issues
- Add banners to About 
- Do an electron app for windows 
- Make a more readable description on github
- fix pause media button 
- undo redo
- Add small banners to the Manual sections
- Add shortcuts (keyboard)
- Organize Github Preview Folder
- add END banner
- Add banners to TODO
- Add Banners to Software
- add icons in 7, 8 
- add Beta banner
- add a credits banner
- mouse wheel to move the island
- add more snow blocks 
- ice blocks
- add warning banner
- add a scond page to the blocks page
- and snowman
- opimize zoom
- add actions to zoom buttons!
- add shadows to the island
- add tree/ flowers/rocks on grass
- add music and music switch on off
- add a float on off switch
- minimap 


todo may varryy idk what else it can varry lol
sooo yea gl
i hate missspelling


Devlog Sketch
Release
Release Fin#al

# Devlog 70
Overall: Added Language Manager, Contributions opened

---

# Comit [(c78c679)](https://github.com/Adium1000/Isometric-island/commit/c78c679911df943ccd4e572b68472394071e7a3a)

### Added Language Manager
Language manager is overall the `lang.js` located in `root`
Language manager replaces the hard coded text with the translated ones 
Language manager logs everything in the logs in romanian language :3
Language manager logs only the fails and language changes 

Here is how it works:

1. Initialization and Storage
Saves the user's selected language in localStorage under the key `ii_language`, so that the preference persists across sessions.
2. The `t(key)` function — the most important one
Translates a key in the form of "blocks.dirt" or "mirror.title" into the text corresponding to the active language. If it cannot find the translation, it tries the fallback (English), and if it is not there either, it returns the raw key.
3. `_applyDOM()`
Searches the HTML for elements with the data-t attribute and automatically replaces their text:

---

### Added Language Indexer 
Language indexer indexes the languages in the game (for now only english)
Also if you contribute, you need to modify this file

---

### Added en.js
`en.js` is an language file that is indexed by the `index.js` and then procesed by the `lang.js`
`en.js` have all the lines that can be translated in the game (a lot of lines)

What it does:

Populates the global variable `window.__LANG_DATA__['en']` with a hierarchical JSON object containing all the in-game text organized by category.

---

### Added language popup in the game settings
Now in the game's settings popup contains languages indexed from the `index.js`

---

### Contributions Opened!
Do you want to help? Glad to hear, now you can translate the game in your own language thanks to the language manager 

---
- Added devlog thumbnail: details and stuff by Adrian
© Image spotlight by Adrian
---
