export interface Track {
	id: string;
	title: string;
	artist: string;
	album: string;
	duration: number; // in seconds
	url: string; // Blob URL or synth identifier
	artwork: string; // CSS/SVG Gradient code or image URL
	genre: string;
	mood: "Happy" | "Chill" | "Focus" | "Sad" | "Energy";
	bengaliTitle?: string;
	bengaliArtist?: string;
	isFavorite: boolean;
	addedAt: string;
	playCount: number;
	skipCount: number;
	lastPlayedAt?: string;
	isPrivate?: boolean;
	lyrics?: { time: number; text: string }[]; // Array of lyrics lines
	waveform?: number[]; // Amplitude samples
	gainAdjustment?: number; // Gain multiplier
	size?: number; // File size in bytes
}

export interface Playlist {
	id: string;
	name: string;
	bengaliName?: string;
	description: string;
	trackIds: string[];
	isSmart?: boolean;
	smartCriteria?: string;
	createdAt: string;
}

export interface EqualizerPreset {
	name: string;
	bengaliName?: string;
	gains: number[]; // 5 bands: 60Hz, 230Hz, 910Hz, 4kHz, 14kHz
}

export type ThemeAccent =
	| "neon-blue"
	| "emerald"
	| "amber"
	| "rose"
	| "monochrome";

export interface UserSettings {
	language: "en" | "bn";
	bassBoost: number; // 0 to 100
	sleepTimerDuration: number | null; // minutes or null
	privateFolderPin: string | null;
	optimizationsEnabled: boolean; // Bluetooth/headphone profile
	vocalOnlyEnabled: boolean;
	vocalSuppressionLevel: number; // 0 to 100 percentage
	skipSilenceEnabled: boolean;
	playbackSpeed: number; // e.g. 0.5 to 2.0
	repeatMode: "none" | "one" | "twice" | "all";
	shuffleMode: boolean;
	themeAccent: ThemeAccent;
	hapticFeedbackEnabled: boolean;
	hapticIntensity: number; // 0 to 1
	minimalistMode: boolean; // Hide extra UI elements for cleaner look
	adaptiveAudio: boolean; // Smart equalization compression
	zenMode: boolean; // Full immersive mode
	volume: number;
	appName: string;
	appIcon: string; // Emoji OR icon identifier, base64 data stored in separate DB key
	crossfadeDuration: number; // 0 to 12 seconds
	lastPlayedTrackId?: string | null; // For resume playback
	lastPlayedTime?: number | null; // For resume playback
}

export type ActiveTab =
	| "home"
	| "library"
	| "playlists"
	| "search"
	| "settings"
	| "stats";
