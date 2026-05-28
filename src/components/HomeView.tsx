import {
	Coffee,
	Compass,
	Flame,
	Heart,
	ListMusic,
	Menu,
	Shuffle,
	Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { useMusic } from "../context/MusicContext";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBg10Class,
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentBorder40Class,
	getAccentBorder50Class,
	getAccentBorderClass,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";

export const HomeView: React.FC = () => {
	const {
		tracks,
		playTrack,
		togglePlay,
		isPlaying,
		currentTrack,
		settings,
		setSideMenuOpen,
		toggleFavorite,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const _accentRGB = getAccentRGB(accent);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);

	const [selectedMood, setSelectedMood] = useState<
		"All" | "Happy" | "Chill" | "Focus" | "Sad" | "Energy"
	>("All");

	// Filter songs based on mood
	const filteredTracks =
		selectedMood === "All"
			? tracks
			: tracks.filter((t) => t.mood === selectedMood);

	// Smart Sorting/Behavior Analytics
	const recentlyPlayed = [...tracks]
		.filter((t) => t.lastPlayedAt)
		.sort(
			(a, b) =>
				new Date(b.lastPlayedAt!).getTime() -
				new Date(a.lastPlayedAt!).getTime(),
		)
		.slice(0, 4);

	const mostPlayed = [...tracks]
		.sort((a, b) => b.playCount - a.playCount)
		.slice(0, 4);

	// Real offline smart rule recommendation engine
	// Filter for most-popular songs of the selected mood OR just overall high weight
	const smartRecommendations = [...tracks]
		.filter((t) =>
			selectedMood === "All" ? t.playCount >= 0 : t.mood === selectedMood,
		)
		// sort based on weight combining play count vs skip avoidance
		.sort(
			(a, b) => b.playCount * 3 - b.skipCount - (a.playCount * 3 - a.skipCount),
		)
		.slice(0, 3);

	const handleShufflePlay = () => {
		if (filteredTracks.length === 0) return;
		const q = [...filteredTracks];
		for (let i = q.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[q[i], q[j]] = [q[j], q[i]];
		}
		// playTrack already adds to history/sets current, but doesn't set queue
		// In context.tsx playTrack should maybe take a queue too?
		// Actually there is a shuffleQueue in context but it shuffles existing queue.
		// Let's use what we have.
		playTrack(q[0]);
	};

	const moodsList: ("All" | "Happy" | "Chill" | "Focus" | "Sad" | "Energy")[] =
		["All", "Happy", "Chill", "Focus", "Sad", "Energy"];

	return (
		<div className="flex-1 overflow-y-auto pb-24 text-left px-4">
			{/* Top Bar with Profile Greeting */}
			<div className="flex items-center justify-between py-4 border-b border-neutral-900/60 mb-5">
				<div className="flex items-center gap-4">
					<button
						id="drawer-toggle-btn"
						onClick={() => setSideMenuOpen(true)}
						className={`w-10 h-10 squircle bg-neutral-950 border border-neutral-800/50 hover:bg-neutral-900 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${getAccentShadowClass(accent)} ring-4 ring-white/[0.03] active:scale-90`}
					>
						<Menu className="w-5 h-5 text-neutral-200" />
					</button>

					<div className="flex flex-col text-left">
						<span
							className={`text-[9px] ${accentText} font-mono tracking-widest font-black uppercase leading-tight`}
						>
							{getTranslation(lang, "bengaliWelcome")}
						</span>
						<span className="text-sm font-extrabold text-white tracking-tight leading-tight">
							{lang === "bn" ? "নিউরাল লাউঞ্জ" : "Neural ZMusic"}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="px-3.5 py-1.5 rounded-full bg-neutral-950 border border-white/5 flex items-center gap-1.5 text-[9px] font-black text-emerald-400 shadow-inner">
						<span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
						AI OPTIMIZED
					</div>
				</div>
			</div>

			{/* Main Glassmorphic Hero Banner */}
			<div className="relative rounded-[2rem] overflow-hidden mb-8 p-6 border border-white/10 bg-gradient-to-br from-neutral-900/60 via-neutral-950 to-black shadow-2xl neural-shadow">
				{/* Abstract floating dynamic circle */}
				<div
					className={`absolute -right-20 -top-20 w-48 h-48 ${getAccentBg10Class(accent)} rounded-full filter blur-[60px] animate-pulse`}
				/>
				<div className="absolute -left-20 -bottom-20 w-48 h-48 bg-purple-600/10 rounded-full filter blur-[60px] animate-pulse" />

				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
					<div className="space-y-2 text-left">
						<div
							className={`px-2 py-0.5 rounded-full ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} w-fit flex items-center gap-1.5`}
						>
							<Sparkles className={`w-3 h-3 ${accentText}`} />
							<span
								className={`text-[8px] font-black uppercase tracking-widest ${accentText}`}
							>
								Neural Audio Vistion
							</span>
						</div>
						<h2 className="text-2xl font-black text-white leading-tight tracking-tight">
							{lang === "bn"
								? "নিউরাল ইকুয়ালাইজার ও অ্যাকোস্টিকস"
								: "Neural Acoustic Engineering"}
						</h2>
						<p className="text-xs text-neutral-400 max-w-sm font-medium leading-relaxed">
							{lang === "bn"
								? "আপনার অফলাইন এমপি৩ গুলোকে নিউরাল ইম্পালস ও স্পেশাল শ্যাডোর মাধ্যমে নতুনভাবে শুনুন।"
								: "Experience gapless local audio via neural-optimized hardware presets and deep-glass design."}
						</p>
					</div>

					<div className="flex gap-2 shrink-0">
						<button
							onClick={handleShufflePlay}
							className={`px-5 py-3 rounded-full ${accentBg} hover:opacity-90 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl ${getAccentShadowClass(accent)} cursor-pointer active:scale-95`}
						>
							<Shuffle className="w-3.5 h-3.5" />
							{lang === "bn" ? "এলোমেলো" : "Neural Shuffle"}
						</button>
					</div>
				</div>
			</div>

			{/* Bento Grid Quick Tiles */}
			<h3 className="text-[10px] font-mono font-black tracking-[0.2em] text-neutral-600 uppercase mb-4 flex items-center gap-3">
				<div className="w-8 h-8 squircle bg-neutral-900 flex items-center justify-center">
					<Compass className="w-4 h-4 text-neutral-500" />
				</div>
				{getTranslation(lang, "categories")}
			</h3>
			<div className="grid grid-cols-2 gap-4 mb-8">
				{/* Tile 1: Bangla Folk */}
				<div
					onClick={() => {
						setSelectedMood("Chill");
						playTrack(tracks[0]);
					}}
					className={`h-28 rounded-2xl p-4 flex flex-col justify-between border border-neutral-900 bg-neutral-950/80 hover:${getAccentBorder40Class(accent)} cursor-pointer overflow-hidden relative group transition-all shadow-lg active:scale-95`}
				>
					<div
						className={`absolute right-2 bottom-2 w-20 h-20 rounded-full ${getAccentBg10Class(accent)} filter blur-xl group-hover:${getAccentBg20Class(accent)} transition-all duration-500`}
					/>
					<div
						className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center neural-shadow`}
					>
						<Coffee className={`w-5 h-5 ${accentText}`} />
					</div>
					<div className="text-left relative z-10">
						<h4 className="text-xs font-black text-white tracking-tight">
							{lang === "bn" ? "আমি বাংলায় গান গাই" : "Bangla Heritage"}
						</h4>
						<span className="text-[9px] font-mono text-neutral-500 uppercase tracking-tighter">
							Traditional Folk
						</span>
					</div>
				</div>

				{/* Tile 2: Study/Chill Beats */}
				<div
					onClick={() => {
						setSelectedMood("Focus");
						playTrack(tracks[2]);
					}}
					className="h-28 rounded-2xl p-4 flex flex-col justify-between border border-neutral-900 bg-neutral-950/80 hover:border-purple-600/40 cursor-pointer overflow-hidden relative group transition-all shadow-lg active:scale-95"
				>
					<div className="absolute right-2 bottom-2 w-20 h-20 rounded-full bg-purple-600/10 filter blur-xl group-hover:bg-purple-600/20 transition-all duration-500" />
					<div className="w-9 h-9 squircle bg-purple-900/20 border border-purple-900/30 flex items-center justify-center neural-shadow">
						<Sparkles className="w-5 h-5 text-purple-400" />
					</div>
					<div className="text-left relative z-10">
						<h4 className="text-xs font-black text-white tracking-tight">
							{lang === "bn" ? "মাঝরাত লফি" : "Midnight Study"}
						</h4>
						<span className="text-[9px] font-mono text-neutral-500 uppercase tracking-tighter">
							Lofi Atmosphere
						</span>
					</div>
				</div>
			</div>

			{/* Mood Horizontal Filters */}
			<div className="flex items-center justify-between mb-3.5">
				<h3 className="text-xs font-mono font-extrabold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
					<Flame className="w-4 h-4 text-neutral-500" />
					{lang === "bn" ? "আবেগ ও মেজাজ" : "Mood Lounge"}
				</h3>
				{selectedMood !== "All" && (
					<button
						onClick={() => setSelectedMood("All")}
						className={`text-[10px] font-mono ${accentText} hover:text-white`}
					>
						Reset
					</button>
				)}
			</div>

			<div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
				{moodsList.map((mood) => (
					<button
						key={mood}
						onClick={() => setSelectedMood(mood)}
						className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
							selectedMood === mood
								? `${accentBg} text-white border ${getAccentBorderClass(accent)} shadow-lg ${getAccentShadowClass(accent)}`
								: "bg-neutral-950 text-neutral-400 border border-neutral-900 hover:text-neutral-200"
						}`}
					>
						{mood === "All"
							? lang === "bn"
								? "স্বাভাবিক"
								: "All"
							: getTranslation(lang, `mood${mood}` as any)}
					</button>
				))}
			</div>

			{/* Filtered Tracks / Recommendations Section */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
						<Sparkles className={`w-3.5 h-3.5 ${accentText} animate-pulse`} />
						{getTranslation(lang, "smartRecs")}
					</span>
					<span className="text-[9px] font-mono text-neutral-600 uppercase">
						OFFLINE ENGINE
					</span>
				</div>

				{filteredTracks.length === 0 ? (
					<div className="p-6 text-center border border-dashed border-neutral-900 rounded-xl">
						<p className="text-xs text-neutral-500 font-mono">
							{getTranslation(lang, "noSongs")}
						</p>
					</div>
				) : (
					<motion.div
						initial="hidden"
						animate="show"
						variants={{
							hidden: { opacity: 0 },
							show: {
								opacity: 1,
								transition: { staggerChildren: 0.08 },
							},
						}}
						className="grid gap-2"
					>
						{smartRecommendations.map((track) => {
							const isActive = currentTrack?.id === track.id;
							return (
								<motion.div
									key={`rec-${track.id}`}
									variants={{
										hidden: { opacity: 0, scale: 0.95 },
										show: {
											opacity: 1,
											scale: 1,
											transition: { ease: [0.22, 1, 0.36, 1], duration: 0.4 },
										},
									}}
									className={`p-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
										isActive
											? `${getAccentBg20Class(accent)} ${getAccentBorder50Class(accent)} shadow-md ${getAccentShadowClass(accent)}`
											: "bg-neutral-950/80 border-neutral-900 hover:bg-neutral-900"
									}`}
								>
									<div
										className="flex items-center gap-3 overflow-hidden flex-1"
										onClick={() => playTrack(track)}
									>
										<div
											className="w-10 h-10 rounded-lg shrink-0 border border-neutral-800 flex items-center justify-center font-bold text-neutral-600"
											style={{ background: track.artwork }}
										>
											{!track.artwork && track.title[0]}
										</div>
										<div className="flex flex-col text-left overflow-hidden">
											<span
												className={`text-[12px] font-bold truncate ${isActive ? accentText : "text-white"}`}
											>
												{lang === "bn" && track.bengaliTitle
													? track.bengaliTitle
													: track.title}
											</span>
											<span className="text-[10px] text-neutral-400 font-mono truncate">
												{lang === "bn" && track.bengaliArtist
													? track.bengaliArtist
													: track.artist}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={() => toggleFavorite(track.id)}
											className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center border border-neutral-800 cursor-pointer"
										>
											<Heart
												className={`w-3.5 h-3.5 ${track.isFavorite ? "text-red-500 fill-red-500" : "text-neutral-500"}`}
											/>
										</button>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				)}
			</div>

			{/* Double Column for Stats Lists (Recently Played vs Most Played) */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
				{/* Column 1: Recently Played */}
				<div>
					<h4 className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
						<Compass className="w-3.5 h-3.5" />
						{getTranslation(lang, "recentlyPlayed")}
					</h4>
					<div className="space-y-2">
						{recentlyPlayed.map((track) => (
							<div
								key={`recent-${track.id}`}
								onClick={() => playTrack(track)}
								className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 border border-neutral-950 hover:border-neutral-900 transition-all cursor-pointer overflow-hidden"
							>
								<div
									className="w-8 h-8 rounded-md shrink-0 border border-neutral-800"
									style={{ background: track.artwork }}
								/>
								<div className="flex flex-col text-left overflow-hidden flex-1">
									<span className="text-[11px] font-semibold text-white truncate">
										{lang === "bn" && track.bengaliTitle
											? track.bengaliTitle
											: track.title}
									</span>
									<span className="text-[9px] text-neutral-500 truncate font-mono">
										{lang === "bn" && track.bengaliArtist
											? track.bengaliArtist
											: track.artist}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Column 2: Most Played */}
				<div>
					<h4 className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
						<ListMusic className={`w-3.5 h-3.5 ${accentText}`} />
						{getTranslation(lang, "mostPlayed")}
					</h4>
					<div className="space-y-2">
						{mostPlayed.map((track) => (
							<div
								key={`most-${track.id}`}
								onClick={() => playTrack(track)}
								className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 border border-neutral-950 hover:border-neutral-900 transition-all cursor-pointer overflow-hidden"
							>
								<div
									className="w-8 h-8 rounded-md shrink-0 border border-neutral-800"
									style={{ background: track.artwork }}
								/>
								<div className="flex flex-col text-left overflow-hidden flex-1">
									<span className="text-[11px] font-semibold text-white truncate">
										{lang === "bn" && track.bengaliTitle
											? track.bengaliTitle
											: track.title}
									</span>
									<span className="text-[9px] text-neutral-500 truncate font-mono">
										{lang === "bn" && track.bengaliArtist
											? track.bengaliArtist
											: track.artist}
									</span>
								</div>
								<div className="text-[9px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-full shrink-0">
									{track.playCount}x
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
export default HomeView;
