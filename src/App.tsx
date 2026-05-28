import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { DynamicIsland } from "./components/DynamicIsland";
import { HomeView } from "./components/HomeView";
import { LibraryView } from "./components/LibraryView";
import { MiniPlayer } from "./components/MiniPlayer";
import { Navigation } from "./components/Navigation";
import { PlayerModal } from "./components/PlayerModal";
import { PlaylistsView } from "./components/PlaylistsView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";
import { SideMenu } from "./components/SideMenu";
import { StatsView } from "./components/StatsView";
import { MusicProvider, useMusic } from "./context/MusicContext";
import { useLockScreenControls } from "./hooks/useLockScreenControls";

function MainAppShell() {
	useLockScreenControls();
	const { activeTab, togglePlay, nextTrack, prevTrack, setVolume, settings } =
		useMusic();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			switch (e.key) {
				case " ":
					e.preventDefault();
					togglePlay();
					break;
				case "ArrowRight":
					nextTrack();
					break;
				case "ArrowLeft":
					prevTrack();
					break;
				case "m":
				case "M":
					setVolume(settings.volume > 0 ? 0 : 0.8);
					break;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [togglePlay, nextTrack, prevTrack, setVolume, settings.volume]);

	const renderActiveView = () => {
		switch (activeTab) {
			case "home":
				return (
					<div className="flex-1 flex flex-col overflow-hidden">
						{/* Embedded Live Visualizer right inside Home view for rich interaction */}
						<div className="px-4 pt-16 mb-1 shrink-0">
							<AudioVisualizer height={80} />
						</div>
						<HomeView />
					</div>
				);
			case "library":
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<LibraryView />
					</div>
				);
			case "playlists":
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<PlaylistsView />
					</div>
				);
			case "stats":
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<StatsView />
					</div>
				);
			case "search":
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<SearchView />
					</div>
				);
			case "settings":
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<SettingsView />
					</div>
				);
			default:
				return (
					<div className="flex-1 flex flex-col overflow-hidden pt-16">
						<HomeView />
					</div>
				);
		}
	};

	return (
		<div className="w-full h-screen bg-neutral-950 flex items-center justify-center overflow-hidden font-sans antialiased text-white selection:bg-blue-600/30">
			{/* iOS styled bezel container mapping the full AMOLED music player interface */}
			<div className="w-full max-w-md h-screen md:h-[840px] md:rounded-[40px] md:border-8 md:border-neutral-900 bg-black relative flex flex-col overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(59,130,246,0.04)]">
				{/* Top bar notched Dynamic island */}
				<DynamicIsland />

				{/* Dynamic active content routing panel with smooth animations */}
				<div className="flex-1 flex flex-col overflow-hidden">
					<AnimatePresence mode="wait">
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.18, ease: "easeOut" }}
							className="flex-1 flex flex-col overflow-hidden"
						>
							{renderActiveView()}
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Global floating slider player */}
				<MiniPlayer />

				{/* IOS tab bar */}
				<Navigation />

				{/* Fullscreen player overlay */}
				<PlayerModal />

				{/* Left-edge sliding diagnostic drawer */}
				<SideMenu />
			</div>
		</div>
	);
}

export default function App() {
	return (
		<MusicProvider>
			<MainAppShell />
		</MusicProvider>
	);
}
