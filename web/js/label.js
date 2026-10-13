import { app } from "../../scripts/app.js";

const NODE_CLASS = "MeunoduloLabel";

const PAD = 8;
const MIN_W = 180;
const MAX_W = 512;
const MIN_H = 60;

// Keep in sync with MeunoduloLabel.FONT_COLORS in src/nodes.py
const PALETTE = {
	white: "#FFFFFF",
	black: "#000000",
	red: "#E53935",
	green: "#43A047",
	blue: "#1E88E5",
	yellow: "#FDD835",
	orange: "#FB8C00",
	purple: "#8E24AA",
	gray: "#9E9E9E",
};

const offCtx = document.createElement("canvas").getContext("2d");

function getWidget(node, name) {
	return node.widgets?.find((w) => w.name === name);
}

function valueOf(node, name, fallback) {
	const w = getWidget(node, name);
	return w === undefined ? fallback : w.value;
}

function isHidden(widget) {
	return widget.hidden || widget.type === "hidden";
}

function rowHeight() {
	return ((globalThis.LiteGraph?.NODE_WIDGET_HEIGHT || 20) + 4);
}

function widgetSectionHeight(node) {
	let count = 0;
	for (const w of node.widgets ?? []) if (!isHidden(w)) count++;
	return count * rowHeight() + 8;
}

function fontString(node) {
	const size = Number(valueOf(node, "font_size", 24)) || 24;
	const bold = valueOf(node, "bold", false) ? "bold " : "";
	const italic = valueOf(node, "italic", false) ? "italic " : "";
	return `${italic}${bold}${size}px sans-serif`;
}

function fontSizeOf(node) {
	return Number(valueOf(node, "font_size", 24)) || 24;
}

