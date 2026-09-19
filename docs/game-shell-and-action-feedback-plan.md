# Game shell and action feedback plan

Date: 2026-09-19
Status: Implementing locally

## User decisions

1. Wave and Jump animate the avatar and play their sounds without creating a reaction bubble.
2. Call pet uses a distinct symbol from the Pets collection/navigation button.
3. Every enabled UI button has a visible mouse-hover response.
4. While an integrated game is active, the left side of the shared top bar contains only an Exit game/back control. The normal brand and destination navigation are removed, while the right-side name, currency, mute, fullscreen, and help controls remain available.

## Implementation

1. Remove the reaction side effects from the room and town Wave/Jump methods while preserving their existing animation and audio behavior.
2. Add a dedicated call/whistle icon and retain the paw only for the Pets navigation destination.
3. Add a safe shared hover treatment based on color/filter/shadow so it does not replace position transforms used by spatial controls.
4. Add an app-shell Exit game action and a playing-state layout that replaces the left-side brand/navigation with it while preserving the right-side account and utility cluster.
5. Verify typecheck/build, the full application test suite, and desktop/mobile browser behavior with special attention to game entry/exit and hover states.

## Acceptance checks

- Wave and Jump show no avatar reaction bubble inside or outside.
- Pets and Call pet are visually distinct and retain accessible labels.
- Enabled buttons across the shell, panel, contextual controls, and game UI respond on hover; disabled controls do not imply availability.
- Starting Wishbone leaves Exit game on the left plus name, currency, mute, fullscreen, and help on the right; using Exit game restores the clubhouse shell.
- Existing saved profile data and game progress formats are unchanged.
