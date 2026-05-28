import { motion } from "motion/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { useMusic } from "../../context/MusicContext";
import { getTranslation } from "../../utils/bengaliTranslations";
import { getAccentRGB, getAccentTextClass } from "../../utils/themeUtils";

interface LyricsViewProps {
	lyricsOffset: number;
	setLyricsOffset: React.Dispatch<React.SetStateAction<number>>;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
	lyricsOffset,
	setLyricsOffset,
}) => {
	const { currentTrack, currentTime, duration, seekTrack, settings } =
		useMusic();
	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentText = getAccentTextClass(accent);
	const accentRGB = getAccentRGB(accent);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);

	const linesMap = currentTrack?.lyrics || [];
	const adjustedTime = Math.max(0, currentTime + lyricsOffset);
	const activeLineIdx =
		linesMap.length > 0
			? Math.min(
					Math.floor((adjustedTime / (duration || 1)) * linesMap.length),
					linesMap.length - 1,
				)
			: -1;

	useEffect(() => {
		if (activeLineIdx !== -1 && scrollContainerRef.current) {
			const container = scrollContainerRef.current;
			const activeEl = document.getElementById(`lyric-line-${activeLineIdx}`);
			if (activeEl) {
				const top =
					activeEl.offsetTop -
					container.clientHeight / 2 +
					activeEl.clientHeight / 2;
				container.scrollTo({ top, behavior: "smooth" });
			}
		}
	}, [activeLineIdx]);

	return (
		<motion.div
			key="lyrics-view"
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -15 }}
			className="w-full h-full flex flex-col max-w-md relative"
		>
			{/* Offset Control */}
			{linesMap.length > 0 && (
				<div className="absolute top-0 right-0 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1.5 rounded-lg border border-neutral-800 focus:outline-none">
					<span className="text-[9px] font-mono text-neutral-400 tracking-wider">
						OFFSET
					</span>
					<button
						onClick={() => setLyricsOffset((prev) => prev - 0.5)}
						className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
					>
						-
					</button>
					<span
						className={`text-[9px] font-mono ${accentText} w-7 text-center font-bold`}
					>
						{lyricsOffset > 0 ? "+" : ""}
						{lyricsOffset.toFixed(1)}s
					</span>
					<button
						onClick={() => setLyricsOffset((prev) => prev + 0.5)}
						className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
					>
						+
					</button>
				</div>
			)}

			<div
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto no-scrollbar py-12 px-2 flex flex-col gap-6 text-center select-none pt-12"
			>
				{linesMap.length === 0 ? (
					<div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-1.5">
						<span className="text-xs font-mono tracking-wider text-neutral-400">
							{getTranslation(lang, "noLyrics")}
						</span>
						<span className="text-[10px] text-neutral-600 font-mono">
							{getTranslation(lang, "lyricsPlaceholder")}
						</span>
					</div>
				) : (
					linesMap.map((line, idx) => {
						const isActive = idx === activeLineIdx;
						return (
							<p
								key={`lyric-${idx}`}
								id={`lyric-line-${idx}`}
								onClick={() => {
									seekTrack(Math.max(0, line.time - lyricsOffset));
								}}
								className={`text-sm md:text-base font-bold tracking-tight py-1.5 transition-all duration-300 cursor-pointer ${
									isActive
										? `${accentText} font-black scale-105 filter drop-shadow-[0_0_12px_rgba(${accentRGB},0.55)]`
										: "text-neutral-500 hover:text-neutral-200"
								}`}
							>
								{line.text}
							</p>
						);
					})
				)}
				<div className="h-24 shrink-0" />
			</div>
		</motion.div>
	);
};
