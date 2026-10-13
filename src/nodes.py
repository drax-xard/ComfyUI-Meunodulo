import math


class DisplayLabel:
    """A purely visual node that renders up to five text lines as a styled
    label inside the node body on the ComfyUI canvas.

    The label styling and rendering are handled client side (see
    ``web/js/label.js``). The Python side only defines the widgets used to
    configure the node and re-emits the combined text through the ``ui``
    channel so that text received from connected inputs is reflected in the
    label after the graph is queued.
    """

    CATEGORY = "Meunodulo"

    DESCRIPTION = (
        "Renders up to five text lines as a styled label directly on the "
        "ComfyUI canvas. Purely visual: it has no outputs and does not affect "
        "the generated image. Use it to annotate or comment parts of a graph."
    )

    SEARCH_ALIASES = ["text", "note", "comment", "annotation", "caption", "display"]

    # Shared with web/js/label.js - keep the preset keys/values in sync.
    FONT_COLORS = ["white", "black", "red", "green", "blue", "yellow", "orange", "purple", "gray"]

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "font_size": ("INT", {"default": 24, "min": 6, "max": 256, "step": 1,
                    "tooltip": "Font size of the label text, in pixels."}),
                "font_color": (cls.FONT_COLORS + ["custom"], {"default": "white",
                    "tooltip": "Preset text color, or 'custom' to use the hex value below."}),
                "font_custom_color": ("STRING", {"default": "#FFFFFF",
                    "tooltip": "Text color as a hex value (used when font_color is 'custom')."}),
                "bg_color": (["none"] + cls.FONT_COLORS + ["custom"], {"default": "none",
                    "tooltip": "Background color behind the text, or 'none' for transparent."}),
                "bg_custom_color": ("STRING", {"default": "#000000",
                    "tooltip": "Background color as a hex value (used when bg_color is 'custom')."}),
                "text_align": (["left", "center", "right"], {"default": "left",
                    "tooltip": "Horizontal alignment of the text inside the node."}),
                "bold": ("BOOLEAN", {"default": False,
                    "tooltip": "Render the label text in bold."}),
                "italic": ("BOOLEAN", {"default": False,
                    "tooltip": "Render the label text in italic."}),
                "show_text_widgets": ("BOOLEAN", {"default": True,
                    "tooltip": "Show the five text input widgets on the node. Hide them for a cleaner look once the text is set."}),
            },
            "optional": {
                "text_1": ("STRING", {"default": "", "multiline": False,
                    "tooltip": "First line of the label. Accepts a connected STRING input."}),
                "text_2": ("STRING", {"default": "", "multiline": False,
                    "tooltip": "Second line of the label. Accepts a connected STRING input."}),
                "text_3": ("STRING", {"default": "", "multiline": False,
                    "tooltip": "Third line of the label. Accepts a connected STRING input."}),
                "text_4": ("STRING", {"default": "", "multiline": False,
                    "tooltip": "Fourth line of the label. Accepts a connected STRING input."}),
                "text_5": ("STRING", {"default": "", "multiline": False,
                    "tooltip": "Fifth line of the label. Accepts a connected STRING input."}),
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "run"
    OUTPUT_NODE = True

    def run(self, text_1="", text_2="", text_3="", text_4="", text_5="", **kwargs):
        lines = []
        for value in (text_1, text_2, text_3, text_4, text_5):
            if value is None:
                continue
            if isinstance(value, (list, tuple)):
                value = "\n".join(str(v) for v in value)
            text = str(value)
            if text.strip():
                lines.append(text)
        combined = "\n".join(lines)
        return {"ui": {"meunodulo_text": [combined]}}


# --- Resolution Calculator -------------------------------------------------

# Numeric width/height ratio (landscape) for each base aspect ratio.
ASPECT_RATIOS = {
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "3:2": 3 / 2,
    "1:1": 1.0,
    "21:9": 21 / 9,
    "2.39:1": 2.39,
}

# Dropdown label -> (base ratio key, orientation).
ASPECT_ORIENTATIONS = {
    "16:9 (Landscape)": ("16:9", "landscape"),
    "9:16 (Portrait)": ("16:9", "portrait"),
    "4:3 (Landscape)": ("4:3", "landscape"),
    "3:4 (Portrait)": ("4:3", "portrait"),
    "3:2 (Landscape)": ("3:2", "landscape"),
    "2:3 (Portrait)": ("3:2", "portrait"),
    "1:1 (Square)": ("1:1", "square"),
    "21:9 (Ultrawide)": ("21:9", "landscape"),
    "9:21 (Vertical Ultrawide)": ("21:9", "portrait"),
    "2.39:1 (Cinematic Scope)": ("2.39:1", "landscape"),
}

# Curated standard resolutions, stored in landscape orientation. Portrait
# variants are produced by swapping width and height.
# Keep in sync with STANDARD in web/js/resolution.js.
STANDARD_RESOLUTIONS = {
    "16:9": [
        (640, 360), (854, 480), (960, 540), (1280, 720), (1600, 900),
        (1920, 1080), (2048, 1152), (2560, 1440), (3200, 1800),
        (3840, 2160), (4096, 2304), (5120, 2880), (7680, 4320),
    ],
    "4:3": [
        (320, 240), (400, 300), (512, 384), (640, 480), (800, 600),
        (960, 720), (1024, 768), (1280, 960), (1400, 1050), (1600, 1200),
        (2048, 1536), (3200, 2400),
    ],
    "3:2": [
        (1080, 720), (1500, 1000), (1620, 1080), (1800, 1200),
        (2160, 1440), (2400, 1600), (3000, 2000), (3600, 2400), (6000, 4000),
    ],
    "1:1": [
        (256, 256), (512, 512), (768, 768), (1024, 1024), (1280, 1280),
        (1536, 1536), (2048, 2048), (2560, 2560),
    ],
    "21:9": [(2560, 1080), (3440, 1440), (3840, 1600), (5120, 2160)],
    "2.39:1": [(1920, 804), (2048, 858), (3840, 1608), (4096, 1716)],
}


def calculate_resolution(aspect, mode, megapixels, multiple):
    """Return (width, height) for the selected aspect and target megapixels.

    In "Standard" mode the closest curated video resolution is returned. In
    "Custom" mode the dimensions are computed from the aspect ratio and rounded
    up to the next multiple of ``multiple``.
    """
    base, orientation = ASPECT_ORIENTATIONS.get(aspect, ("16:9", "landscape"))
    ratio = ASPECT_RATIOS.get(base, 16 / 9)
    target_pixels = float(megapixels) * 1_000_000.0

    if str(mode).lower().startswith("standard"):
        table = STANDARD_RESOLUTIONS.get(base, [(1024, 1024)])
        if orientation == "portrait":
            table = [(h, w) for (w, h) in table]
        return min(table, key=lambda wh: (abs(wh[0] * wh[1] - target_pixels), -(wh[0] * wh[1])))

    effective = (1.0 / ratio) if orientation == "portrait" else ratio
    step = max(1, int(multiple))
    width = math.sqrt(target_pixels * effective)
    height = math.sqrt(target_pixels / effective)
    width = max(step, int(math.ceil(width / step - 1e-9)) * step)
    height = max(step, int(math.ceil(height / step - 1e-9)) * step)
    return (width, height)


class ResolutionCalculator:
    """Turn a target megapixel count and aspect ratio into video dimensions.

    Standard mode snaps to well-known resolutions (SD, HD, 4K, vertical phone,
    cinematic, etc.); Custom mode computes dimensions rounded to a multiple.
    The resulting size is also drawn on the node face (see web/js/resolution.js).
    """

    CATEGORY = "Meunodulo"

    DESCRIPTION = (
        "Turns an aspect ratio and a target megapixel count into concrete "
        "width/height integers. Standard mode snaps to well-known video sizes "
        "(SD, HD, 4K, vertical phone, cinematic...); Custom mode computes the "
        "dimensions and rounds them up to a chosen multiple (e.g. 8/32/64)."
    )

    SEARCH_ALIASES = ["resolution", "size", "dimensions", "aspect ratio", "megapixels", "width", "height"]

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "aspect": (list(ASPECT_ORIENTATIONS.keys()), {"default": "16:9 (Landscape)",
                    "tooltip": "Target aspect ratio and orientation. Portrait variants swap width and height."}),
                "mode": (["Standard (video sizes)", "Custom (multiple)"], {"default": "Standard (video sizes)",
                    "tooltip": "Standard snaps to curated video resolutions; Custom computes from the ratio and rounds to a multiple."}),
                "megapixels": ("FLOAT", {"default": 1.0, "min": 0.01, "max": 64.0, "step": 0.1,
                    "tooltip": "Target output size in megapixels (1.0 MP = 1,000,000 pixels)."}),
                "multiple": ("INT", {"default": 32, "min": 4, "max": 256, "step": 1,
                    "tooltip": "Custom mode rounds width and height up to the nearest multiple of this value. Ignored in Standard mode."}),
            }
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    OUTPUT_TOOLTIPS = ("Computed width in pixels.", "Computed height in pixels.")
    FUNCTION = "run"

    def run(self, aspect, mode, megapixels, multiple):
        width, height = calculate_resolution(aspect, mode, megapixels, multiple)
        return {"ui": {"meunodulo_resolution": [f"{width}x{height}"]}, "result": (width, height)}


NODE_CLASS_MAPPINGS = {
    "DisplayLabel": DisplayLabel,
    "ResolutionCalculator": ResolutionCalculator,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DisplayLabel": "Display Text Label",
    "ResolutionCalculator": "Resolution Calculator",
}