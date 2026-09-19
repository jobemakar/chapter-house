# Sprite frames and road hazards — 2026-09-17

Jobe requested actual sprite animation and more challenge. Built-in OpenAI
ImageGen generated these local PNGs; originals and approved earlier art are kept.
The frame sheet uses comic-sprites.png as an identity/style reference; hazards
are new invented comic road obstacles, not claims about the book's plot.

- comic-motion.png: 1254 × 1254 RGBA, transparent corner inspected. Sixteen
  distinct authored poses: truck wheels/driver/awning; purple bat wings/blink;
  green creature legs/blink; boss mouth/paws/blink. Generated source
  exec-46cc3bf3-e684-4c5a-9153-4966d8b6d653.png. Rows are uneven despite equal-grid
  prompt; use explicit crop rectangles in renderer.ts. No bitmap edit/resampling
  is baked into the source PNG. Source-frame selection provides animation.
- comic-hazards.png: 1774 × 887 RGBA, transparent corner inspected. Pothole and
  sticky spore pod, generated source exec-43a09e59-44a6-45a9-9ff6-e75b0208d055.png.
  Transparent top/bottom padding is cropped at rendering time. Warning rings,
  expiration fade and lock feedback are code effects over generated art.

Both originals reside in C:/Users/jmakar/.codex/generated_images/01a0b0b5-7ffa-7b50-98aa-5a5f517828af/.
Both selected PNGs are copied to project assets and embedded in the offline
playable; no runtime external images. Truck/creature frame consistency is a
generated animation trial, not a claim of hand-animated production quality.

## Exact generation prompts

### Motion atlas

Use case: precise-object-edit. Production transparent 2D animation sprite sheet. Reference image is the approved game atlas: preserve exact character identities, yellow Beautiful Pig truck with pig sign/striped awning/purple trim, purple bat, green leaf goblin, round brown cream-faced leafy-horned boss, same bright clean ink comic illustration. Create a NEW square transparent sprite sheet with EXACT FOUR equal columns and FOUR equal rows, sixteen full sprites. All cells evenly spaced, margins12%, sprites same center and same scale within each character row. NO text labels, NO grid lines, NO shadows, genuinely transparent background. Each row is four sequential DISTINCT animation artwork poses of ONE subject. Row0 truck facing RIGHT: frame1 wheel spokes angled0driveropeneyes, frame2 spokes45driverblinkandawningclothslightwave, frame3 spokes90driveropeneyesandclothotherwave, frame4 spokes135driveropeneyesclothneutral. Truck BODY SIGN POSITION AND SIZE identical; sign reads 'The Beautiful Pig'; preserve full sign silhouette. Row1 purple bat facingLEFT: wings fully UP, wingsHALFWAY, wingsfullyDOWN, wingsHALFWAY with blink; BODY CENTER andsizefixed, keep wing shapes visibly different and complete within cells. Row2 greenleaf creature facingLEFT: running legsleftfootforwardrightback, legsneutralbothbent, rightfootforwardleftback, legsneutralwithblink; arms/leafears subtly followrun; trunkcenterfixed. Row3 roundbrown creamfaceboss facingLEFT: mouthopenpawsraised, mouthhalfopenpawsout, mouthclosedpawsdownandblink, mouthhalfopenpawsout; breathingcheek/chestartdrawn differently, not simplyduplicatesrotated. Four frames must change actual internal artwork/anatomy. No extra objects, no food, no baskets. Each sprite remains isolated full silhouette and no sprite crosses cells. Preserve bright warm approved look and characteridentity. This sheet is used by cropping four source frames per row; exact grid and consistent pose alignment are critical. No watermark.

### Road hazards

Use case: illustration-story. Production transparent sprite atlas for a bright comic illustrated family food-truck arcade game. EXACT TWO equal columns and ONE row, two isolated complete sprites with generous transparent margins15%, no grid lines, no text or labels, no backdrop, no shadows outside silhouettes. Left: dangerous cartoon pothole seen slightly elevated fromthe side, oval dark asphalt hole with thick cracked lightgray jagged rim and small brokenasphaltchips aroundrim, holeinteriorinknavy, clear readable outline, friendly comicstyle but visually obstacle. Right: sticky purple-pink spore pod dropped by a mischievous fantasy creature, round squat bulb with three stubby goldtipspikes and goo droplets onside, magenta bulb darkoutlined with smallbluegreenleaves, menacing road obstaclebutnoviolence, no realexplosives/weapon, no face. Match bold darkink outlines/celshading/warm painterly highlights of approved gameart. Transparent alpha essential. Ground-planehazards with flatteroval silhouettes, not uprightcharacters. Objects centered in each half same footprint and size. No glow, no warningrings, noUI, no watermark.
