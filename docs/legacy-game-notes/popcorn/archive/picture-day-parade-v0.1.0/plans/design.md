# Picture Day Parade 0.1.0

A comic photo studio on a coral scrapbook desktop. Oversized ink-outlined figures react to a fan, springy mascot or bubble machine. The scene is continuously animated; the viewfinder is a draggable crop with visible corners and thirds. The player uses **Cue the gag**, follows a brief anticipation, and snaps at a chosen moment. Three scene-specific composition discoveries each have clear visible requirements. A live hint describes the unfolding action; photo feedback explains who made the frame and what was caught.

Scenes: Hat Trick (fan lifts hats), Mascot Mayhem (a toy dog photobombs), Bubble Trouble (oversized soap bubbles). Original students wear different clothes and silhouettes, blink, look around and wave. A relaxed mode slows simulation and gag timing together. Burst chooses the strongest of three actual moments 0.22 simulation seconds apart.

Source: core.js owns deterministic scene state, composition and rewards; render.js owns original canvas art and print rendering; audio.js owns generated sound; app.js owns events, saves and DOM. build.mjs concatenates into an offline playable and dist/index.html. No external libraries/assets/network required. Scene data stored in each photo lets the album render the exact recorded pose at any later session.

No album economy, currency, lives, real camera or uploads. All scenes are available. The initial loop can be judged directly before adding more content. Existing public sites remain unchanged.
