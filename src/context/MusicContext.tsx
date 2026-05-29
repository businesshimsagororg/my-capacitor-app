import * as musicMetadata from "music-metadata-browser";
import { Capacitor } from "@capacitor/core";
import React, {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useReducer,
	useRef,
} from "react";
import type { ActiveTab, Track, UserSettings } from "../types";
import { audioEngine } from "../utils/audioEngine";
import { defaultTracks } from "../utils/defaultTracks";
import {
	deleteOfflineTrack,
	deletePlaylistDB,
	getOfflineTracks,
	getPlaylistsDB,
	getSettingsDB,
	saveOfflineTrack,
	savePlaylistDB,
	saveSettingsDB,
	updateTrackMetadata,
} from "../utils/indexedDB";
import { applyTheme } from "../utils/themeUtils";
import { type MusicState, musicReducer } from "./MusicReducer";

interface MusicContextType extends MusicState {
	setActiveTab: (tab: ActiveTab) => void;
	setSideMenuOpen: (open: boolean) => void;
	setPlayerExpanded: (expanded: boolean) => void;
	updateSettings: (newSettings: Partial<UserSettings>) => void;
	setSearchQuery: (q: string) => void;
	addToSearchHistory: (q: string) => void;
	clearSearchHistory: () => void;
	setQueue: (q: Track[]) => void;

	playTrack: (track: Track) => void;
	togglePlay: () => void;
	nextTrack: () => void;
	prevTrack: () => void;
	seekTrack: (seconds: number) => void;
	setVolume: (v: number) => void;
	toggleFavorite: (id: string) => void;
	importLocalFiles: (files: FileList) => Promise<void>;
	deleteTrack: (id: string) => void;
	importYoutubeUrl: (url: string) => Promise<void>;
	updateTrackTags: (track: Track) => void;
	createPlaylist: (name: string, description: string) => void;
	renamePlaylist: (id: string, name: string) => void;
	deletePlaylist: (id: string) => void;
	addTrackToPlaylist: (trackId: string, playlistId: string) => void;
	removeTrackFromPlaylist: (trackId: string, playlistId: string) => void;
	shuffleQueue: () => void;
	triggerHaptic: () => void;
	showIsland: (title: string, subtitle: string, icon: string) => void;
	islandNotification: { title: string; subtitle: string; icon: string } | null;

