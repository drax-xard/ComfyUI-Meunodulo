import { app } from "../../../scripts/app.js";
import { valueOf, widgetSectionHeight, measureContext } from "./util.js";

const NODE_CLASS = "ResolutionCalculator";

const PAD = 8;
const MIN_W = 240;
const MAX_W = 420;
const MIN_H = 40;
const LINE1 = 22;
const LINE2 = 12;
const GAP = 2;
const BLOCK_H = Math.round(LINE1 * 1.3) + GAP + Math.round(LINE2 * 1.3);

// Keep in sync with src/nodes.py (ASPECT_RATIOS, ASPECT_ORIENTATIONS,
// STANDARD_RESOLUTIONS).
const RATIOS = {
	"16:9": 16 / 9,
	"4:3": 4 / 3,
	"3:2": 3 / 2,
	"1:1": 1.0,
	"21:9": 21 / 9,
	"2.39:1": 2.39,
};

const ASPECTS = {
	"16:9 (Landscape)": ["16:9", "landscape"],
	"9:16 (Portrait)": ["16:9", "portrait"],
	"4:3 (Landscape)": ["4:3", "landscape"],
	"3:4 (Portrait)": ["4:3", "portrait"],
	"3:2 (Landscape)": ["3:2", "landscape"],
	"2:3 (Portrait)": ["3:2", "portrait"],
	"1:1 (Square)": ["1:1", "square"],
	"21:9 (Ultrawide)": ["21:9", "landscape"],
	"9:21 (Vertical Ultrawide)": ["21:9", "portrait"],
	"2.39:1 (Cinematic Scope)": ["2.39:1", "landscape"],
};

const STANDARD = {
	"16:9": [
		[640, 360], [854, 480], [960, 540], [1280, 720], [1600, 900],
		[1920, 1080], [2048, 1152], [2560, 1440], [3200, 1800],
		[3840, 2160], [4096, 2304], [5120, 2880], [7680, 4320],
	],
	"4:3": [
		[320, 240], [400, 300], [512, 384], [640, 480], [800, 600],
		[960, 720], [1024, 768], [1280, 960], [1400, 1050], [1600, 1200],
		[2048, 1536], [3200, 2400],
	],
	"3:2": [
		[1080, 720], [1500, 1000], [1620, 1080], [1800, 1200],
		[2160, 1440], [2400, 1600], [3000, 2000], [3600, 2400], [6000, 4000],
	],
	"1:1": [
		[256, 256], [512, 512], [768, 768], [1024, 1024], [1280, 1280],
		[1536, 1536], [2048, 2048], [2560, 2560],
	],
	"21:9": [[2560, 1080], [3440, 1440], [3840, 1600], [5120, 2160]],
	"2.39:1": [[1920, 804], [2048, 858], [3840, 1608], [4096, 1716]],
};

function resolve(node) {
	const aspect = valueOf(node, "aspect", "16:9 (Landscape)");
	const mode = String(valueOf(node, "mode", "Standard (video sizes)")).toLowerCase();
	let megapixels = Number(valueOf(node, "megapixels", 1));
	if (!Number.isFinite(megapixels) || megapixels < 0) megapixels = 0;
	let multiple = Math.round(Number(valueOf(node, "multiple", 32)));
	if (!Number.isFinite(multiple)) multiple = 32;
	multiple = Math.max(1, multiple);

	const [base, orientation] = ASPECTS[aspect] ?? ["16:9", "landscape"];
	const ratio = RATIOS[base] ?? 1;
	const target = megapixels * 1_000_000;

	if (mode.startsWith("standard")) {
		let table = STANDARD[base] ?? [[1024, 1024]];
		if (orientation === "portrait") table = table.map(([w, h]) => [h, w]);
		let best = table[0];
		let bestDiff = Infinity;
		let bestPx = -1;
		for (const [w, h] of table) {
			const px = w * h;
			const diff = Math.abs(px - target);
			if (diff < bestDiff || (diff === bestDiff && px > bestPx)) {
				best = [w, h];
				bestDiff = diff;
				bestPx = px;
			}
		}
		return best;
	}

	const effective = orientation === "portrait" ? 1 / ratio : ratio;
	let width = Math.sqrt(target * effective);
	let height = Math.sqrt(target / effective);
	width = Math.max(multiple, Math.ceil(width / multiple - 1e-9) * multiple);
	height = Math.max(multiple, Math.ceil(height / multiple - 1e-9) * multiple);
	return [width, height];
}

