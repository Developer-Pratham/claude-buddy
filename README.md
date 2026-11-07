# claude-buddy

A little animated block critter that lives above the prompt in Claude Code.

It sits, blinks, looks around, waves, dances while Claude is working, waves
"all done!" when a turn finishes, and falls asleep after 30 seconds of quiet.
Four buttons under it (pet, wave, dance, sleep) let you play with it.

This is an unofficial, fan-made pixel approximation of a mascot, not official artwork.

## Install

In a Claude Code session:

```
/plugin install buddy --marketplace Developer-Pratham/claude-buddy
```

Answer `y` to add the marketplace, then pick the user scope.

## What it does (and does not do)

- Draws a band above the prompt and updates it every 300 ms.
- Uses only two engine calls: `$.clock.every` and `$.ui.resolve`.
- No file, process, network, model or storage access.

## Notes

- It takes about 9 rows of screen space above the prompt.
- Button clicks need a terminal with mouse support.
- Tests: `claude plugin test buddy`.
