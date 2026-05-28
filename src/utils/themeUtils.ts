import type { UserSettings } from "../types";

const ACCENT_MAP = {
	emerald: {
		color: "emerald-500",
		rgb: "16, 185, 129",
		hex: "#10b981",
		text: "text-emerald-500",
		bg: "bg-emerald-500",
		bg10: "bg-emerald-500/10",
		bg20: "bg-emerald-500/20",
		bg50: "bg-emerald-500/50",
		border: "border-emerald-500",
		border30: "border-emerald-500/30",
		border40: "border-emerald-500/40",
		border50: "border-emerald-500/50",
		shadow: "shadow-emerald-500/20",
		from: "from-emerald-950/20",
		to: "to-emerald-900/30",
	},
	amber: {
		color: "amber-500",
		rgb: "245, 158, 11",
		hex: "#f59e0b",
		text: "text-amber-500",
		bg: "bg-amber-500",
		bg10: "bg-amber-500/10",
		bg20: "bg-amber-500/20",
		bg50: "bg-amber-500/50",
		border: "border-amber-500",
		border30: "border-amber-500/30",
		border40: "border-amber-500/40",
		border50: "border-amber-500/50",
		shadow: "shadow-amber-500/20",
		from: "from-amber-950/20",
		to: "to-amber-900/30",
	},
	rose: {
		color: "rose-500",
		rgb: "244, 63, 94",
		hex: "#f43f5e",
		text: "text-rose-500",
		bg: "bg-rose-500",
		bg10: "bg-rose-500/10",
		bg20: "bg-rose-500/20",
		bg50: "bg-rose-500/50",
		border: "border-rose-500",
		border30: "border-rose-500/30",
		border40: "border-rose-500/40",
		border50: "border-rose-500/50",
		shadow: "shadow-rose-500/20",
		from: "from-rose-950/20",
		to: "to-rose-900/30",
	},
	monochrome: {
		color: "neutral-200",
		rgb: "240, 240, 240",
		hex: "#f0f0f0",
		text: "text-neutral-200",
		bg: "bg-neutral-200",
		bg10: "bg-neutral-200/10",
		bg20: "bg-neutral-200/20",
		bg50: "bg-neutral-200/50",
		border: "border-neutral-200",
		border30: "border-neutral-200/30",
		border40: "border-neutral-200/40",
		border50: "border-neutral-200/50",
		shadow: "shadow-neutral-200/20",
		from: "from-neutral-800/20",
		to: "to-neutral-900/30",
	},
	"neon-blue": {
		color: "blue-500",
		rgb: "59, 130, 246",
		hex: "#3b82f6",
		text: "text-blue-500",
		bg: "bg-blue-500",
		bg10: "bg-blue-500/10",
		bg20: "bg-blue-500/20",
		bg50: "bg-blue-500/50",
		border: "border-blue-500",
		border30: "border-blue-500/30",
		border40: "border-blue-500/40",
		border50: "border-blue-500/50",
		shadow: "shadow-blue-500/20",
		from: "from-blue-950/20",
		to: "to-blue-900/30",
	},
};

export const getAccentGradient = (accent: UserSettings["themeAccent"]) => {
	const map = {
		emerald: "from-emerald-500/20 via-emerald-500/5 to-transparent",
		amber: "from-amber-500/20 via-amber-500/5 to-transparent",
		rose: "from-rose-500/20 via-rose-500/5 to-transparent",
		monochrome: "from-neutral-200/20 via-neutral-200/5 to-transparent",
		"neon-blue": "from-blue-500/20 via-blue-500/5 to-transparent",
	};
	return map[accent];
};

export const getAccentColor = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].color;
export const getAccentRGB = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].rgb;
export const getAccentHex = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].hex;
export const getAccentTextClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].text;
export const getAccentBgClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].bg;
export const getAccentBg10Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].bg10;
export const getAccentBg20Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].bg20;
export const getAccentBg50Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].bg50;
export const getAccentBorderClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].border;
export const getAccentBorder30Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].border30;
export const getAccentBorder40Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].border40;
export const getAccentBorder50Class = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].border50;
export const getAccentShadowClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].shadow;
export const getAccentFromClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].from;
export const getAccentToClass = (accent: UserSettings["themeAccent"]) =>
	ACCENT_MAP[accent].to;

export const applyTheme = (accent: UserSettings["themeAccent"]) => {
	const root = document.documentElement;
	root.style.setProperty("--accent-color", getAccentHex(accent));
};

// Legacy support if needed, but discouraged in v4
export const getAccentColorClass = (
	accent: UserSettings["themeAccent"],
	prefix: string = "text",
) => `${prefix}-${getAccentColor(accent)}`;