	privateFolderUnlocked: boolean; // Keeping one or two simple local UI states out of reducer if desired
	setPrivateFolderUnlocked: (unlocked: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
	language: "en",
	bassBoost: 30,
	sleepTimerDuration: null,
	privateFolderPin: null,
	optimizationsEnabled: true,
	vocalOnlyEnabled: false,
	vocalSuppressionLevel: 70,
	skipSilenceEnabled: false,
	playbackSpeed: 1.0,
	repeatMode: "none",
	shuffleMode: false,
	themeAccent: "neon-blue",
	hapticFeedbackEnabled: true,
	hapticIntensity: 1,
	minimalistMode: false,
	adaptiveAudio: false,
	zenMode: false,
	volume: 0.8,
	appName: "ZMusic",
	appIcon: "🎵",
	crossfadeDuration: 3,
};

const INITIAL_STATE: MusicState = {
	tracks: [],
	playlists: [],
	currentTrack: null,
	queue: [],
	history: [],
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	activeTab: "home",
	isPlayerExpanded: false,
	isSideMenuOpen: false,
	settings: DEFAULT_SETTINGS,
	sleepTimerSeconds: null,
	searchQuery: "",
	searchHistory: [],
	isInitializing: true,
};

const gradients = [
	"linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)",
	"linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
	"linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)",
	"linear-gradient(135deg, #4da0b0 0%, #d39d38 100%)",
	"linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
	"linear-gradient(135deg, #0f0c20 0%, #302b63 50%, #24243e 100%)",
	"linear-gradient(135deg, #ad5389 0%, #3c1053 100%)",
];

const artworkCache = new Map<string, string>();
const ARTWORK_CACHE_LIMIT = 100;
const getArtworkImage = (artworkCss: string, label: string): string => {
	const cacheKey = `${artworkCss}-${label}`;
	if (artworkCache.has(cacheKey)) {
		const val = artworkCache.get(cacheKey)!;
		artworkCache.delete(cacheKey);
		artworkCache.set(cacheKey, val);
		return val;
	}
	if (!artworkCss)
		return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="%23010101"/></svg>';
	if (artworkCss.startsWith("data:") || artworkCss.startsWith("http")) {
		if (artworkCache.size >= ARTWORK_CACHE_LIMIT) {
			const firstKey = artworkCache.keys().next().value;
			if (firstKey !== undefined) artworkCache.delete(firstKey);
		}
		artworkCache.set(cacheKey, artworkCss);
		return artworkCss;
	}
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 512;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const gradient = ctx.createLinearGradient(0, 0, 512, 512);
			const hexColors = artworkCss.match(/#[0-9a-fA-F]{3,8}/g);
			if (hexColors && hexColors.length >= 2) {
				hexColors.forEach((color, idx) =>
					gradient.addColorStop(idx / (hexColors.length - 1), color),
				);
			} else {
				gradient.addColorStop(0, "#020024");
				gradient.addColorStop(1, "#00d4ff");
			}
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, 512, 512);
			ctx.beginPath();
			ctx.arc(256, 256, 180, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
			ctx.fill();
			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 200px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(label.slice(0, 1).toUpperCase() || "Z", 256, 256);
			const dataUrl = canvas.toDataURL("image/png");
			if (artworkCache.size >= ARTWORK_CACHE_LIMIT) {
				const firstKey = artworkCache.keys().next().value;
				if (firstKey !== undefined) artworkCache.delete(firstKey);
			}
			artworkCache.set(cacheKey, dataUrl);
			return dataUrl;
		}
	} catch (error) {
		console.error(error);
	}
	return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="%2309090b"/></svg>';
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [state, dispatch] = useReducer(musicReducer, INITIAL_STATE);
	const [privateFolderUnlocked, setPrivateFolderUnlocked] =
		React.useState(false);
	const [islandNotification, setIslandNotification] = React.useState<{
		title: string;
		subtitle: string;
		icon: string;
	} | null>(null);

	const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
	const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const latestCallbacksRef = useRef<
		(MusicState & { handleTrackEnded: () => void }) | null
	>(null);
	const repeatCountRef = useRef<number>(0);
	const lastTimeUpdateRef = useRef<number>(0);
	const latestSettingsRef = useRef<UserSettings>(DEFAULT_SETTINGS);

	useEffect(() => {
		latestSettingsRef.current = state.settings;
		applyTheme(state.settings.themeAccent);
	}, [state.settings]);

	const triggerHaptic = () => {
		if (state.settings.hapticFeedbackEnabled && "vibrate" in navigator)
			navigator.vibrate(12 * (state.settings.hapticIntensity || 1));
	};
	const showIsland = (title: string, subtitle: string, icon: string) => {
		setIslandNotification({ title, subtitle, icon });
		setTimeout(() => setIslandNotification(null), 4500);
	};

