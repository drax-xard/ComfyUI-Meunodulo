// Shared helpers for Meunodulo client extensions.

export const measureCtx = document.createElement("canvas").getContext("2d");

export function getWidget(node, name) {
	return node.widgets?.find((w) => w.name === name);
}

export function valueOf(node, name, fallback) {
	const w = getWidget(node, name);
	return w === undefined ? fallback : w.value;
}

export function isHidden(widget) {
	return widget.hidden || widget.type === "hidden";
}

export function rowHeight() {
	return ((globalThis.LiteGraph?.NODE_WIDGET_HEIGHT || 20) + 4);
}

export function widgetSectionHeight(node) {
	let count = 0;
	for (const w of node.widgets ?? []) if (!isHidden(w)) count++;
	return count * rowHeight() + 8;
}

export function normalizeHex(value) {
	if (value === undefined || value === null) return null;
	let s = String(value).trim().replace(/^#/, "");
	if (/^[0-9a-fA-F]{3}$/.test(s)) {
		s = s.split("").map((c) => c + c).join("");
	}
	if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
	return "#" + s.toUpperCase();
}

export function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}
