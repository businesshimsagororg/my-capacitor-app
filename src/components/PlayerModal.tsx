import {
	AlignCenter,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	EyeOff,
	Gauge,
	Heart,
	ListMusic,
	Mic,
	Moon,
	Volume2,
	VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useMusic } from "../context/MusicContext";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBg20Class,
	getAccentBg50Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentBorder40Class,
	getAccentColor,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";
import { EQPanel } from "./player/EQPanel";
import { LyricsView } from "./player/LyricsView";
import { PlayerControls } from "./player/PlayerControls";
import { QueueSheet } from "./player/QueueSheet";
import { AestheticAudioVisualizer } from "./player/Visualizer";

export const PlayerModal: React.FC = () => {
	const {
		currentTrack,
		isPlaying,
		togglePlay,
		currentTime,
		duration,
		seekTrack,
		setVolume,
		toggleFavorite,
		isPlayerExpanded,
		setPlayerExpanded,
		settings,
		updateSettings,
		sleepTimerSeconds,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentRGB = useMemo(() => getAccentRGB(accent), [accent]);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	const [showLyrics, setShowLyrics] = useState<boolean>(false);
	const [lyricsOffset, setLyricsOffset] = useState<number>(0);
	const [showQueueSheet, setShowQueueSheet] = useState<boolean>(false);
	const [localVol, setLocalVol] = useState<number>(
		settings.volume !== undefined ? Math.round(settings.volume * 100) : 80,
	);
	const [speedExpanded, setSpeedExpanded] = useState<boolean>(false);
	const [sleepExpanded, setSleepExpanded] = useState<boolean>(false);
	const [suppressionExpanded, setSuppressionExpanded] =
		useState<boolean>(false);

	useEffect(() => {
		setLyricsOffset(0);
	}, []);

	if (!isPlayerExpanded || !currentTrack) return null;

	const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

	const formatTime = (secs: number) => {
		if (Number.isNaN(secs) || secs === undefined) return "0:00";
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60)
			.toString()
			.padStart(2, "0");
		return `${m}:${s}`;
	};

	const handleVolumeSlide = (val: number) => {
		setLocalVol(val);
		setVolume(val / 100);
	};

	const waveBarsCount = 32;
	const generateStaticBars = (trackId: string) => {
		const seed = trackId.charCodeAt(0) || 5;
		const bars: number[] = [];
		for (let i = 0; i < waveBarsCount; i++) {
			bars.push(16 + Math.abs(Math.sin(i * 0.45 + seed) * 28));
		}
		return bars;
	};
	const currentBarsHeight = generateStaticBars(currentTrack.id);

	return (
		<AnimatePresence>
			<motion.div
				id="player-modal-container"
				initial={{ y: "100%" }}
				animate={{ y: 0 }}
				exit={{ y: "100%" }}
				transition={{ type: "spring", damping: 26, stiffness: 220 }}
				className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col"
			>
				<div
					className="absolute inset-0 opacity-40 filter blur-3xl scale-110 pointer-events-none transition-all duration-700"
					style={{ background: currentTrack.artwork }}
				/>

				{settings.zenMode ? (
					<div
						className="relative z-20 flex-1 flex flex-col items-center justify-center p-8 text-center"
						onClick={togglePlay}
					>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setPlayerExpanded(false);
							}}
							className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center backdrop-blur-md text-white transition-all pointer-events-auto"
						>
							<ChevronDown className="w-5 h-5 text-neutral-300" />
						</button>
						<div className="flex-1 w-full flex flex-col items-center justify-center max-w-lg mb-12">
							<AestheticAudioVisualizer
								isPlaying={isPlaying}
								accent={settings.themeAccent}
							/>
						</div>
						<div className="absolute flex flex-col items-center bottom-12 w-full px-6 space-y-2 pointer-events-none opacity-60">
							<h2 className="text-xl font-black tracking-tight text-white/90">
								{lang === "bn" && currentTrack.bengaliTitle
									? currentTrack.bengaliTitle
									: currentTrack.title}
							</h2>
							<p className="text-sm font-mono text-neutral-400">
								{lang === "bn" && currentTrack.bengaliArtist
									? currentTrack.bengaliArtist
									: currentTrack.artist}
							</p>
						</div>
						<button
							className="absolute bottom-6 right-6 p-2 text-neutral-500 hover:text-white transition-all z-30 opacity-30"
							onClick={(e) => {
								e.stopPropagation();
								updateSettings({ zenMode: false });
							}}
						>
							<EyeOff className="w-5 h-5" />
						</button>
					</div>
				) : (
					<div className="relative z-10 flex-1 flex flex-col overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4">
							<button
								onClick={() => setPlayerExpanded(false)}
								className="w-10 h-10 squircle bg-black/40 hover:bg-black/60 border border-white/5 flex items-center justify-center text-white neural-shadow"
							>
								<ChevronDown className="w-5 h-5" />
							</button>
							<span className="text-[10px] font-mono tracking-widest font-black text-neutral-400 uppercase">
								{showLyrics
									? getTranslation(lang, "lyricsSynced")
									: getTranslation(lang, "nowPlaying")}
							</span>
							<button
								onClick={() => setShowQueueSheet(!showQueueSheet)}
								className={`w-10 h-10 squircle border flex items-center justify-center transition-all ${
									showQueueSheet
										? `${accentBg} ${getAccentBorder40Class(accent)} text-white shadow-lg ${getAccentShadowClass(accent)}`
										: "bg-black/40 border-white/5 text-white neural-shadow"
								}`}
							>
								<ListMusic className="w-4.5 h-4.5" />
							</button>
						</div>

						<div className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 py-4 overflow-hidden">
							<AnimatePresence mode="wait">
								{!showLyrics ? (
									<motion.div
										key="art-view"
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										className="flex flex-col items-center justify-center text-center gap-6"
									>
										<AestheticAudioVisualizer
											isPlaying={isPlaying}
											accent={settings.themeAccent}
											onCenterClick={togglePlay}
										/>
										<div className="space-y-1.5 max-w-sm px-4">
											<h3 className="text-lg font-black tracking-tight text-white leading-tight">
												{lang === "bn" && currentTrack.bengaliTitle
													? currentTrack.bengaliTitle
													: currentTrack.title}
											</h3>
											<p className="text-xs font-mono font-medium text-neutral-400">
												{lang === "bn" && currentTrack.bengaliArtist
													? currentTrack.bengaliArtist
													: currentTrack.artist}
											</p>
										</div>
									</motion.div>
								) : (
									<LyricsView
										lyricsOffset={lyricsOffset}
										setLyricsOffset={setLyricsOffset}
									/>
								)}
							</AnimatePresence>
						</div>

						<div className="relative z-10 bg-gradient-to-t from-black via-black/95 to-transparent pt-3 pb-8 px-6 flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<div className="h-10 w-full flex items-end justify-between gap-1 relative group">
									<input
										type="range"
										min={0}
										max={Math.max(1, duration || currentTrack.duration)}
										step="any"
										value={currentTime || 0}
										onChange={(e) => seekTrack(Number(e.target.value))}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
									/>
									{currentBarsHeight.map((barH, barIdx) => {
										const active =
											progressPercent >= (barIdx / waveBarsCount) * 100;
										return (
											<div
												key={`bar-${barIdx}`}
												className="w-full rounded-full transition-all duration-300"
												style={{
													height: `${barH}px`,
													background: active
														? `rgba(${accentRGB}, 0.8)`
														: "rgba(255,255,255,0.08)",
												}}
											/>
										);
									})}
								</div>
								<div className="flex justify-between text-[9px] font-mono font-black text-neutral-500 uppercase tracking-widest">
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration || currentTrack.duration)}</span>
								</div>
							</div>

							<div className="flex items-center justify-between pb-2 border-b border-white/5">
								<button
									onClick={() => setShowLyrics(!showLyrics)}
									className={`w-10 h-10 squircle flex items-center justify-center border transition-all ${showLyrics ? `${getAccentBg20Class(accent)} ${getAccentBorder40Class(accent)} ${accentText} neural-shadow` : "bg-black/30 border-white/5 text-neutral-500"}`}
								>
									<AlignCenter className="w-4.5 h-4.5" />
								</button>
								<div className="flex items-center gap-2">
									<div
										className={`w-1.5 h-1.5 rounded-full ${accentBg} animate-pulse`}
									/>
									<span className="text-[10px] font-mono text-neutral-400 font-black uppercase tracking-[0.2em] leading-none">
										NEURAL EQ
									</span>
								</div>
								<button
									onClick={() => toggleFavorite(currentTrack.id)}
									className="w-10 h-10 squircle bg-black/30 border border-white/5 flex items-center justify-center neural-shadow active:scale-90 transition-transform"
								>
									<Heart
										className={`w-4.5 h-4.5 ${currentTrack.isFavorite ? "text-red-500 fill-red-500" : "text-neutral-500"}`}
									/>
								</button>
							</div>

							<PlayerControls />

							<div className="flex items-center justify-center gap-3 text-xs font-mono font-bold text-neutral-400 border-t border-white/5 pt-4 mt-1">
								<button
									onClick={() => {
										setSpeedExpanded(!speedExpanded);
										setSleepExpanded(false);
									}}
									className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all text-[11px] font-black ${speedExpanded || (settings.playbackSpeed !== 1.0) ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : "bg-neutral-950/40 border-white/5"}`}
								>
									<Gauge className="w-4 h-4" />
									<span>{(settings.playbackSpeed || 1.0).toFixed(1)}X</span>
								</button>
								<button
									onClick={() => seekTrack(Math.max(0, currentTime - 10))}
									className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950/40 border border-white/5 text-neutral-300 active:scale-90 transition-transform"
								>
									<ChevronLeft className="w-4 h-4" />
									<span>-10S</span>
								</button>
								<button
									onClick={() =>
										seekTrack(
											Math.min(
												duration || currentTrack.duration,
												currentTime + 10,
											),
										)
									}
									className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950/40 border border-white/5 text-neutral-300 active:scale-90 transition-transform"
								>
									<span>+10S</span>
									<ChevronRight className="w-4 h-4" />
								</button>
								<button
									onClick={() => {
										setSleepExpanded(!sleepExpanded);
										setSpeedExpanded(false);
									}}
									className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-all text-[11px] font-black ${sleepExpanded || sleepTimerSeconds !== null ? "bg-amber-950/40 border-amber-500/30 text-amber-400" : "bg-neutral-950/40 border-white/5"}`}
								>
									<Moon className="w-4 h-4" />
									<span>
										{sleepTimerSeconds !== null
											? formatTime(sleepTimerSeconds)
											: "OFF"}
									</span>
								</button>
							</div>

							<AnimatePresence>
								{speedExpanded && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className="mx-1.5 bg-neutral-950/50 border border-neutral-900 px-3.5 py-2.5 rounded-xl flex flex-col gap-2 overflow-hidden"
									>
										<input
											type="range"
											min={0.5}
											max={2.0}
											step={0.1}
											value={settings.playbackSpeed || 1.0}
											onChange={(e) =>
												updateSettings({
													playbackSpeed: parseFloat(e.target.value),
												})
											}
											className="w-full h-1 appearance-none cursor-pointer accent-emerald-500 bg-neutral-900 rounded-lg"
										/>
									</motion.div>
								)}
								{sleepExpanded && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className="mx-1.5 bg-neutral-950/50 border border-neutral-900 px-3.5 py-2.5 rounded-xl flex items-center gap-1 overflow-hidden"
									>
										{[null, 15, 30, 60, 90].map((mins) => (
											<button
												key={`sleep-${mins}`}
												onClick={() =>
													updateSettings({ sleepTimerDuration: mins })
												}
												className={`flex-1 py-1 rounded-lg border text-[9px] font-mono ${settings.sleepTimerDuration === mins ? "bg-amber-950 text-amber-400" : "bg-black/30 border-neutral-900 text-neutral-500"}`}
											>
												{mins === null ? "Off" : `${mins}m`}
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>

							<div className="flex items-center gap-3.5 text-neutral-500 px-4">
								<Volume2 className="w-4 h-4" />
								<input
									type="range"
									min={0}
									max={100}
									step={2}
									value={localVol}
									onChange={(e) =>
										handleVolumeSlide(parseInt(e.target.value, 10))
									}
									className={`w-full h-1 appearance-none cursor-pointer accent-${accentColor} bg-neutral-900 rounded-lg`}
								/>
								<span className="text-[10px] font-mono font-bold w-6 shrink-0 text-right">
									{localVol}%
								</span>
							</div>

							{!settings.minimalistMode && (
								<div className="grid grid-cols-2 gap-3 mt-2 px-1.5">
									<div
										onClick={() => {
											if (!settings.vocalOnlyEnabled)
												updateSettings({ vocalOnlyEnabled: true });
											setSuppressionExpanded(!suppressionExpanded);
										}}
										className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${settings.vocalOnlyEnabled ? `${getAccentBg50Class(accent)} ${getAccentBorder30Class(accent)} ${accentText}` : "bg-neutral-950/30 border-neutral-900/40 text-neutral-400"}`}
									>
										<div className="flex items-center gap-2.5">
											<Mic className="w-4 h-4" />
											<span className="text-[10px] font-extrabold uppercase">
												Vocal Mode
											</span>
										</div>
									</div>
									<button
										onClick={() =>
											updateSettings({
												skipSilenceEnabled: !settings.skipSilenceEnabled,
											})
										}
										className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${settings.skipSilenceEnabled ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-400" : "bg-neutral-950/30 border-neutral-900/40 text-neutral-400"}`}
									>
										<VolumeX className="w-4 h-4" />
										<span className="text-[10px] font-extrabold uppercase">
											Skip Silence
										</span>
									</button>
								</div>
							)}
							<EQPanel
								expanded={suppressionExpanded}
								onToggle={() => setSuppressionExpanded(!suppressionExpanded)}
							/>
						</div>
					</div>
				)}

				<AnimatePresence>
					{showQueueSheet && (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setShowQueueSheet(false)}
								className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
							/>
							<motion.div
								initial={{ y: "100%" }}
								animate={{ y: 0 }}
								exit={{ y: "100%" }}
								transition={{ type: "spring", damping: 25, stiffness: 200 }}
								className="absolute bottom-0 left-0 right-0 z-50 h-[80vh]"
							>
								<QueueSheet onClose={() => setShowQueueSheet(false)} />
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</motion.div>
		</AnimatePresence>
	);
};
