import { Music } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useMusic } from "../context/MusicContext";
import {
	getAccentBgClass,
	getAccentColor,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";

export const DynamicIsland: React.FC = () => {
	const { islandNotification, settings } = useMusic();
	const accent = settings.themeAccent;
	const accentText = getAccentTextClass(accent);
	const _accentRGB = getAccentRGB(accent);
	const accentBg = getAccentBgClass(accent);
	const _accentColor = getAccentColor(accent);

	const getIcon = (iconStr: string) => {
		switch (iconStr) {
			case "💤":
				return <span className="text-sm">💤</span>;
			case "⏱️":
				return <span className="text-xs">⏱️</span>;
			case "💖":
				return <span className="text-red-500 text-xs">💖</span>;
			case "💔":
				return <span className="text-gray-500 text-xs">💔</span>;
			case "📥":
				return <span className={`${accentText} text-xs`}>📥</span>;
			case "✅":
				return <span className="text-emerald-400 text-xs">✅</span>;
			case "⚠️":
				return <span className="text-amber-400 text-xs">⚠️</span>;
			case "🗑️":
				return <span className="text-rose-400 text-xs">🗑️</span>;
			case "🏷️":
				return <span className="text-purple-400 text-xs">🏷️</span>;
			default:
				return <Music className={`w-3.5 h-3.5 ${accentText} animate-pulse`} />;
		}
	};

	return (
		<div className="absolute top-2 left-0 right-0 z-50 flex justify-center pointer-events-none">
			<AnimatePresence>
				{islandNotification ? (
					<motion.div
						id="dynamic-island-active"
						initial={{
							width: 120,
							height: 24,
							borderRadius: 12,
							opacity: 0,
							y: -20,
							scale: 0.8,
						}}
						animate={{
							width: 320,
							height: 52,
							borderRadius: 20,
							opacity: 1,
							y: 12,
							scale: 1,
							transition: {
								type: "spring",
								stiffness: 400,
								damping: 20,
								mass: 0.8,
							},
						}}
						exit={{
							width: 120,
							height: 24,
							borderRadius: 12,
							opacity: 0,
							y: -20,
							scale: 0.8,
							transition: { duration: 0.2 },
						}}
						className="glass-ios neural-shadow flex items-center px-4 justify-between pointer-events-auto cursor-pointer border border-white/10"
					>
						<div className="flex items-center gap-3 overflow-hidden">
							<div
								className={`w-8 h-8 squircle bg-black flex items-center justify-center shrink-0 shadow-lg ${getAccentShadowClass(accent)}`}
							>
								{getIcon(islandNotification.icon)}
							</div>
							<div className="flex flex-col text-left overflow-hidden">
								<span className="text-[10px] font-bold text-white tracking-tight truncate uppercase">
									{islandNotification.title}
								</span>
								<span className="text-[9px] text-neutral-400 font-medium tracking-tight truncate max-w-[210px]">
									{islandNotification.subtitle}
								</span>
							</div>
						</div>

						<div className="flex items-center shrink-0">
							<div
								className={`w-1.5 h-1.5 rounded-full ${accentBg} shadow-lg ${getAccentShadowClass(accent)} ring-2 ring-white/5`}
							/>
						</div>
					</motion.div>
				) : (
					// Default compact notch idle look
					<motion.div
						id="dynamic-island-idle"
						initial={{ width: 120, height: 24 }}
						animate={{ width: 130, height: 28, borderRadius: 14, y: 12 }}
						className="bg-black border border-white/5 shadow-2xl flex items-center justify-center gap-2 pointer-events-auto"
						onClick={() => {}}
					>
						<div className="w-1 h-1 rounded-full bg-neutral-800" />
						<div className="w-8 h-2.5 rounded-full bg-neutral-900/50 flex items-center justify-center backdrop-blur-md">
							<div className="w-4 h-0.5 rounded-full bg-neutral-800" />
						</div>
						<div className="w-1 h-1 rounded-full bg-neutral-800" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
export default DynamicIsland;
