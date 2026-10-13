# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Split documentation: `docs/` now holds repo-facing per-node docs mirrored in
  `web/docs/` (in-app help), and the development reference material moved to
  `docs_devel/`.

## [0.1.0] - 2026-10-13

### Added

- `DisplayLabel` node ("Display Text Label"): renders up to five lines of text as
  a styled, auto-sizing label on the canvas, with configurable font size, color,
  background, alignment, weight, and per-line text inputs.
- `ResolutionCalculator` node ("Resolution Calculator"): converts an aspect ratio
  and target megapixel count into width/height integers, in Standard (curated
  video sizes) or Custom (rounded to a multiple) mode.
- Client-side extensions under `web/js/` for both nodes, plus per-node Markdown
  documentation under `web/docs/`.
- Node metadata: `DESCRIPTION`, per-input tooltips, `OUTPUT_TOOLTIPS`, and
  `SEARCH_ALIASES`.
- Registry packaging metadata in `pyproject.toml`, including publisher, license,
  and repository/URL fields.
- `LICENSE` (GNU GPL v3), `MANIFEST.in`, and `.comfyignore`.

[Unreleased]: https://github.com/meunodulo/ComfyUI-Meunodulo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/meunodulo/ComfyUI-Meunodulo/releases/tag/v0.1.0
