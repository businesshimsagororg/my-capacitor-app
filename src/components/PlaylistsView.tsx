import {
	Check,
	ChevronRight,
	FolderHeart,
	ListMusic,
	Music,
	Pencil,
	Play,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useMusic } from "../context/MusicContext";
import type { Playlist, Track } from "../types";
import { getTranslation } from "../utils/bengaliTranslations";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentColor,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";

export const PlaylistsView: React.FC = () => {
	const {
		playlists,
		tracks,
		createPlaylist,
		renamePlaylist,
		deletePlaylist,
		addTrackToPlaylist,
		removeTrackFromPlaylist,
		playTrack,
		setQueue,
		settings,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const _accentRGB = getAccentRGB(accent);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	// Selected Playlist drilldown
	const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
		null,
	);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState("");

	useEffect(() => {
		if (selectedPlaylist) setEditTitle(selectedPlaylist.name);
	}, [selectedPlaylist]);

	// Modals / forms state
	const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
	const [newPlName, setNewPlName] = useState<string>("");
	const [newPlDesc, setNewPlDesc] = useState<string>("");

	const [showAddTracksModal, setShowAddTracksModal] = useState<boolean>(false);

	const handleRename = () => {
		if (selectedPlaylist && editTitle.trim()) {
			renamePlaylist(selectedPlaylist.id, editTitle);
			setSelectedPlaylist({ ...selectedPlaylist, name: editTitle });
			setIsEditingTitle(false);
		}
	};

	// Playlist track helper
	const getPlaylistTracks = (playlist: Playlist): Track[] => {
		if (playlist.isSmart && playlist.smartCriteria === "favorites") {
			return tracks.filter((t) => t.isFavorite);
		}
		return tracks.filter((t) => playlist.trackIds.includes(t.id));
	};

	const handleCreate = () => {
		if (!newPlName.trim()) return;
		createPlaylist(newPlName, newPlDesc);
		setNewPlName("");
		setNewPlDesc("");
		setShowCreateModal(false);
	};

	const handlePlayPlaylist = (playlist: Playlist) => {
		const plTracks = getPlaylistTracks(playlist);
		if (plTracks.length === 0) return;
		setQueue(plTracks);
		playTrack(plTracks[0]);
	};

	return (
		<div className="flex-1 overflow-y-auto pb-24 text-left px-4">
			{/* Header */}
			<div className="py-4 border-b border-neutral-900 mb-5 flex items-center justify-between">
				<h2 className="text-lg font-black text-white tracking-tight">
					{getTranslation(lang, "playlists")}
				</h2>

				{!selectedPlaylist && (
					<button
						onClick={() => setShowCreateModal(true)}
						className={`px-4 py-2 rounded-full ${accentBg} hover:opacity-90 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-xl ${getAccentShadowClass(accent)} cursor-pointer active:scale-95`}
					>
						<Plus className="w-4 h-4" />
						{lang === "bn" ? "নতুন" : "New Folder"}
					</button>
				)}
			</div>

			{selectedPlaylist ? (
				/* Playlist Drilldown view */
				<div className="space-y-4">
					{/* Breadcrumb back */}
					<button
						onClick={() => setSelectedPlaylist(null)}
						className={`text-xs font-mono ${accentText} hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg`}
					>
						{getTranslation(lang, "backToPlaylists")}
					</button>

					<div className="p-5 rounded-[2rem] bg-neutral-950/80 border border-white/10 flex items-center justify-between gap-4 shadow-2xl neural-shadow">
						<div className="flex items-center gap-4 overflow-hidden flex-1">
							<div
								className={`w-16 h-16 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} shrink-0 neural-shadow`}
							>
								{selectedPlaylist.isSmart ? (
									<FolderHeart className="w-8 h-8" />
								) : (
									<ListMusic className="w-8 h-8" />
								)}
							</div>
							<div className="flex flex-col text-left overflow-hidden">
								<div className="flex items-center gap-2">
									{isEditingTitle ? (
										<input
											type="text"
											value={editTitle}
											onChange={(e) => setEditTitle(e.target.value)}
											className="bg-neutral-900 text-white rounded px-1 text-base font-black w-full focus:outline-none"
										/>
									) : (
										<span className="text-base font-black text-white leading-tight tracking-tight uppercase truncate">
											{lang === "bn" && selectedPlaylist.bengaliName
												? selectedPlaylist.bengaliName
												: selectedPlaylist.name}
										</span>
									)}
									{!selectedPlaylist.isSmart && (
										<button
											onClick={() =>
												isEditingTitle
													? handleRename()
													: setIsEditingTitle(true)
											}
											className="shrink-0 p-1 hover:bg-neutral-800 rounded"
										>
											{isEditingTitle ? (
												<Check className="w-3 h-3 text-emerald-400" />
											) : (
												<Pencil className="w-3 h-3 text-neutral-500" />
											)}
										</button>
									)}
								</div>
								<span className="text-xs text-neutral-400 font-medium leading-relaxed max-w-sm truncate mt-0.5">
									{selectedPlaylist.description}
								</span>
								<div className="flex items-center gap-2 mt-1.5">
									<div
										className={`w-1.5 h-1.5 rounded-full ${accentBg} animate-pulse`}
									/>
									<span className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase">
										{lang === "bn"
											? `${getPlaylistTracks(selectedPlaylist).length}টি ইমপর্টেড ফাইল`
											: `${getPlaylistTracks(selectedPlaylist).length} local fragments`}
									</span>
								</div>
							</div>
						</div>

						<div className="flex items-center shrink-0">
							{getPlaylistTracks(selectedPlaylist).length > 0 && (
								<button
									onClick={() => handlePlayPlaylist(selectedPlaylist)}
									className={`w-12 h-12 squircle ${accentBg} hover:opacity-90 flex items-center justify-center text-white cursor-pointer shadow-xl ${getAccentShadowClass(accent)} active:scale-90 transition-transform`}
								>
									<Play className="w-5 h-5 fill-white" />
								</button>
							)}
						</div>
					</div>

					{/* Options row */}
					{!selectedPlaylist.isSmart && (
						<div className="flex gap-2">
							<button
								onClick={() => setShowAddTracksModal(true)}
								className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-blue-900/40 text-xs font-sans font-bold text-neutral-200"
							>
								{getTranslation(lang, "addSongs")}
							</button>

							<button
								onClick={() => {
									deletePlaylist(selectedPlaylist.id);
									setSelectedPlaylist(null);
								}}
								className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-950 border border-neutral-800 hover:border-red-900/30 text-xs font-sans font-bold text-red-500 flex items-center gap-1"
							>
								<Trash2 className="w-3.5 h-3.5" />
								{getTranslation(lang, "deleteFolder")}
							</button>
						</div>
					)}

					{/* Tracks in Playlist */}
					<div className="space-y-2">
						{getPlaylistTracks(selectedPlaylist).length === 0 ? (
							<div className="p-8 text-center border border-dashed border-neutral-900 rounded-xl">
								<Music className="w-8 h-8 text-neutral-500 mx-auto mb-1.5" />
								<p className="text-xs text-neutral-400 font-mono">
									{getTranslation(lang, "emptyPlaylist")}
								</p>
							</div>
						) : (
							getPlaylistTracks(selectedPlaylist).map((track) => (
								<div
									key={`item-${track.id}`}
									className="p-2.5 rounded-xl border border-neutral-900 bg-neutral-950 flex items-center justify-between"
								>
									<div
										onClick={() => playTrack(track)}
										className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
									>
										<div
											className="w-9 h-9 rounded-lg shrink-0 border border-neutral-800 flex items-center justify-center font-bold"
											style={{ background: track.artwork }}
										/>
										<div className="flex flex-col text-left overflow-hidden">
											<span className="text-xs font-bold text-white truncate">
												{lang === "bn" && track.bengaliTitle
													? track.bengaliTitle
													: track.title}
											</span>
											<span className="text-[10px] text-neutral-500 font-mono truncate">
												{lang === "bn" && track.bengaliArtist
													? track.bengaliArtist
													: track.artist}
											</span>
										</div>
									</div>

									{!selectedPlaylist.isSmart && (
										<button
											onClick={() =>
												removeTrackFromPlaylist(track.id, selectedPlaylist.id)
											}
											className="w-7 h-7 rounded-md bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center border border-neutral-800 group"
										>
											<X className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400" />
										</button>
									)}
								</div>
							))
						)}
					</div>
				</div>
			) : (
				/* Grid list of Playlists folders */
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{playlists.map((pl) => {
						const numTracks = getPlaylistTracks(pl).length;
						return (
							<div
								key={pl.id}
								onClick={() => setSelectedPlaylist(pl)}
								className="p-5 rounded-[2rem] border border-neutral-900 bg-neutral-950/80 hover:bg-neutral-900 cursor-pointer flex items-center justify-between transition-all relative group shadow-lg active:scale-[0.98] glass-ios"
							>
								<div className="flex items-center gap-4">
									<div
										className={`w-12 h-12 squircle border flex items-center justify-center shrink-0 neural-shadow transition-transform group-hover:scale-105 ${
											pl.isSmart
												? "bg-rose-950 text-rose-400 border-rose-900/30"
												: `${getAccentBg20Class(accent)} ${accentText} border-${accentColor}/30`
										}`}
									>
										{pl.isSmart ? (
											<FolderHeart className="w-6 h-6 animate-pulse" />
										) : (
											<ListMusic className="w-6 h-6" />
										)}
									</div>

									<div className="flex flex-col text-left">
										<span
											className={`text-sm font-black text-white tracking-tight uppercase group-hover:${accentText} transition-colors`}
										>
											{lang === "bn" && pl.bengaliName
												? pl.bengaliName
												: pl.name}
										</span>
										<div className="flex items-center gap-1.5 mt-1">
											<div
												className={`w-1 h-1 rounded-full ${pl.isSmart ? "bg-rose-500" : accentBg}`}
											/>
											<span className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase">
												{lang === "bn"
													? `${numTracks}টি আইটেম`
													: `${numTracks} items`}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center shrink-0 text-neutral-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
									<ChevronRight className="w-5 h-5" />
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* CREATE PLAYLIST MODAL */}
			{showCreateModal && (
				<div className="absolute inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/85 backdrop-blur-sm"
						onClick={() => setShowCreateModal(false)}
					/>
					<div className="relative w-full max-w-sm rounded-[20px] bg-neutral-950 border border-neutral-800 p-5 flex flex-col gap-4 text-left">
						<h3 className="text-sm font-bold text-white border-b border-neutral-900 pb-2">
							{getTranslation(lang, "createPlaylistFolder")}
						</h3>

						<div className="flex flex-col gap-1.5">
							<label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400">
								{lang === "bn" ? "ফোল্ডারের নাম" : "Folder Name"}
							</label>
							<input
								type="text"
								placeholder={
									lang === "bn"
										? "উদাহরণ: আমার সেরা গান"
										: "My Chill Hits, Bengali Folk etc"
								}
								value={newPlName}
								onChange={(e) => setNewPlName(e.target.value)}
								className={`w-full px-3 py-2 text-xs font-semibold rounded-lg bg-black border border-neutral-800 text-white focus:outline-none focus:border-${accentColor}`}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400">
								{lang === "bn" ? "বিবরণ" : "Description"}
							</label>
							<input
								type="text"
								placeholder={lang === "bn" ? "সংক্ষিপ্ত তথ্য" : "Short outline"}
								value={newPlDesc}
								onChange={(e) => setNewPlDesc(e.target.value)}
								className={`w-full px-3 py-2 text-xs font-semibold rounded-lg bg-black border border-neutral-800 text-white focus:outline-none focus:border-${accentColor}`}
							/>
						</div>

						<button
							onClick={handleCreate}
							className={`w-full py-2.5 rounded-lg ${accentBg} hover:opacity-90 text-white font-bold text-xs font-sans uppercase shadow-md shadow-${accentColor}/20 cursor-pointer`}
						>
							{lang === "bn" ? "তৈরি করুন" : "Create Folder"}
						</button>
					</div>
				</div>
			)}

			{/* SMART ADD SONGS TO PLAYLIST DIALOG */}
			{showAddTracksModal && selectedPlaylist && (
				<div className="absolute inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/85 backdrop-blur-sm"
						onClick={() => setShowAddTracksModal(false)}
					/>
					<div className="relative w-full max-w-sm h-[400px] rounded-[20px] bg-neutral-950 border border-neutral-800 p-5 flex flex-col text-left">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-3">
							<span className="text-xs font-bold font-mono text-neutral-400 uppercase">
								{lang === "bn" ? "গান নির্বাচন করুন" : "Select Songs"}
							</span>
							<button
								onClick={() => setShowAddTracksModal(false)}
								className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center"
							>
								<X className="w-3.5 h-3.5 text-neutral-400" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-2">
							{tracks
								.filter((t) => !selectedPlaylist.trackIds.includes(t.id))
								.map((track) => (
									<div
										key={`add-${track.id}`}
										onClick={() =>
											addTrackToPlaylist(track.id, selectedPlaylist.id)
										}
										className="p-2 rounded-lg border border-neutral-900 bg-neutral-950 hover:bg-neutral-900 cursor-pointer flex items-center justify-between"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<div
												className="w-8 h-8 rounded-md"
												style={{ background: track.artwork }}
											/>
											<div className="flex flex-col text-left overflow-hidden">
												<span className="text-xs font-semibold text-white truncate">
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
										<Plus className={`w-4 h-4 ${accentText} shrink-0`} />
									</div>
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
export default PlaylistsView;
