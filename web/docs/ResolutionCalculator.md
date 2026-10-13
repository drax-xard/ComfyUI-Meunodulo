# Resolution Calculator

Turns a target megapixel count and an aspect ratio into concrete video
dimensions. Useful for keeping generated video or image sizes aligned with
standard resolutions (SD, HD, 4K, vertical phone, cinematic, etc.).

## Parameters

- **aspect**: Aspect ratio and orientation. Options: `16:9`, `9:16`, `4:3`,
  `3:4`, `3:2`, `2:3`, `1:1`, `21:9`, `9:21`, and `2.39:1` (cinematic scope).
- **mode**:
  - `Standard (video sizes)` — snaps to the curated resolution closest to your
    target (e.g. `16:9` at ~1 MP → `1280×720`).
  - `Custom (multiple)` — computes the size from the aspect ratio and rounds
    each dimension up to the next multiple.
- **megapixels**: Target total pixel count in megapixels (e.g. `1.0`).
- **multiple**: Rounding granularity used in `Custom` mode (default `32`; for
  example `1` MP at `1:1` with a multiple of `32` gives `1024×1024`).

## Outputs

- **width** (INT)
- **height** (INT)

The resulting size is also drawn on the node face and updates live as you
change the settings.

## Notes

- In `Standard` mode the exact curated dimensions are output even when they are
  not multiples of 32, since matching real video sizes is the priority.
- Vertical/portrait options are the width/height swap of their landscape
  counterpart.
