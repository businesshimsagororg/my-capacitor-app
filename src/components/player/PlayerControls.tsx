import {
	Pause,
	Play,
	Repeat,
	Shuffle,
	SkipBack,
	SkipForward,
} from "lucide-react";
import type React from "react";
import { useMusic } from "../../context/MusicContext";
import {
	getAccentBgClass,
	getAccentColor,
	getAccentTextClass,
} from "../../utils/themeUtils";

export const PlayerControls: React.FC = () => {
	const {
		isPlaying,
		togglePlay,
		nextTrack,
		prevTrack,
		settings,
		updateSettings,
		shuffleQueue,
		triggerHaptic,
	} = useMusic();

	const _lang = settings.language;
	const accent = settings.themeAccent;
	const _accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const _accentColor = getAccentColor(accent);

	return (
		<div className="flex items-center justify-center gap-7">
			<button
				onClick={() => {
					updateSettings({ shuffleMode: !settings.shuffleMode });
					if (!settings.shuffleMode) shuffleQueue();
				}}
				className={`w-10 h-10 squircle flex items-center justify-center border transition-all ${
					settings.shuffleMode
						? `${accentBg} border-white/10 text-white shadow-lg`
						: "bg-black/30 border-white/5 text-neutral-500 hover:text-white"
				}`}
			>
				<Shuffle
					className={`w-4 h-4 ${settings.shuffleMode ? "animate-pulse" : ""}`}
				/>
			</button>

			<button
				onClick={() => {
					triggerHaptic();
					prevTrack();
				}}
				className="w-12 h-12 squircle bg-neutral-950 border border-white/5 hover:bg-neutral-900 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90 neural-shadow"
			>
				<SkipBack className="w-5 h-5 fill-white" />
			</button>

			<button
				onClick={togglePlay}
				className="w-20 h-20 squircle bg-white hover:bg-neutral-100 flex items-center justify-center text-black shadow-2xl shrink-0 cursor-pointer transition-transform active:scale-95 ring-[6px] ring-white/5"
			>
				{isPlaying ? (
					<Pause className="w-8 h-8 fill-black text-black" />
				) : (
					<Play className="w-8 h-8 fill-black text-black ml-1.5" />
				)}
			</button>

			<button
				onClick={() => {
					triggerHaptic();
					nextTrack();
				}}
				className="w-12 h-12 squircle bg-neutral-950 border border-white/5 hover:bg-neutral-900 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90 neural-shadow"
			>
				<SkipForward className="w-5 h-5 fill-white" />
			</button>

			<button
				onClick={() => {
					triggerHaptic();
					const currentMode = settings.repeatMode || "none";
					let nextMode: "none" | "one" | "twice" | "all" = "none";
					if (currentMode === "none") nextMode = "one";
					else if (currentMode === "one") nextMode = "twice";
					else if (currentMode === "twice") nextMode = "all";
					else if (currentMode === "all") nextMode = "none";
					updateSettings({ repeatMode: nextMode });
				}}
				className={`w-10 h-10 squircle flex items-center justify-center border transition-all relative ${
					settings.repeatMode !== "none"
						? `${accentBg} border-white/10 text-white shadow-lg`
						: "bg-black/30 border-white/5 text-neutral-500"
				}`}
			>
				<Repeat
					className={`w-4 h-4 ${settings.repeatMode !== "none" ? "animate-pulse" : ""}`}
				/>
				{settings.repeatMode === "one" && (
					<span className="absolute -top-1 -right-1 bg-blue-500 text-white font-mono text-[9px] leading-none rounded-full w-4 h-4 flex items-center justify-center font-black shadow-sm ring-2 ring-black">
						1
					</span>
				)}
				{settings.repeatMode === "twice" && (
					<span className="absolute -top-1 -right-1 bg-teal-500 text-white font-mono text-[9px] leading-none rounded-full w-4 h-4 flex items-center justify-center font-black animate-pulse shadow-sm ring-2 ring-black">
						2
					</span>
				)}
				{settings.repeatMode === "all" && (
					<span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[7px] leading-none rounded-full px-1 py-0.5 flex items-center justify-center font-black uppercase shadow-sm ring-2 ring-black">
						All
					</span>
				)}
			</button>
		</div>
	);
};
