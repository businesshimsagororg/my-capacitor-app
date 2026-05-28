import { Disc, Pause, Play, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMusic } from "../context/MusicContext";
import { useAudioFrequency } from "../hooks/useAudioFrequency";
import { getAccentBgClass, getAccentShadowClass } from "../utils/themeUtils";

export const MiniPlayer: React.FC = () => {
	const {
		currentTrack,
		isPlaying,
		togglePlay,
		nextTrack,
		currentTime,
		duration,
		isPlayerExpanded,
		setPlayerExpanded,
		settings,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const frequency = useAudioFrequency(0);

	// Mini-player is hidden if player is full screen or there's no track loaded
	if (isPlayerExpanded || !currentTrack) return null;

	const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
	const pulseScale = isPlaying ? 1.0 + frequency * 0.15 : 1.0;

	return (
		<div className="absolute bottom-16 left-3 right-3 z-30 select-none">
			{/* Floating Glassmorphic Container panel */}
			<div
				id="mini-player-body"
				className={`h-14 rounded-2xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/60 shadow-lg ${getAccentShadowClass(accent)} overflow-hidden flex items-center justify-between px-3.5 relative cursor-pointer active:scale-[0.99] transition-transform`}
				onClick={() => setPlayerExpanded(true)}
			>
				<div className="flex items-center gap-3 overflow-hidden flex-1">
					{/* Cover icon vinyl or thumbnail */}
					<motion.div
						className="w-9 h-9 rounded-lg shrink-0 border border-neutral-850 flex items-center justify-center text-white text-[13px] font-bold overflow-hidden"
						style={{ background: currentTrack.artwork }}
						animate={{ scale: pulseScale }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					>
						{isPlaying && (
							<Disc className="w-5 h-5 text-white/40 animate-spin-slow shrink-0" />
						)}
					</motion.div>

					<div className="flex flex-col text-left overflow-hidden">
						<span className="text-[11.5px] font-bold text-white tracking-tight truncate">
							{lang === "bn" && currentTrack.bengaliTitle
								? currentTrack.bengaliTitle
								: currentTrack.title}
						</span>
						<span className="text-[9px] text-neutral-400 font-mono tracking-tighter truncate leading-none mt-0.5">
							{lang === "bn" && currentTrack.bengaliArtist
								? currentTrack.bengaliArtist
								: currentTrack.artist}
						</span>
					</div>
				</div>

				{/* Compact Right Buttons */}
				<div
					className="flex items-center gap-1 shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<button
						onClick={togglePlay}
						className="w-8 h-8 rounded-full bg-neutral-950/60 border border-neutral-850 hover:bg-neutral-800 flex items-center justify-center text-white"
					>
						{isPlaying ? (
							<Pause className="w-3.5 h-3.5 fill-white" />
						) : (
							<Play className="w-3.5 h-3.5 fill-white ml-0.5" />
						)}
					</button>

					<button
						onClick={nextTrack}
						className="w-8 h-8 rounded-full bg-neutral-950/60 border border-neutral-850 hover:bg-neutral-800 flex items-center justify-center text-white"
					>
						<SkipForward className="w-3.5 h-3.5 fill-white" />
					</button>
				</div>

				{/* Edge Progress Indicator line */}
				<div
					className={`absolute bottom-0 left-0 h-0.5 ${getAccentBgClass(accent)} transition-all duration-300`}
					style={{ width: `${progressPercent}%` }}
				/>
			</div>
		</div>
	);
};
export default MiniPlayer;
