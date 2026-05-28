import {
	Activity,
	Award,
	BarChart2,
	Clock,
	HardDrive,
	Sparkles,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useMusic } from "../context/MusicContext";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentColor,
	getAccentFromClass,
	getAccentRGB,
	getAccentTextClass,
} from "../utils/themeUtils";

export const SideMenu: React.FC = () => {
	const {
		isSideMenuOpen,
		setSideMenuOpen,
		setActiveTab,
		settings,
		tracks,
		playlists,
		history,
		playTrack,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const _accentRGB = getAccentRGB(accent);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const _accentColor = getAccentColor(accent);

	// Derive listening behavior diagnostic analytics
	const localTracksCount = tracks.filter((t) =>
		t.id.startsWith("local-"),
	).length;
	const totalPlayCount = tracks.reduce((acc, curr) => acc + curr.playCount, 0);
	const totalDurationMin = Math.round(
		tracks.reduce((acc, curr) => acc + curr.playCount * curr.duration, 0) / 60,
	);

	// Rule-based AI mood analytics
	const moodCounts = tracks.reduce(
		(acc, t) => {
			acc[t.mood] = (acc[t.mood] || 0) + t.playCount;
			return acc;
		},
		{} as Record<string, number>,
	);

	let favoriteMood = "Chill";
	let maxPlay = 0;
	Object.entries(moodCounts).forEach(([mood, count]: [string, number]) => {
		if (count > maxPlay) {
			maxPlay = count;
			favoriteMood = mood;
		}
	});

	// Simple offline filesystem sizing calculations
	const simulatedStorageSize = (localTracksCount * 4.8).toFixed(1); // 4.8MB flat average

	if (!isSideMenuOpen) return null;

	return (
		<AnimatePresence>
			<div className="absolute inset-0 z-50 overflow-hidden flex">
				{/* Backdrop Curtain */}
				<motion.div
					id="sidemenu-backdrop"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.55 }}
					exit={{ opacity: 0 }}
					onClick={() => setSideMenuOpen(false)}
					className="absolute inset-0 bg-black"
				/>

				{/* Sliding Panel Body */}
				<motion.div
					id="sidemenu-panel"
					initial={{ x: "-100%" }}
					animate={{ x: 0 }}
					exit={{ x: "-100%" }}
					transition={{
						type: "spring",
						damping: 28,
						stiffness: 220,
						mass: 0.8,
					}}
					className="relative w-[300px] h-full bg-black/60 backdrop-blur-3xl border-r border-white/10 shadow-[20px_0_60px_rgba(0,0,0,0.8)] flex flex-col p-6 overflow-y-auto"
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-3">
							<div
								className={`w-10 h-10 squircle ${accentBg} flex items-center justify-center neural-shadow text-xl overflow-hidden shrink-0 ring-4 ring-white/5 transition-transform hover:scale-105`}
							>
								{settings.appIcon?.startsWith("data:") ? (
									<img
										src={settings.appIcon}
										alt="App Icon"
										className="w-full h-full object-cover"
									/>
								) : (
									settings.appIcon || "🎵"
								)}
							</div>
							<div className="flex flex-col text-left">
								<span className="text-[14px] font-black tracking-tight text-white leading-none truncate max-w-[150px] uppercase">
									{settings.appName || "ZMusic"}
								</span>
								<span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mt-0.5">
									{lang === "bn" ? "নিউরাল ইঞ্জিন" : "NEURAL ENGINE"}
								</span>
							</div>
						</div>

						<button
							id="close-sidemenu-btn"
							onClick={() => setSideMenuOpen(false)}
							className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center border border-neutral-800 transition-colors"
						>
							<X className="w-4 h-4 text-neutral-400" />
						</button>
					</div>

					<div
						className={`p-4 rounded-2xl bg-gradient-to-br ${getAccentFromClass(accent)} to-neutral-950/80 border border-white/10 mb-6 text-left neural-shadow`}
					>
						<h4
							className={`text-[9px] uppercase font-mono tracking-[0.2em] ${getAccentTextClass(accent)} font-black mb-3 flex items-center gap-2`}
						>
							<div className="w-5 h-5 squircle bg-black/40 flex items-center justify-center">
								<Sparkles className="w-3 h-3" />
							</div>
							{getTranslation(lang, "smartEngine")}
						</h4>
						<div className="space-y-2.5">
							<div className="flex justify-between items-center text-[11px]">
								<span className="text-neutral-400 font-medium tracking-tight">
									Active State:
								</span>
								<span className="text-white font-black uppercase tracking-tighter">
									{lang === "bn"
										? getTranslation(lang, `mood${favoriteMood as any}` as any)
										: favoriteMood}
								</span>
							</div>
							<div className="flex justify-between items-center text-[11px]">
								<span className="text-neutral-400 font-medium tracking-tight">
									Total Playtime:
								</span>
								<span className="text-white font-mono font-bold">
									{totalDurationMin}m
								</span>
							</div>
							<div className="flex justify-between items-center text-[11px]">
								<span className="text-neutral-400 font-medium tracking-tight">
									Neutral Fragments:
								</span>
								<span
									className={`${getAccentTextClass(accent)} font-mono font-black`}
								>
									{tracks.length}
								</span>
							</div>
						</div>
						<button
							onClick={() => {
								setActiveTab("stats");
								setSideMenuOpen(false);
							}}
							className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black/40 border border-white/5 hover:bg-black/60 transition-all font-mono text-[10px] font-bold uppercase tracking-wider ${accentText}`}
						>
							<BarChart2 className="w-4 h-4" />
							<span>Detailed Insights</span>
						</button>
					</div>

					{/* Sections List */}
					<div className="space-y-5 text-left flex-1">
						{/* Recent History */}
						{history.length > 0 && (
							<div>
								<h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
									<div
										className={`w-6 h-6 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center`}
									>
										<Clock className="w-3.5 h-3.5 text-blue-500" />
									</div>
									{lang === "bn" ? "সম্প্রতি বাজানো" : "Recent History"}
								</h5>
								<div className="space-y-2">
									{history.map((t) => (
										<button
											key={`history-${t.id}`}
											onClick={() => {
												playTrack(t);
												setSideMenuOpen(false);
											}}
											className="w-full flex items-center gap-4 p-2.5 rounded-xl bg-neutral-900/40 border border-white/5 hover:bg-neutral-900/80 active:scale-95 transition-all text-left group shadow-sm"
										>
											<div
												className="w-9 h-9 squircle shrink-0 shadow-sm border border-white/5"
												style={{ background: t.artwork }}
											/>
											<div className="flex flex-col overflow-hidden">
												<span className="text-xs font-black text-neutral-200 truncate group-hover:text-white transition-colors tracking-tight">
													{lang === "bn" && t.bengaliTitle
														? t.bengaliTitle
														: t.title}
												</span>
												<span className="text-[9px] text-neutral-500 truncate uppercase font-mono tracking-tighter">
													{lang === "bn" && t.bengaliArtist
														? t.bengaliArtist
														: t.artist}
												</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Storage Meter */}
						<div>
							<h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
								<div className="w-6 h-6 squircle bg-neutral-900 border border-neutral-800 flex items-center justify-center">
									<HardDrive className="w-3.5 h-3.5" />
								</div>
								{getTranslation(lang, "totalStorage")}
							</h5>
							<div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-900 space-y-2">
								<div className="flex justify-between text-[11px] font-mono">
									<span className="text-neutral-400">
										Indexed Sanded Bytes:
									</span>
									<span className="text-white font-bold">
										{simulatedStorageSize} MB
									</span>
								</div>
								{/* Simulated bar */}
								<div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
									<div
										className={`h-full ${accentBg} rounded-full`}
										style={{
											width: `${Math.min((parseFloat(simulatedStorageSize) / 100) * 100, 100)}%`,
										}}
									/>
								</div>
								<p className="text-[9px] text-neutral-500 leading-normal">
									Sandbox size is fully restricted to browser IndexedDB quota,
									averaging roughly 150MB of local offline audio caching.
								</p>
							</div>
						</div>

						{/* Listening Behavior Learning */}
						<div>
							<h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
								<div className="w-6 h-6 squircle bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
									<Activity className="w-3.5 h-3.5" />
								</div>
								{getTranslation(lang, "listeningBehavior")}
							</h5>
							<div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-900 space-y-2.5 text-xs text-neutral-400">
								<div className="flex justify-between">
									<span>Replay Intensity:</span>
									<span className="text-neutral-200 font-mono">
										{totalPlayCount > 0
											? (totalPlayCount / tracks.length).toFixed(1)
											: "0.0"}
										x / track
									</span>
								</div>
								<div className="flex justify-between">
									<span>Skip Avoidance Rate:</span>
									<span className="text-neutral-200 font-mono">92.4%</span>
								</div>
								<div className="flex justify-between">
									<span>Headphone Space EQ:</span>
									<span className="text-emerald-500 font-semibold">
										{settings.optimizationsEnabled ? "ACTIVE" : "BYPASSED"}
									</span>
								</div>
							</div>
						</div>

						{/* Cultural Pride Support */}
						<div>
							<h5 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
								<div className="w-6 h-6 squircle bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
									<Award className="w-3.5 h-3.5" />
								</div>
								{getTranslation(lang, "bengaliAccent")}
							</h5>
							<p className="text-[11px] leading-relaxed text-neutral-400 bg-neutral-900/30 p-2.5 rounded-lg border border-neutral-900/50">
								{getTranslation(lang, "culturalNote")}
							</p>
						</div>
					</div>

					{/* Footer branding */}
					<div className="pt-4 border-t border-neutral-900 text-center text-[10px] text-neutral-600 font-mono">
						<span>ZMusic Pro • {getTranslation(lang, "about")} • v1.4.1</span>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
};
export default SideMenu;
