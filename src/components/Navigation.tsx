import { Activity, Home, Library, Search, Sliders } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMusic } from "../context/MusicContext";
import type { ActiveTab } from "../types";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBgClass,
	getAccentRGB,
	getAccentTextClass,
} from "../utils/themeUtils";

export const Navigation: React.FC = () => {
	const { activeTab, setActiveTab, settings } = useMusic();
	const lang = settings.language;
	const accent = settings.themeAccent;
	const _accentRGB = getAccentRGB(accent);

	const tabs: {
		id: ActiveTab;
		icon: React.ReactNode;
		labelKey: Parameters<typeof getTranslation>[1];
	}[] = [
		{ id: "home", icon: <Home className="w-5 h-5" />, labelKey: "home" },
		{
			id: "library",
			icon: <Library className="w-5 h-5" />,
			labelKey: "library",
		},
		{
			id: "stats",
			icon: <Activity className="w-5 h-5" />,
			labelKey: "stats",
		},
		{ id: "search", icon: <Search className="w-5 h-5" />, labelKey: "search" },
		{
			id: "settings",
			icon: <Sliders className="w-5 h-5" />,
			labelKey: "settings",
		},
	];

	return (
		<div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 glass-ios rounded-[2rem] neural-shadow flex items-center justify-around px-2 z-40 select-none border border-white/10">
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						type="button"
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className="relative flex flex-col items-center justify-center py-1.5 transition-all w-16 cursor-pointer"
					>
						{isActive && (
							<motion.div
								layoutId="nav-pill"
								className={`absolute inset-0 ${getAccentBgClass(accent)}/10 squircle border border-white/5`}
								transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
							/>
						)}
						<div
							className={`transition-all duration-300 z-10 ${isActive ? `${getAccentTextClass(accent)} scale-110` : "text-neutral-500"}`}
						>
							{tab.icon}
						</div>
						<span
							className={`text-[8px] font-sans font-bold tracking-tight z-10 transition-colors uppercase ${isActive ? getAccentTextClass(accent) : "text-neutral-600"}`}
						>
							{getTranslation(lang, tab.labelKey)}
						</span>
					</button>
				);
			})}
		</div>
	);
};
export default Navigation;