function normalizeHex(value) {
	if (value === undefined || value === null) return null;
	let s = String(value).trim().replace(/^#/, "");
	if (/^[0-9a-fA-F]{3}$/.test(s)) {
		s = s.split("").map((c) => c + c).join("");
	}
	if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
	return "#" + s.toUpperCase();
}

function resolveColor(preset, customHex) {
	if (preset === "none") return null;
	if (preset === "custom") return normalizeHex(customHex);
	return PALETTE[preset] ?? null;
}

function wrapText(text, font, maxWidth) {
	offCtx.font = font;
	const out = [];
	for (const raw of String(text).split("\n")) {
		if (raw.trim() === "") {
			out.push("");
			continue;
		}
		let line = "";
		for (const token of raw.split(/(\s+)/)) {
			const test = line + token;
			if (line && offCtx.measureText(test).width > maxWidth) {
				out.push(line.replace(/\s+$/, ""));
				line = token.replace(/^\s+/, "");
			} else {
				line = test;
			}
		}
		out.push(line.replace(/\s+$/, ""));
	}
	return out;
}

function getDisplayText(node) {
	const parts = [];
	for (let i = 1; i <= 5; i++) {
		const v = valueOf(node, "text_" + i, "");
		if (v !== undefined && v !== null && String(v).trim()) parts.push(String(v));
	}
	if (parts.length) return parts.join("\n");
	return node.__meunoduloExecutedText || "";
}

function computeAutoSize(node) {
	const text = getDisplayText(node);
	const font = fontString(node);
	const maxContent = MAX_W - PAD * 2;
	const lines = text ? wrapText(text, font, maxContent) : [""];
	const lineHeight = Math.round(fontSizeOf(node) * 1.25);

	offCtx.font = font;
	let contentW = 0;
	for (const ln of lines) contentW = Math.max(contentW, offCtx.measureText(ln).width);

	const width = Math.min(MAX_W, Math.max(MIN_W, Math.ceil(contentW) + PAD * 2));
	const height = Math.max(MIN_H, Math.ceil(widgetSectionHeight(node) + lines.length * lineHeight + PAD));
	return [width, height];
}

function autosize(node) {
	if (node.flags?.collapsed) return;
	const [w, h] = computeAutoSize(node);
	node.setSize?.([w, h]);
}

function setTextWidgetsVisible(node, visible) {
	for (let i = 1; i <= 5; i++) {
		const w = getWidget(node, "text_" + i);
		if (!w) continue;
		if (visible) {
			w.hidden = false;
			w.type = w.__meunoduloOrigType ?? "text";
			if (w.__meunoduloOrigCompute) w.computeSize = w.__meunoduloOrigCompute;
		} else {
			w.__meunoduloOrigType = w.__meunoduloOrigType ?? w.type;
			w.__meunoduloOrigCompute = w.__meunoduloOrigCompute ?? w.computeSize;
			w.type = "hidden";
			w.hidden = true;
			w.computeSize = () => [0, -4];
		}
	}
}

function refresh(node) {
	setTextWidgetsVisible(node, !!valueOf(node, "show_text_widgets", true));
	autosize(node);
	node.setDirtyCanvas?.(true, true);
}

function wrapCallbacks(node) {
	if (node.__meunoduloWrapped) return;
	node.__meunoduloWrapped = true;
	for (const w of node.widgets ?? []) {
		const original = w.callback;
		w.callback = function (...args) {
			const r = original?.apply(this, args);
			refresh(node);
			return r;
		};
	}
}

function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

app.registerExtension({
	name: "meunodulo.label",
	async beforeRegisterNodeDef(nodeType, nodeData) {
		if (nodeData.name !== NODE_CLASS && nodeType.comfyClass !== NODE_CLASS) return;

		const onNodeCreated = nodeType.prototype.onNodeCreated;
		nodeType.prototype.onNodeCreated = function () {
			const r = onNodeCreated?.apply(this, arguments);
			wrapCallbacks(this);
			refresh(this);
			return r;
		};

		const onConfigure = nodeType.prototype.onConfigure;
		nodeType.prototype.onConfigure = function () {
			const r = onConfigure?.apply(this, arguments);
			wrapCallbacks(this);
			refresh(this);
			return r;
		};

		const onExecuted = nodeType.prototype.onExecuted;
		nodeType.prototype.onExecuted = function (message) {
			const r = onExecuted?.apply(this, arguments);
			if (message && message.meunodulo_text) {
				this.__meunoduloExecutedText = String(message.meunodulo_text[0] ?? "");
				refresh(this);
			}
			return r;
		};

		const onDrawForeground = nodeType.prototype.onDrawForeground;
		nodeType.prototype.onDrawForeground = function (ctx) {
			const r = onDrawForeground?.apply(this, arguments);

			if (this.flags?.collapsed) return r;

			const text = getDisplayText(this);
			if (!text) return r;

			const font = fontString(this);
			const fontSize = fontSizeOf(this);
			const align = valueOf(this, "text_align", "left");
			const fg = resolveColor(valueOf(this, "font_color", "white"), valueOf(this, "font_custom_color", "#FFFFFF")) || "#FFFFFF";
			const bg = resolveColor(valueOf(this, "bg_color", "none"), valueOf(this, "bg_custom_color", "#000000"));

			const top = widgetSectionHeight(this);
			const lineHeight = Math.round(fontSize * 1.25);
			const lines = wrapText(text, font, this.size[0] - PAD * 2);

			ctx.save();
			ctx.font = font;
			ctx.textBaseline = "top";

			if (bg) {
				ctx.fillStyle = bg;
				roundRect(ctx, 2, top - 4, this.size[0] - 4, lines.length * lineHeight + 8, 4);
				ctx.fill();
			}

			ctx.fillStyle = fg;
			ctx.textAlign = align;
			const x = align === "center" ? this.size[0] / 2 : align === "right" ? this.size[0] - PAD : PAD;
			for (let i = 0; i < lines.length; i++) {
				ctx.fillText(lines[i], x, top + i * lineHeight);
			}
			ctx.restore();

			return r;
		};
	},
});