function current(node) {
	return node.__meunoduloRes || resolve(node);
}

function meta(node) {
	const [w, h] = current(node);
	const short = String(valueOf(node, "aspect", "16:9 (Landscape)")).split(" ")[0];
	const mp = (w * h) / 1_000_000;
	return { text: `${w} × ${h}`, sub: `${short}  ·  ${mp.toFixed(2)} MP` };
}

function computeAutoSize(node) {
	const { text, sub } = meta(node);
	const ctx = measureContext();
	ctx.font = `bold ${LINE1}px sans-serif`;
	const w1 = ctx.measureText(text).width;
	ctx.font = `${LINE2}px sans-serif`;
	const w2 = ctx.measureText(sub).width;

	const width = Math.min(MAX_W, Math.max(MIN_W, Math.ceil(Math.max(w1, w2)) + PAD * 2));
	const height = Math.max(MIN_H, Math.ceil(widgetSectionHeight(node) + BLOCK_H + PAD));
	return [width, height];
}

function redraw(node) {
	if (node.flags?.collapsed) return;
	const [w, h] = computeAutoSize(node);
	node.setSize?.([w, h]);
	node.setDirtyCanvas?.(true, true);
}

function wrapCallbacks(node) {
	for (const w of node.widgets ?? []) {
		if (w.__meunoduloWrapped) continue;
		w.__meunoduloWrapped = true;
		const original = w.callback;
		w.callback = function (...args) {
			const r = original?.apply(this, args);
			node.__meunoduloRes = null;
			redraw(node);
			return r;
		};
	}
}

app.registerExtension({
	name: "meunodulo.resolution",
	async beforeRegisterNodeDef(nodeType, nodeData) {
		if (nodeData.name !== NODE_CLASS && nodeType.comfyClass !== NODE_CLASS) return;

		const onNodeCreated = nodeType.prototype.onNodeCreated;
		nodeType.prototype.onNodeCreated = function () {
			const r = onNodeCreated?.apply(this, arguments);
			wrapCallbacks(this);
			redraw(this);
			return r;
		};

		const onConfigure = nodeType.prototype.onConfigure;
		nodeType.prototype.onConfigure = function () {
			const r = onConfigure?.apply(this, arguments);
			wrapCallbacks(this);
			redraw(this);
			return r;
		};

		const onExecuted = nodeType.prototype.onExecuted;
		nodeType.prototype.onExecuted = function (message) {
			const r = onExecuted?.apply(this, arguments);
			const raw = message?.meunodulo_resolution?.[0];
			if (typeof raw === "string") {
				const m = raw.match(/^(\d+)\s*x\s*(\d+)$/);
				if (m) this.__meunoduloRes = [Number(m[1]), Number(m[2])];
			}
			redraw(this);
			return r;
		};

		const onDrawForeground = nodeType.prototype.onDrawForeground;
		nodeType.prototype.onDrawForeground = function (ctx) {
			const r = onDrawForeground?.apply(this, arguments);

			if (this.flags?.collapsed) return r;

			const { text, sub } = meta(this);
			const top = widgetSectionHeight(this);
			const cx = this.size[0] / 2;
			const color = globalThis.LiteGraph?.NODE_TEXT_COLOR || "#DDDDDD";

			ctx.save();
			ctx.textBaseline = "top";
			ctx.textAlign = "center";

			ctx.font = `bold ${LINE1}px sans-serif`;
			ctx.fillStyle = color;
			ctx.fillText(text, cx, top);

			ctx.font = `${LINE2}px sans-serif`;
			ctx.globalAlpha = 0.65;
			ctx.fillText(sub, cx, top + Math.round(LINE1 * 1.3) + GAP);

			ctx.restore();
			return r;
		};
	},
});
