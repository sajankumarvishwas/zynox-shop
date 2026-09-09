# THE TROLL GAME

A Zynox web minigame where the troll is the gameplay.

## Install
Copy the `the-troll-game` folder into the site's public minigames directory:

`public/minigames/the-troll-game/`

## URL

`/minigames/the-troll-game/`

## Flow

1. Premium start screen with animated ambient particles.
2. Player presses **START GAME**.
3. Every click grows the button and produces a new message.
4. Tone escalates through click milestones: 5, 10, 15 ... 100.
5. At click 100 the button expands beyond the UI and the screen cuts to black.
6. `ADMIN IS COOKING...` appears.
7. A deliberately slow 45-60 second fake loading sequence begins.
8. Loading accepts clicks, but clicks cannot skip the timer.
9. The final reveal displays the troll result and player stats.
10. Players can retry, share the game, or return to Zynox.

## Controls

- Desktop: mouse/touch click on the main button.
- Mobile: tap the main button.
- Loading screen: tap/click anywhere to trigger small reactions without skipping the timer.
- Optional fullscreen and sound controls are provided.

## Mobile behavior

The experience is responsive in portrait and landscape. It does not require fullscreen.

## Share

`TROLL YOUR FRIENDS` uses Web Share API when available and falls back to clipboard copy or an on-screen URL. Shared URLs use `?troll=friend` to show:

`YOUR FRIEND THINKS YOU CAN START THIS. 💀`

## Customization

Main message banks, loading messages, roasts, click milestones and timing are in `script.js`.
Visual styling is in `style.css`.

## Timing

The final fake loading duration is randomized between 45 and 60 seconds. The timer is based on elapsed time so frame rate and repeated taps do not shorten it.

## Local storage

No local storage is required for core gameplay. The game works without it.

## Sound

Optional Web Audio feedback. The game remains fully functional if audio is unavailable or blocked.

## Deployment

No backend, database, authentication or API is required. Serve the folder as static files.
