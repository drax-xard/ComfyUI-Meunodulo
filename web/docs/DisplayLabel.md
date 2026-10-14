# Display Text Label

> Node class: `DisplayLabel` · Display name: **Display Text Label**

Renders up to five values as a styled label directly inside the node on the
workflow canvas. Useful for annotating a graph with titles, notes, or section
headers, and for inspecting any value flowing through the graph.

## Parameters

- **text_1 … text_5**: Optional input sockets that accept **any** data type
  (text, number, boolean, lists, ...). Connect any node output; its value is
  rendered as one line. Lines are stacked top to bottom in order and empty
  values are skipped. Because these are wildcard (`*`) inputs they show as
  sockets with no editable widget — feed them from another node (for example a
  primitive/constant node) instead of typing directly.
- **font_size**: Label font size in pixels (6 – 256).
- **font_color**: Preset color name (`white`, `black`, `red`, `green`, `blue`,
  `yellow`, `orange`, `purple`, `gray`) or `custom`.
- **font_custom_color**: Hex color used when *font_color* is `custom`.
- **bg_color**: Background color for the text block — a preset name, `none`, or
  `custom`.
- **bg_custom_color**: Hex color used when *bg_color* is `custom`.
- **text_align**: `left`, `center`, or `right`.
- **bold** / **italic**: Toggle font weight and style.

## Behavior

- The node automatically resizes to fit its text.
- Connected values are resolved at queue time and reflected in the label after
  the workflow runs.
- Numbers are shown as-is (whole floats lose their trailing `.0`); booleans as
  `True`/`False`; list values are shown one element per line.
- Because the label is a visual helper, it does not affect the generated output.

## Usage

1. Add **Meunodulo → Display Text Label** to your graph.
2. Connect any outputs to `text_1 … text_5` (numbers, text, booleans, ...).
3. Adjust font size, colors, alignment, and weight to taste.
4. Queue the prompt — the connected values appear in the label once the node
   runs.