	useEffect(() => {
		audioEngine.setCallbacks(
			(currentTime, duration) => {
				const now = Date.now();
				if (now - lastTimeUpdateRef.current >= 1000) {
					dispatch({ type: "SET_CURRENT_TIME", payload: currentTime });
					dispatch({ type: "SET_DURATION", payload: duration });
					lastTimeUpdateRef.current = now;
				}
			},
			() => {
				latestCallbacksRef.current?.handleTrackEnded();
			},
		);

		const init = async () => {
			try {
				dispatch({ type: "SET_INITIALIZING", payload: true });
				const dbPlaylists = await getPlaylistsDB();
				let playlistsToSet = dbPlaylists;
				if (dbPlaylists.length === 0) {
					playlistsToSet = [
						{
							id: "pl-favorites",
							name: "Liked Songs",
							bengaliName: "পছন্দের গান",
							description: "Your offline favorite songs",
							trackIds: [],
							isSmart: true,
							smartCriteria: "favorites",
							createdAt: new Date().toISOString(),
						},
						{
							id: "pl-recent",
							name: "Recently Added",
							bengaliName: "সম্প্রতি যোগ করা",
							description: "Tracks added in the last 7 days",
							trackIds: [],
							isSmart: true,
							smartCriteria: "recent",
							createdAt: new Date().toISOString(),
						},
						{
							id: "pl-heavy",
							name: "Heavy Rotation",
							bengaliName: "বেশি শোনা গান",
							description: "Your most played tracks (> 5 plays)",
							trackIds: [],
							isSmart: true,
							smartCriteria: "heavy-rotation",
							createdAt: new Date().toISOString(),
						},
					];
					for (const pl of playlistsToSet) await savePlaylistDB(pl);
				}
				dispatch({ type: "SET_PLAYLISTS", payload: playlistsToSet });

				const dbSettings = await getSettingsDB();
				if (dbSettings) {
					dispatch({ type: "UPDATE_SETTINGS", payload: dbSettings });
					audioEngine.setVolume(dbSettings.volume ?? 0.8);
					audioEngine.setBassBoost(dbSettings.bassBoost);
					audioEngine.setSpatialOptimization(dbSettings.optimizationsEnabled);
					audioEngine.setVocalOnly(!!dbSettings.vocalOnlyEnabled);
					audioEngine.setPlaybackSpeed(dbSettings.playbackSpeed || 1.0);
				}

				const stored = await getOfflineTracks();
				const reconstituted = stored.map((item) => ({
					...item.track,
					url: URL.createObjectURL(item.blob),
				}));
				const all = [...defaultTracks, ...reconstituted];
				dispatch({ type: "SET_TRACKS", payload: all });
				dispatch({ type: "SET_QUEUE", payload: all });

				if (dbSettings?.lastPlayedTrackId) {
					const lastTrack = all.find(
						(t) => t.id === dbSettings.lastPlayedTrackId,
					);
					if (lastTrack) {
						dispatch({ type: "SET_CURRENT_TRACK", payload: lastTrack });
						if (dbSettings.lastPlayedTime) {
							// Seek after engine is ready
							setTimeout(
								() => audioEngine.seek(dbSettings.lastPlayedTime!),
								500,
							);
						}
					}
				} else if (all.length > 0)
					dispatch({ type: "SET_CURRENT_TRACK", payload: all[0] });
			} catch (err) {
				console.error(err);
			} finally {
				dispatch({ type: "SET_INITIALIZING", payload: false });
			}
		};
		init();

		return () => {
			state.tracks.forEach((t) => {
				if (t.id.startsWith("local-")) URL.revokeObjectURL(t.url);
			});
			audioEngine.cleanup();
		};
	}, []);

	useEffect(() => {
		const refreshSmartPlaylists = async () => {
			if (state.playlists.length === 0 || state.tracks.length === 0) return;

			let changed = false;
			const updatedPlaylists = state.playlists.map((pl) => {
				if (!pl.isSmart || !pl.smartCriteria) return pl;

				let newIds: string[] = [];
				if (pl.smartCriteria === "favorites") {
					newIds = state.tracks.filter((t) => t.isFavorite).map((t) => t.id);
				} else if (pl.smartCriteria === "recent") {
					const sevenDaysAgo = new Date();
					sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
					newIds = state.tracks
						.filter((t) => new Date(t.addedAt) >= sevenDaysAgo)
						.sort(
							(a, b) =>
								new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
						)
						.map((t) => t.id);
				} else if (pl.smartCriteria === "heavy-rotation") {
					newIds = state.tracks
						.filter((t) => (t.playCount || 0) > 5)
						.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
						.map((t) => t.id);
				}

				if (JSON.stringify(newIds) !== JSON.stringify(pl.trackIds)) {
					changed = true;
					return { ...pl, trackIds: newIds };
				}
				return pl;
			});

			if (changed) {
				dispatch({ type: "SET_PLAYLISTS", payload: updatedPlaylists });
			}
		};

		refreshSmartPlaylists();
	}, [state.playlists, state.tracks.length]);

