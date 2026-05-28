import { ListMusic, Music } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMusic } from "../../context/MusicContext";
import { getTranslation } from "../../utils/bengaliTranslations";
import {
	getAccentBgClass,
	getAccentColor,
	getAccentTextClass,
} from "../../utils/themeUtils";

interface QueueSheetProps {
	onClose: () => void;
}

export const QueueSheet: React.FC<QueueSheetProps> = ({ onClose }) => {
	const { queue, currentTrack, playTrack, settings } = useMusic();
	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	return (
		<div className="flex flex-col h-full bg-neutral-950 border-t border-neutral-900 rounded-t-3xl overflow-hidden shadow-2xl">
			<div
				className="w-12 h-1 bg-neutral-800 rounded-full mx-auto my-3 shrink-0"
				onClick={onClose}
			/>

			<div className="px-6 py-4 flex items-center justify-between border-b border-neutral-900/50">
				<div className="flex items-center gap-2">
					<ListMusic className={`w-5 h-5 ${accentText}`} />
					<h2 className="text-sm font-black tracking-tight text-white">
						{getTranslation(lang, "queue")}
					</h2>
					<span className="text-[10px] font-mono text-neutral-500 font-bold ml-2 bg-neutral-900 px-2 py-0.5 rounded-full">
						{queue.length} Tracks
					</span>
				</div>
				<button
					onClick={onClose}
					className="text-xs font-bold text-neutral-500 hover:text-white transition-colors"
				>
					{lang === "bn" ? "বন্ধ করুন" : "Done"}
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
				{queue.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-neutral-600 gap-3">
						<Music className="w-10 h-10 opacity-20" />
						<p className="text-xs font-mono">
							{lang === "bn" ? "কোনো গান নেই" : "Queue is empty"}
						</p>
					</div>
				) : (
					queue.map((track, idx) => {
						const isCurrent = currentTrack?.id === track.id;
						return (
							<motion.div
								key={`${track.id}-${idx}`}
								onClick={() => playTrack(track)}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: idx * 0.03, duration: 0.2 }}
								className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
									isCurrent
										? `${accentBg}/15 border border-${accentColor}-900/40`
										: "hover:bg-neutral-900 border border-transparent"
								}`}
							>
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm border border-neutral-900/50 overflow-hidden relative group`}
								>
									{track.artwork.startsWith("data:") ||
									track.artwork.startsWith("http") ? (
										<img
											src={track.artwork}
											alt=""
											className="w-full h-full object-cover"
										/>
									) : (
										<div
											style={{ background: track.artwork }}
											className="w-full h-full opacity-60"
										/>
									)}
									{isCurrent && (
										<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
											<div className="flex gap-0.5 h-3 items-end pb-0.5">
												<div
													className="w-0.5 bg-white animate-[bounce_0.6s_ease-in-out_infinite]"
													style={{ height: "60%" }}
												/>
												<div
													className="w-0.5 bg-white animate-[bounce_0.8s_ease-in-out_infinite]"
													style={{ height: "100%" }}
												/>
												<div
													className="w-0.5 bg-white animate-[bounce_0.7s_ease-in-out_infinite]"
													style={{ height: "80%" }}
												/>
											</div>
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<p
										className={`text-[13px] font-bold truncate leading-tight ${isCurrent ? accentText : "text-neutral-200"}`}
									>
										{lang === "bn" && track.bengaliTitle
											? track.bengaliTitle
											: track.title}
									</p>
									<p className="text-[10px] font-mono text-neutral-500 truncate mt-0.5 uppercase tracking-wide">
										{lang === "bn" && track.bengaliArtist
											? track.bengaliArtist
											: track.artist}
									</p>
								</div>

								{isCurrent && (
									<span
										className={`text-[8px] font-mono font-black uppercase ${accentText} bg-white/5 px-1.5 py-0.5 rounded border border-${accentColor}-500/20`}
									>
										Playing
									</span>
								)}
							</motion.div>
						);
					})
				)}
				<div className="h-6 shrink-0" />
			</div>
		</div>
	);
};
