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



   
What I added:
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

# Devlog 64

- Remodel of the Comunity Maps menu
---
# What is new here?

- Here is the list of the comits 

# Comit [(e029eb5)](https://github.com/Adium1000/Isometric-island/commit/e029eb50a7c360799e1c34d052fe1abcf7f71089)

### 1. Tabs 
- Now the tab have 3 main tabs: Browse, Publish, Account
  - Browse: Now the islands have a Low Quality preview in the Left of it, Search bar for finding maps faster
  - Publish: this tab kinda remained the same 
  - Account: Here the user can log in using a Google or a HackClub account in the future, here you will also find how manny maps you published, a delete account button and a log out button button

### 2. Map Preview 
- Let's take a closer look at the map preview

- Here you will find the colors used 

1. `null` - eraser

2. `#8B6340` - dirt

3. `#9B7350` - dirt2

4. `#7a5530` - ShovedDirt

5. `#5a9e3a` - flovers

6. `#787878` - rock

7. `#c8a040` - crops

8. `#909090` - stone

9. `#607060` - mossystone

10. `#d4c080` - sand

11. `#c08050` - redsand

12. `#3060c0` - water

13. `#e8f0ff` - snow

14. `#9eb0c0` - snowrocks

15. `#a0d0e8` - ice

16. `#e07020` - pumpkin

17. `#d4a830` - Hay

18. `#50a830` - melon

19. `#2a7a20` - tree

20. `#8ab0c8` - snowed_tree

21. `#f0f8ff` - snowman

22. `#8B5E3C` - wood

23. `#3a8a28` - leaf

24. `#d8eaf8` - snow2

25. `#d0e8f8` - snowmanb1

26. `#c8e0f0` - snowmanb2

27. `#e8f4ff` - SnowmanHead

- also some elements like trees and snow mans does not render correct

### 3. Account login with HC OAuth
- As I said I would like to implement this tipe of signin/login I just need to get aproved, and maybe move from github pages

# Comit [(68cf688)](https://github.com/Adium1000/Isometric-island/commit/68cf68831f3c823e07dd8a20880fce0fe6981117)

- Now the accounts tab uses the icon `account.png` instead of `google.png` finded in `./Assets/Icons/`
---
This is all about the new Comunity Maps menu, what do you think? 