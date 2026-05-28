import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useMusic } from "../../context/MusicContext";
import {
	getAccentBgClass,
	getAccentColor,
	getAccentTextClass,
} from "../../utils/themeUtils";

interface EQPanelProps {
	expanded: boolean;
	onToggle: () => void;
}

export const EQPanel: React.FC<EQPanelProps> = ({ expanded, onToggle }) => {
	const { settings, updateSettings } = useMusic();
	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	return (
		<AnimatePresence>
			{settings.vocalOnlyEnabled && expanded && (
				<motion.div
					initial={{ opacity: 0, height: 0, y: -10 }}
					animate={{ opacity: 1, height: "auto", y: 0 }}
					exit={{ opacity: 0, height: 0, y: -10 }}
					transition={{ duration: 0.25, ease: "easeOut" }}
					className={`mt-2.5 mx-1.5 ${accentBg}/20 border border-${accentColor}-500/10 rounded-xl p-3 relative overflow-hidden`}
				>
					<div className="flex flex-col gap-2.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<Sparkles
									className={`w-3.5 h-3.5 ${accentText} animate-spin`}
									style={{ animationDuration: "6s" }}
								/>
								<span
									className={`text-[10px] font-black uppercase ${accentText.replace("400", "300")} tracking-wide`}
								>
									{lang === "bn" ? "মিউজিকেও ফিল্টার" : "Music Suppression"}
								</span>
							</div>
							<span
								className={`text-[10px] font-mono font-bold ${accentText} ${accentBg}/50 border border-${accentColor}-500/20 px-2 py-0.5 rounded-md`}
							>
								{settings.vocalSuppressionLevel ?? 70}%
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-[8.5px] text-neutral-500 font-mono">
								{lang === "bn" ? "কম" : "Min"}
							</span>
							<input
								type="range"
								min={0}
								max={100}
								step={5}
								value={settings.vocalSuppressionLevel ?? 70}
								onChange={(e) =>
									updateSettings({
										vocalSuppressionLevel: parseInt(e.target.value, 10),
									})
								}
								className={`w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-${accentColor}-500`}
							/>
							<span
								className={`text-[8.5px] ${accentText} font-mono font-bold`}
							>
								{lang === "bn" ? "বেশি" : "Max"}
							</span>
						</div>

						<span className="text-[8px] text-neutral-500 leading-tight">
							{lang === "bn"
								? "অতিরিক্ত মিউজিক কমিয়ে শুধুমাত্র গায়কের কণ্ঠস্বর পরিষ্কার করে শোনাবে।"
								: "Isolate frequency bands while dynamically attenuating instrumentals."}
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
