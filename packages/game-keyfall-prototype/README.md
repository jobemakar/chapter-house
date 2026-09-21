# Keyfall exploratory prototype

An unregistered, standalone TypeScript/Vite prototype for the abandoned-funhouse
physics idea. Swipe over velvet cords to release the brass key, collect three
optional clue tickets, and guide it into the glowing keyhole. It is deliberately
separate from Pocket Funhouse and uses only the versioned save key
`chapter-house:keyfall-prototype:v1`.

From `application/`:

```sh
npm run typecheck -w @chapter-house/game-keyfall-prototype
npm test -w @chapter-house/game-keyfall-prototype
npm run build -w @chapter-house/game-keyfall-prototype
npm run dev -w @chapter-house/game-keyfall-prototype
```

The three rooms demonstrate a direct drop, a two-cord pendulum sequence, and a
bumper plus tappable bellows. This is a canvas prototype: the generated concept
image is art direction, while cords, key, tickets, props, and goal are live
objects. Progress and settings are local-only. No rewards are granted.
