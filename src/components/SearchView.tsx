import { Disc, History, Search, X } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useMusic } from "../context/MusicContext";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorderClass,
	getAccentColor,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";

export const SearchView: React.FC = () => {
	const {
		tracks,
		playTrack,
		currentTrack,
		settings,
		searchQuery,
		setSearchQuery,
		searchHistory,
		addToSearchHistory,
		clearSearchHistory,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const _accentRGB = getAccentRGB(accent);
	const accentText = getAccentTextClass(accent);
	const _accentBg = getAccentBgClass(accent);
	const _accentColor = getAccentColor(accent);

	// Filter logic: covers title, artist, genre, mood in BOTH English and Bengali translations!
	const results = tracks.filter((track) => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return false;

		return (
			track.title.toLowerCase().includes(q) ||
			track.artist.toLowerCase().includes(q) ||
			track.genre.toLowerCase().includes(q) ||
			track.mood.toLowerCase().includes(q) ||
			track.bengaliTitle?.toLowerCase().includes(q) ||
			track.bengaliArtist?.toLowerCase().includes(q)
		);
	});

	const handleSearchCommit = (qStr: string) => {
		setSearchQuery(qStr);
		addToSearchHistory(qStr);
	};

	const trendingTags = useMemo(() => {
		const genres = [...new Set(tracks.map((t) => t.genre))];
		return genres.slice(0, 5);
	}, [tracks]);

	return (
		<div className="flex-1 overflow-y-auto pb-24 text-left px-4">
			{/* Search Input bar */}
			<div className="py-4">
				<div className="relative flex items-center group">
					<Search className="absolute left-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-white" />
					<input
						type="text"
						placeholder={getTranslation(lang, "searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSearchCommit(searchQuery);
						}}
						className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-neutral-900 text-sm font-bold text-white focus:outline-none focus:border-white/20 focus:bg-black transition-all shadow-xl neural-shadow`}
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-4 w-8 h-8 squircle bg-neutral-900/60 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-90"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>
			</div>

			{searchQuery === "" ? (
				/* Empty search dashboard view */
				<div className="space-y-6">
					{/* History tags list */}
					{searchHistory.length > 0 && (
						<div>
							<div className="flex items-center justify-between mb-2.5">
								<span className="text-[10px] uppercase font-mono tracking-widest font-bold text-neutral-500 flex items-center gap-1.5">
									<History className="w-3.5 h-3.5" />
									{getTranslation(lang, "searchHistory")}
								</span>
								<button
									onClick={clearSearchHistory}
									className="text-[10px] font-mono text-neutral-600 hover:text-red-500 transition-colors"
								>
									{getTranslation(lang, "clearHistory")}
								</button>
							</div>

							<div className="flex flex-wrap gap-2.5">
								{searchHistory.map((term, idx) => (
									<button
										key={`history-${idx}`}
										onClick={() => handleSearchCommit(term)}
										className="px-4 py-2 rounded-xl bg-neutral-950/60 border border-neutral-900 hover:bg-neutral-900 cursor-pointer flex items-center gap-2 transition-all transition-all active:scale-95 shadow-sm"
									>
										<History className="w-3.5 h-3.5 text-neutral-500" />
										<span className="text-xs font-bold text-neutral-300">
											{term}
										</span>
									</button>
								))}
							</div>
						</div>
					)}

					<div>
						<h3 className="text-[10px] font-mono font-black tracking-[0.2em] text-neutral-600 uppercase mb-4 flex items-center gap-3">
							<div className="w-8 h-8 squircle bg-neutral-900 flex items-center justify-center">
								<Disc className="w-4 h-4 text-neutral-500" />
							</div>
							Trending Local Tags
						</h3>
						<div className="flex flex-wrap gap-2.5">
							{trendingTags.map((tag: string) => (
								<button
									key={tag}
									onClick={() => handleSearchCommit(tag)}
									className={`px-4 py-2 rounded-xl bg-neutral-950/80 border border-neutral-900 text-xs font-black text-neutral-300 transition-all hover:bg-neutral-900 active:scale-95 shadow-sm`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				</div>
			) : (
				/* Search listing results */
				<div className="space-y-2">
					<span className="text-[10px] uppercase font-mono tracking-widest font-bold text-neutral-500 mb-2 block">
						Search Output ({results.length} files found)
					</span>

					{results.length === 0 ? (
						<div className="text-center p-8 border border-dashed border-neutral-900 rounded-xl">
							<Disc className="w-8 h-8 text-neutral-700 mx-auto animate-spin" />
							<p className="text-xs text-neutral-500 font-mono mt-2.5">
								No offline details match "{searchQuery}" in our system index.
							</p>
						</div>
					) : (
						results.map((track) => {
							const isActive = currentTrack?.id === track.id;
							return (
								<div
									key={`res-${track.id}`}
									onClick={() => {
										addToSearchHistory(searchQuery);
										playTrack(track);
									}}
									className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${
										isActive
											? `${getAccentBg20Class(accent)} ${getAccentBorderClass(accent)}/40 shadow-xl ${getAccentShadowClass(accent)}`
											: "bg-neutral-950/60 border-neutral-900 hover:bg-neutral-900 shadow-sm active:scale-[0.98]"
									}`}
								>
									<div className="flex items-center gap-4 overflow-hidden flex-1">
										<div
											className="w-12 h-12 squircle shrink-0 border border-neutral-800/50 flex items-center justify-center font-bold"
											style={{ background: track.artwork }}
										/>
										<div className="flex flex-col text-left overflow-hidden">
											<span
												className={`text-sm font-black tracking-tight truncate ${isActive ? accentText : "text-white"}`}
											>
												{lang === "bn" && track.bengaliTitle
													? track.bengaliTitle
													: track.title}
											</span>
											<span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase truncate">
												{lang === "bn" && track.bengaliArtist
													? track.bengaliArtist
													: track.artist}
											</span>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
};
export default SearchView;
