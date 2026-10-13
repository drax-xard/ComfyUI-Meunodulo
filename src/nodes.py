class MeunoduloLabel:
    """A purely visual node that renders up to five text lines as a styled
    label inside the node body on the ComfyUI canvas.

    The label styling and rendering are handled client side (see
    ``web/js/label.js``). The Python side only defines the widgets used to
    configure the node and re-emits the combined text through the ``ui``
    channel so that text received from connected inputs is reflected in the
    label after the graph is queued.
    """

    CATEGORY = "Meunodulo"

    # Shared with web/js/label.js - keep the preset keys/values in sync.
    FONT_COLORS = ["white", "black", "red", "green", "blue", "yellow", "orange", "purple", "gray"]

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "font_size": ("INT", {"default": 24, "min": 6, "max": 256, "step": 1}),
                "font_color": (cls.FONT_COLORS + ["custom"], {"default": "white"}),
                "font_custom_color": ("STRING", {"default": "#FFFFFF"}),
                "bg_color": (["none"] + cls.FONT_COLORS + ["custom"], {"default": "none"}),
                "bg_custom_color": ("STRING", {"default": "#000000"}),
                "text_align": (["left", "center", "right"], {"default": "left"}),
                "bold": ("BOOLEAN", {"default": False}),
                "italic": ("BOOLEAN", {"default": False}),
                "show_text_widgets": ("BOOLEAN", {"default": True}),
            },
            "optional": {
                "text_1": ("STRING", {"default": "", "multiline": False}),
                "text_2": ("STRING", {"default": "", "multiline": False}),
                "text_3": ("STRING", {"default": "", "multiline": False}),
                "text_4": ("STRING", {"default": "", "multiline": False}),
                "text_5": ("STRING", {"default": "", "multiline": False}),
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


NODE_CLASS_MAPPINGS = {
    "MeunoduloLabel": MeunoduloLabel,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MeunoduloLabel": "Label (Meunodulo)",
}
