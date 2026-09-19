# Midnight Snow Jam — implementation design
2026-09-11 · BOB-004-R2 · 0.1.0

The selected rhythm concept is implemented as a four-pad, fixed-stage concert. Two musicians are prominent initially; successful participation in 4 and 8 phrases brings the other friends into the musical backing. Charts use the unlocked roster when each tune begins; all four pads can always be played as instruments. Each tune contains a four-beat count-in plus 64 beats of play. An eight-beat phrase with any successful timed or free-jam tap advances persistent progress. Consecutive sets retain score and Aurora charge, with no results screen or failure gate.

Snowstep (84 BPM), Puffin Parade (96 BPM) and Aurora Swing (108 BPM) each have authored original chord roots and pentatonic-style melody phrases. AudioContext.currentTime anchors note cues and audio scheduling; half-beat accompaniment uses a 120ms lookahead. A stalled frame discards stale scheduled ticks. Pause stops all active/queued voices and stores the beat; resume reconstructs the anchor. If audio startup fails, visual play uses a performance clock. Mix is synthesized with oscillators, noise, gain envelopes and a compressor.

Perfect taps are within 110ms, good taps within 220ms (320ms with Easy groove). Notes have stable IDs and cannot be hit twice. Pads debounce taps for 90ms and track pointer ownership independently. Misses reduce combo by two, preserving score, items and play. Each hit fills the 24-note Aurora meter; spending it doubles scoring for eight beats and adds an octave line. Free jam counts participation and charge but does not award timing points.

Visual direction is original cut-paper/felt theater: layered mountains, translucent aurora ribbons, an ice bandstand, rounded handmade animal silhouettes, stitched-looking instruments, cream snow and mint/coral/lilac accents on navy. Four note lanes align geometrically with DOM pad centers. Color, symbols, names and keys identify pads independently. Reduced motion preserves travelling timing cues but removes decorative sky sway, dance bobbing and most particles.

Duane/Arctic friends are source-confirmed; the band, winter-night scenery and collectibles are invented. Source and thematic explanation are in requirements.md. This is the collection's only sustained musical timing loop, compared with all nine reserved signatures in the registry.