	useEffect(() => {
		if (!state.currentTrack || !("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = state.isPlaying
			? "playing"
			: "paused";
		const title =
			state.settings.language === "bn" && state.currentTrack.bengaliTitle
				? state.currentTrack.bengaliTitle
				: state.currentTrack.title;
		const artist =
			state.settings.language === "bn" && state.currentTrack.bengaliArtist
				? state.currentTrack.bengaliArtist
				: state.currentTrack.artist;
		navigator.mediaSession.metadata = new MediaMetadata({
			title,
			artist,
			album: state.currentTrack.album || "ZMusic",
			artwork: [
				{
					src: getArtworkImage(state.currentTrack.artwork, title),
					sizes: "512x512",
					type: "image/png",
				},
			],
		});
	}, [state.currentTrack, state.isPlaying, state.settings.language]);

	// Sleep Timer Logic
	useEffect(() => {
		if (state.sleepTimerSeconds === null) {
			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
			return;
		}

		if (state.sleepTimerSeconds <= 0) {
			dispatch({ type: "SET_SLEEP_TIMER", payload: null });
			dispatch({ type: "SET_IS_PLAYING", payload: false });
			showIsland("Sleep Mode", "Playback stopped", "💤");
			return;
		}

		if (state.sleepTimerSeconds <= 30 && state.sleepTimerSeconds > 29) {
			audioEngine.fadeOutAndStop(30);
		}

		countdownTimerRef.current = setTimeout(() => {
			if (state.sleepTimerSeconds !== null) {
				const nextSeconds = state.sleepTimerSeconds - 1;
				dispatch({ type: "SET_SLEEP_TIMER", payload: nextSeconds });
			}
		}, 1000);

		return () => {
			if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
		};
	}, [state.sleepTimerSeconds, showIsland]);

	const updateSettings = (newSettings: Partial<UserSettings>) => {
		const updated = { ...latestSettingsRef.current, ...newSettings };
		dispatch({ type: "UPDATE_SETTINGS", payload: newSettings });
		saveSettingsDB(updated).catch((e) => console.error(e));
		if (newSettings.bassBoost !== undefined)
			audioEngine.setBassBoost(newSettings.bassBoost);
		if (newSettings.optimizationsEnabled !== undefined)
			audioEngine.setSpatialOptimization(newSettings.optimizationsEnabled);
		if (newSettings.vocalOnlyEnabled !== undefined)
			audioEngine.setVocalOnly(newSettings.vocalOnlyEnabled);
		if (newSettings.playbackSpeed !== undefined)
			audioEngine.setPlaybackSpeed(newSettings.playbackSpeed);
		if (newSettings.crossfadeDuration !== undefined)
			audioEngine.setCrossfadeDuration(newSettings.crossfadeDuration);

		if (newSettings.sleepTimerDuration !== undefined) {
			if (newSettings.sleepTimerDuration === null) {
				dispatch({ type: "SET_SLEEP_TIMER", payload: null });
			} else {
				dispatch({
					type: "SET_SLEEP_TIMER",
					payload: newSettings.sleepTimerDuration * 60,
				});
			}
		}
	};

	const playTrack = (track: Track, isRepeat = false) => {
		triggerHaptic();
		dispatch({ type: "SET_CURRENT_TRACK", payload: track });
		dispatch({ type: "SET_IS_PLAYING", payload: true });
		updateSettings({ lastPlayedTrackId: track.id, lastPlayedTime: 0 });
		audioEngine.play(track);
		if (!isRepeat) {
			repeatCountRef.current = 0;
			dispatch({ type: "ADD_TO_HISTORY", payload: track });
		}
		const updatedTrack = {
			...track,
			playCount: track.playCount + 1,
			lastPlayedAt: new Date().toISOString(),
		};
		dispatch({ type: "UPDATE_TRACK", payload: updatedTrack });
		updateTrackMetadata(updatedTrack).catch((e) => console.error(e));
	};

	const togglePlay = () => {
		triggerHaptic();
		if (!state.currentTrack) return;
		if (state.isPlaying) {
			audioEngine.pause();
			dispatch({ type: "SET_IS_PLAYING", payload: false });
		} else {
			audioEngine.resume();
			dispatch({ type: "SET_IS_PLAYING", payload: true });
		}
	};

	const nextTrack = () => {
		if (state.queue.length === 0 || !state.currentTrack) return;
		const curIdx = state.queue.findIndex(
			(t) => t.id === state.currentTrack?.id,
		);

		// Increment skip count for the skipped track
		if (state.currentTrack) {
			const updatedSkip = {
				...state.currentTrack,
				skipCount: (state.currentTrack.skipCount || 0) + 1,
			};
			dispatch({ type: "UPDATE_TRACK", payload: updatedSkip });
			updateTrackMetadata(updatedSkip).catch((e) => console.error(e));
		}

		const nextIdx = (curIdx + 1) % state.queue.length;
		playTrack(state.queue[nextIdx]);
	};

	const prevTrack = () => {
		if (state.queue.length === 0 || !state.currentTrack) return;
		const curIdx = state.queue.findIndex(
			(t) => t.id === state.currentTrack?.id,
		);
		const prevIdx = (curIdx - 1 + state.queue.length) % state.queue.length;
		playTrack(state.queue[prevIdx]);
	};

	const handleTrackEnded = () => {
		const currentRefs = latestCallbacksRef.current;
		if (!currentRefs) return;
		const { currentTrack, queue, settings } = currentRefs;
		if (!currentTrack) return;
		if (
			settings.repeatMode === "one" ||
			(settings.repeatMode === "twice" && repeatCountRef.current < 2)
		) {
			if (settings.repeatMode === "twice") repeatCountRef.current++;
			playTrack(currentTrack, true);
		} else if (
			settings.repeatMode === "all" ||
			(settings.repeatMode === "twice" && repeatCountRef.current >= 2)
		) {
			repeatCountRef.current = 0;
			nextTrack();
		} else {
			const idx = queue.findIndex((t: any) => t.id === currentTrack.id);
			if (idx < queue.length - 1) playTrack(queue[idx + 1]);
			else {
				audioEngine.pause();
				dispatch({ type: "SET_IS_PLAYING", payload: false });
			}
		}
	};

	const seekTrack = (secs: number) => {
		audioEngine.seek(secs);
		dispatch({ type: "SET_CURRENT_TIME", payload: secs });
	};
	const setVolume = (v: number) => {
		audioEngine.setVolume(v);
		const updated = { ...state.settings, volume: v };
		dispatch({ type: "UPDATE_SETTINGS", payload: { volume: v } });
		if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
		volumeTimeoutRef.current = setTimeout(
			() => saveSettingsDB(updated).catch((e) => console.error(e)),
			1000,
		);
	};

	const toggleFavorite = (id: string) => {
		const track = state.tracks.find((t) => t.id === id);
		if (!track) return;
		const updated = { ...track, isFavorite: !track.isFavorite };
		dispatch({ type: "UPDATE_TRACK", payload: updated });
		updateTrackMetadata(updated).catch((e) => console.error(e));
	};

	const importLocalFiles = async (files: FileList) => {
		const newTracks: Track[] = [];
		let duplicateCount = 0;

		for (let i = 0; i < files.length; i++) {
			showIsland("Importing", `Processing ${i + 1} of ${files.length}`, "🎵");
			const file = files[i];
			let metadata;
			try {
				metadata = await musicMetadata.parseBlob(file);
			} catch (e) {
				console.error("Failed to parse metadata", e);
			}
			const title =
				metadata?.common.title ||
				file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

			// Improved Duplicate Detection
			const isDuplicate = state.tracks.some(
				(t) =>
					t.title.toLowerCase() === title.toLowerCase() && t.size === file.size,
			);

			if (isDuplicate) {
				duplicateCount++;
				continue;
			}

			let artworkUrl = gradients[Math.floor(Math.random() * gradients.length)];
			if (metadata?.common.picture && metadata.common.picture.length > 0) {
				const blob = new Blob([metadata.common.picture[0].data], {
					type: metadata.common.picture[0].format,
				});
				artworkUrl = URL.createObjectURL(blob);
			}

			// Waveform and Gain Processing
			const waveform: number[] = [];
			let gainAdjustment = 1.0;
			try {
				const arrayBuffer = await file.arrayBuffer();
				const sampleRate = 44100;
				const duration = metadata?.format.duration || 180;
				const bufferLength = Math.ceil(Math.min(duration, 60) * sampleRate);
				const offlineCtx = new OfflineAudioContext(1, bufferLength, sampleRate);

				const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
				const data = audioBuffer.getChannelData(0);

				// Waveform peaks
				const step = Math.ceil(data.length / 100);
				for (let j = 0; j < 100; j++) {
					let sum = 0;
					for (let k = 0; k < step; k++)
						sum += Math.abs(data[j * step + k] || 0);
					waveform.push(sum / step);
				}

				// RMS Gain
				let sumSquares = 0;
				for (let j = 0; j < data.length; j++) sumSquares += data[j] * data[j];
				const rms = Math.sqrt(sumSquares / data.length);
				gainAdjustment = rms > 0 ? Math.min(2.0, 0.4 / rms) : 1.0;
			} catch (e) {
				console.error("Audio processing failed", e);
			}

			const url = URL.createObjectURL(file);
			const duration = metadata?.format.duration || 180;
			const newTrack: Track = {
				id: `local-${Date.now()}-${i}`,
				title,
				artist: metadata?.common.artist || "Offline",
				album: metadata?.common.album || "Local",
				duration,
				url,
				artwork: artworkUrl,
				genre: metadata?.common.genre?.[0] || "Local",
				mood: "Chill",
				isFavorite: false,
				addedAt: new Date().toISOString(),
				playCount: 0,
				skipCount: 0,
				lyrics: [],
				waveform,
				gainAdjustment,
				size: file.size,
			};
			await saveOfflineTrack(newTrack, file);
			newTracks.push(newTrack);
		}

		if (duplicateCount > 0) {
			showIsland(
				"Duplicates Skipped",
				`${duplicateCount} files already in library`,
				"🚫",
			);
		}

		if (newTracks.length > 0) {
			const updatedTracks = [...state.tracks, ...newTracks];
			dispatch({ type: "SET_TRACKS", payload: updatedTracks });

			const updatedQueue = [...state.queue, ...newTracks];
			dispatch({ type: "SET_QUEUE", payload: updatedQueue });

			if (state.settings.shuffleMode) {
				shuffleQueue();
			}
		}
	};

	const isNative = () => Capacitor.isNativePlatform();

	const importYoutubeUrl = async (url: string) => {
		if (!url) return;
		if (isNative()) {
			showIsland("Stand-alone App", "YouTube import is server-only. Run on Web to import.", "⚠️");
			return;
		}
		try {
			showIsland("YouTube", "Fetching details…", "🌐");

			const infoRes = await fetch(
				`/api/youtube/info?url=${encodeURIComponent(url)}`,
			);
			if (!infoRes.ok) {
				const err = await infoRes.json();
				throw new Error(err.error || "Failed to fetch info");
			}
			const info = await infoRes.json();

			showIsland("YouTube", `Downloading: ${info.title}`, "⏳");

			const dlRes = await fetch(
				`/api/youtube/download?url=${encodeURIComponent(url)}`,
			);
			if (!dlRes.ok) throw new Error("Download failed");
			const blob = await dlRes.blob();

			showIsland("YouTube", "Analysing audio…", "🔬");

			// --- Same processing as local file imports ---
			const waveform: number[] = [];
			let gainAdjustment = 1.0;
			try {
				const arrayBuffer = await blob.arrayBuffer();
				const duration = Number(info.duration) || 300;
				const sampleRate = 44100;
				const maxSamples = Math.min(
					Math.ceil(duration * sampleRate),
					sampleRate * 600,
				); // cap at 10min
				const offlineCtx = new OfflineAudioContext(1, maxSamples, sampleRate);
				const audioBuffer = await offlineCtx.decodeAudioData(
					arrayBuffer.slice(0),
				);
				const data = audioBuffer.getChannelData(0);

				const step = Math.ceil(data.length / 100);
				for (let j = 0; j < 100; j++) {
					let sum = 0;
					for (let k = 0; k < step; k++)
						sum += Math.abs(data[j * step + k] || 0);
					waveform.push(sum / step);
				}

				let sumSquares = 0;
				for (let j = 0; j < data.length; j++) sumSquares += data[j] * data[j];
				const rms = Math.sqrt(sumSquares / data.length);
				gainAdjustment = rms > 0 ? Math.min(2.0, 0.4 / rms) : 1.0;
			} catch (e) {
				console.warn("Audio analysis failed for YT track:", e);
			}

			const newTrack: Track = {
				id: `yt-${Date.now()}`,
				title: info.title,
				artist: info.author,
				album: "YouTube",
				duration: Number(info.duration) || 0,
				url: URL.createObjectURL(blob),
				artwork: info.thumbnail,
				genre: "YouTube",
				mood: "Chill",
				isFavorite: false,
				addedAt: new Date().toISOString(),
				playCount: 0,
				skipCount: 0,
				lyrics: [],
				waveform,
				gainAdjustment,
				size: blob.size,
			};

			await saveOfflineTrack(newTrack, blob);

			dispatch({ type: "SET_TRACKS", payload: [...state.tracks, newTrack] });
			dispatch({ type: "SET_QUEUE", payload: [...state.queue, newTrack] });
			if (state.settings.shuffleMode) shuffleQueue();

			showIsland("YouTube", "Added to library ✓", "✅");
		} catch (error: any) {
			console.error(error);
			showIsland("YouTube Error", error.message || "Import failed", "❌");
		}
	};

	const deleteTrack = async (id: string) => {
		const track = state.tracks.find((t) => t.id === id);
		if ((!id.startsWith("local-") && !id.startsWith("yt-")) || !track) return;
		await deleteOfflineTrack(id);

		// Revoke blob URL to avoid memory leaks
		if (track.url.startsWith("blob:")) {
			URL.revokeObjectURL(track.url);
		}
		if (track.artwork.startsWith("blob:")) {
			URL.revokeObjectURL(track.artwork);
		}

		const updated = state.tracks.filter((t) => t.id !== id);
		dispatch({ type: "SET_TRACKS", payload: updated });

		// Fix: Update queue instead of replacing with all tracks
		const updatedQueue = state.queue.filter((t) => t.id !== id);
		dispatch({ type: "SET_QUEUE", payload: updatedQueue });

		// Fix: If current track is deleted, pause and play next
		if (state.currentTrack?.id === id) {
			audioEngine.pause();
			dispatch({ type: "SET_IS_PLAYING", payload: false });
			if (updatedQueue.length > 0) {
				// Play next
				playTrack(updatedQueue[0]);
			} else {
				dispatch({ type: "SET_CURRENT_TRACK", payload: null });
			}
		}
	};

	const createPlaylist = async (name: string, description: string) => {
		const pl = {
			id: `pl-${Date.now()}`,
			name,
			description,
			trackIds: [],
			createdAt: new Date().toISOString(),
		};
		await savePlaylistDB(pl);
		dispatch({ type: "SET_PLAYLISTS", payload: [...state.playlists, pl] });
	};

	const renamePlaylist = async (id: string, name: string) => {
		const pl = state.playlists.find((p) => p.id === id);
		if (pl) {
			const updated = { ...pl, name };
			await savePlaylistDB(updated);
			dispatch({
				type: "SET_PLAYLISTS",
				payload: state.playlists.map((p) => (p.id === id ? updated : p)),
			});
		}
	};

	const deletePlaylist = async (id: string) => {
		await deletePlaylistDB(id);
		dispatch({
			type: "SET_PLAYLISTS",
			payload: state.playlists.filter((p) => p.id !== id),
		});
	};

	const addTrackToPlaylist = async (trackId: string, playlistId: string) => {
		const pl = state.playlists.find((p) => p.id === playlistId);
		if (pl && !pl.trackIds.includes(trackId)) {
			const updated = { ...pl, trackIds: [...pl.trackIds, trackId] };
			await savePlaylistDB(updated);
			dispatch({
				type: "SET_PLAYLISTS",
				payload: state.playlists.map((p) =>
					p.id === playlistId ? updated : p,
				),
			});
		}
	};

	const removeTrackFromPlaylist = async (
		trackId: string,
		playlistId: string,
	) => {
		const pl = state.playlists.find((p) => p.id === playlistId);
		if (pl) {
			const updated = {
				...pl,
				trackIds: pl.trackIds.filter((id) => id !== trackId),
			};
			await savePlaylistDB(updated);
			dispatch({
				type: "SET_PLAYLISTS",
				payload: state.playlists.map((p) =>
					p.id === playlistId ? updated : p,
				),
			});
		}
	};

	const shuffleQueue = () => {
		const q = [...state.queue];
		for (let i = q.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[q[i], q[j]] = [q[j], q[i]];
		}
		dispatch({ type: "SET_QUEUE", payload: q });
	};

	useLayoutEffect(() => {
		latestCallbacksRef.current = { ...state, handleTrackEnded };
	});

	const value = {
		...state,
		setActiveTab: (t: any) => dispatch({ type: "SET_ACTIVE_TAB", payload: t }),
		setSideMenuOpen: (o: any) =>
			dispatch({ type: "SET_SIDE_MENU_OPEN", payload: o }),
		setPlayerExpanded: (e: any) =>
			dispatch({ type: "SET_PLAYER_EXPANDED", payload: e }),
		updateSettings,
		setSearchQuery: (q: any) =>
			dispatch({ type: "SET_SEARCH_QUERY", payload: q }),
		addToSearchHistory: (q: string) =>
			dispatch({ type: "ADD_TO_SEARCH_HISTORY", payload: q }),
		clearSearchHistory: () => dispatch({ type: "CLEAR_SEARCH_HISTORY" }),
		setQueue: (q: any) => dispatch({ type: "SET_QUEUE", payload: q }),
		playTrack,
		togglePlay,
		nextTrack,
		prevTrack,
		seekTrack,
		setVolume,
		toggleFavorite,
		importLocalFiles,
		importYoutubeUrl,
		deleteTrack,
		updateTrackTags: (track: Track) => {
			dispatch({ type: "UPDATE_TRACK", payload: track });
			updateTrackMetadata(track).catch((e) => console.error(e));
		},
		createPlaylist,
		renamePlaylist,
		deletePlaylist,
		addTrackToPlaylist,
		removeTrackFromPlaylist,
		shuffleQueue,
		triggerHaptic,
		showIsland,
		islandNotification,
		privateFolderUnlocked,
		setPrivateFolderUnlocked,
	};

	return (
		<MusicContext.Provider value={value}>{children}</MusicContext.Provider>
	);
};

export const useMusic = () => {
	const context = useContext(MusicContext);
	if (!context) throw new Error("useMusic must be used within MusicProvider");
	return context;
};
