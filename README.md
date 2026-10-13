# ComfyUI-Meunodulo

This project is a repository for the development of custom nodes for the
[ComfyUI](https://github.com/comfyanonymous/ComfyUI) generative AI software,
under the collective name of **ComfyUI-Meunodulo**.

## Nodes

| Node | Description |
| --- | --- |
| **Label (Meunodulo)** | Renders up to five lines of text as a styled, auto-sizing label inside the node on the workflow canvas. |

## Installation

Clone this repository into your ComfyUI `custom_nodes` directory:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/meunodulo/ComfyUI-Meunodulo.git
```

Then restart ComfyUI and reload the web page. No additional Python
dependencies are required.

## Development

The repository follows the standard ComfyUI custom node layout:

```
ComfyUI-Meunodulo/
├── __init__.py            # registers node mappings and WEB_DIRECTORY
├── src/nodes.py           # Python node definitions
├── web/js/                # client-side JavaScript extensions
├── web/docs/              # per-node markdown documentation
├── docs/                  # reference notes on custom node development
└── pyproject.toml         # packaging / registry metadata
```

The `docs` folder contains several text files with basic information on custom
node development. More information can be found at:
https://docs.comfy.org/custom-nodes/intro
