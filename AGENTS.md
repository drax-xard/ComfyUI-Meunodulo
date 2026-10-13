# AGENTS.md

ComfyUI custom-node pack. Pure-Python nodes + canvas-drawing JS extensions. No deps (`requirements.txt` is intentionally empty).

## Layout & wiring
- `__init__.py` re-exports `NODE_CLASS_MAPPINGS` / `NODE_DISPLAY_NAME_MAPPINGS` from `src/nodes.py` and sets `WEB_DIRECTORY = "./web"`.
- `src/nodes.py` is the single Python source of node definitions.
- `web/js/*.js` are ES modules auto-loaded by ComfyUI; relative import to the core is `../../../scripts/app.js` (3 levels, because the pack is served under `/extensions/<name>/` and the file sits in `web/js/`).
- `web/docs/` is per-node help shown in the in-app help panel; `docs/` is the repo-facing copy of the same per-node docs; `docs_devel/` is reference material on ComfyUI node authoring (not shipped behavior).

## Must-keep-in-sync (duplicated logic)
- Resolution math is duplicated: `calculate_resolution` / `ASPECT_*` / `STANDARD_RESOLUTIONS` in `src/nodes.py` **and** `resolve` / `RATIOS` / `ASPECTS` / `STANDARD` in `web/js/resolution.js`. Editing one requires editing the other. Python is the source of truth.
- Label color palette: `DisplayLabel.FONT_COLORS` in `src/nodes.py` mirrors `PALETTE` in `web/js/label.js` (keys must match; hex values may differ).
- `DisplayLabel.FONT_COLORS` and other tables are also referenced by comments marked "Keep in sync".
- Per-node docs are duplicated: `web/docs/NodeName.md` (required for the in-app help panel) and `docs/NodeName.md` (repo-facing). Editing one requires editing the other.

## Conventions that differ from defaults
- Custom mode sizes round **up** (ceil) to the next multiple, not to nearest. Standard mode returns exact curated resolutions even if not a multiple of 32.
- Docs filename must equal the `NODE_CLASS_MAPPINGS` key and live at `web/docs/NodeName.md`. It must be inside `WEB_DIRECTORY` or the help panel won't find it.
- Class-map key != display name: `DisplayLabel` -> "Display Text Label", `ResolutionCalculator` -> "Resolution Calculator". JS extensions match on `nodeData.name`/`comfyClass` using the **key**.
- JS uses tab indentation; Python uses 4 spaces, no comments unless non-obvious.

## Verification (no test suite / linter exists)
There is no test runner, CI, or lint config. Verify changes with:
```
python3 -m py_compile src/nodes.py && node --check web/js/label.js web/js/resolution.js
```
Full runtime testing needs a real ComfyUI install with this dir symlinked/copied into `custom_nodes/`. Not available in this environment. When changing resolution math, verify Python/JS parity by hand (e.g. `1:1`, 1 MP, multiple 32 -> `1024x1024`).

## Git
- Repo-local identity is set; do not change it. Commit only when asked; the owner pushes manually.
