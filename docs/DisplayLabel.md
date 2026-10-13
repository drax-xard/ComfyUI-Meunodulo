# Display Text Label

> Node class: `DisplayLabel` · Display name: **Display Text Label**

Renders up to five lines of text as a styled label directly inside the node on the
workflow canvas. Useful for annotating a graph with titles, notes, or section
headers without leaving the canvas.

## Parameters

- **text_1 … text_5**: Optional text lines. Each is a normal widget you can type
  into, and can also be turned into an input socket (right-click the widget →
  *Convert text to input*) to feed text from another node. Non-empty lines are
  stacked top to bottom in order.
- **font_size**: Label font size in pixels (6 – 256).
- **font_color**: Preset color name (`white`, `black`, `red`, `green`, `blue`,
  `yellow`, `orange`, `purple`, `gray`) or `custom`.
- **font_custom_color**: Hex color used when *font_color* is `custom`.
- **bg_color**: Background color for the text block — a preset name, `none`, or
  `custom`.
- **bg_custom_color**: Hex color used when *bg_color* is `custom`.
- **text_align**: `left`, `center`, or `right`.
- **bold** / **italic**: Toggle font weight and style.
- **show_text_widgets**: When disabled, the five text widgets are hidden so the
  node presents as a clean label. Re-enable it to edit the text again.

## Behavior

- The node automatically resizes to fit its text.
- Connected text inputs are resolved at queue time and reflected in the label
  after the workflow runs.
- Because the label is a visual helper, it does not affect the generated output.

## Usage

1. Add **Meunodulo → Display Text Label** to your graph.
2. Type into one or more of the text fields, or connect string outputs to them.
3. Adjust font size, colors, alignment, and weight to taste.
4. When you are happy with the look, set *show_text_widgets* to `false` to hide
   the editing widgets.
