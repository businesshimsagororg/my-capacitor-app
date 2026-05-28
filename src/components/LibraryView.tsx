import {
	Check,
	Edit2,
	Eye,
	EyeOff,
	FileAudio,
	Folder,
	Lock,
	Shield,
	ShieldAlert,
	Trash2,
	Unlock,
	Upload,
	X,
	Youtube,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useMusic } from "../context/MusicContext";
import type { Track } from "../types";
import { getTranslation } from "../utils/bengaliTranslations";
import { hashPIN } from "../utils/indexedDB";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentBorderClass,
	getAccentColor,
	getAccentColorClass,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";
import { PinUnlock } from "./PinUnlock";

export const LibraryView: React.FC = () => {
	const {
		tracks,
		playTrack,
		currentTrack,
		settings,
		importLocalFiles,
		deleteTrack,
		importYoutubeUrl,
		updateTrackTags,
		privateFolderUnlocked,
		setPrivateFolderUnlocked,
	} = useMusic();

	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentRGB = getAccentRGB(accent);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Active Sub-tab inside Library
	const [subTab, setSubTab] = useState<"all" | "folders" | "vault">("all");

	// Drag-and-drop landing states
	const [isDragging, setIsDragging] = useState<boolean>(false);

	// ID3 Tag editing state
	const [editingTrack, setEditingTrack] = useState<Track | null>(null);
	const [editTitle, setEditTitle] = useState<string>("");
	const [editArtist, setEditArtist] = useState<string>("");
	const [editAlbum, setEditAlbum] = useState<string>("");
	const [editGenre, setEditGenre] = useState<string>("");
	const [editMood, setEditMood] = useState<
		"Happy" | "Chill" | "Focus" | "Sad" | "Energy"
	>("Chill");
	const [editPrivate, setEditPrivate] = useState<boolean>(false);

	// Private vault lock management
	const [enteredPin, setEnteredPin] = useState<string>("");
	const [pinError, setPinError] = useState<boolean>(false);
	const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);

	// Folder routing mock simulation
	const [currentFolder, setCurrentFolder] = useState<string | null>(null);
	const [ytUrl, setYtUrl] = useState<string>("");

	// Trigger Face ID scanner automatically upon opening Private Vault subtab
	useEffect(() => {
		if (subTab === "vault" && !privateFolderUnlocked) {
			setIsFaceScanning(true);
		}
	}, [subTab, privateFolderUnlocked]);

	// Filter lists
	// Normal tracks are anything not private, unless unlocked
	const visibleTracks = tracks.filter((t) => {
		if (t.isPrivate) return privateFolderUnlocked;
		return true;
	});

	const normalTracks = tracks.filter((t) => !t.isPrivate);
	const privateTracks = tracks.filter((t) => t.isPrivate);

	const foldersList = {
		Synthesizers: tracks.filter(
			(t) => !t.id.startsWith("local-") && !t.isPrivate,
		),
		"Imported Audio": tracks.filter(
			(t) => t.id.startsWith("local-") && !t.isPrivate,
		),
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			await importLocalFiles(e.dataTransfer.files);
		}
	};

	const triggerFileInput = () => {
		if (fileInputRef.current) fileInputRef.current.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			await importLocalFiles(e.target.files);
		}
	};

	// Open Tag Editor
	const openTagEditor = (track: Track) => {
		setEditingTrack(track);
		setEditTitle(track.title);
		setEditArtist(track.artist);
		setEditAlbum(track.album);
		setEditGenre(track.genre);
		setEditMood(track.mood);
		setEditPrivate(!!track.isPrivate);
	};

	const handleSaveTags = () => {
		if (!editingTrack) return;
		const updated: Track = {
			...editingTrack,
			title: editTitle,
			artist: editArtist,
			album: editAlbum,
			genre: editGenre,
			mood: editMood,
			isPrivate: editPrivate,
		};
		updateTrackTags(updated);
		setEditingTrack(null);
	};

	// Handle PIN unlock
	const handleUnlockPin = async () => {
		const requiredPinHash = settings.privateFolderPin || null;
		const enteredPinHash = await hashPIN(enteredPin);

		if (enteredPinHash && enteredPinHash === requiredPinHash) {
			setPrivateFolderUnlocked(true);
			setPinError(false);
			setEnteredPin("");
		} else if (!requiredPinHash && enteredPin === "1234") {
			// Legacy/Default fallback if no PIN stored yet
			setPrivateFolderUnlocked(true);
			setPinError(false);
			setEnteredPin("");
		} else {
			setPinError(true);
			setEnteredPin("");
			setTimeout(() => setPinError(false), 2000);
		}
	};

	return (
		<div className="flex-1 overflow-y-auto pb-24 text-left px-4">
			{/* Title */}
			<div className="py-4 border-b border-neutral-900 mb-5 flex items-center justify-between">
				<h2 className="text-lg font-black text-white tracking-tight">
					{getTranslation(lang, "library")}
				</h2>

				<div className="flex gap-1.5 p-1 rounded-xl bg-neutral-900/60 backdrop-blur-md border border-white/5">
					{(["all", "folders", "vault"] as const).map((tab) => (
						<button
							key={tab}
							onClick={() => setSubTab(tab)}
							className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-tight transition-all cursor-pointer ${
								subTab === tab
									? `${getAccentBgClass(accent)} text-white shadow-lg ${getAccentShadowClass(accent)}`
									: "text-neutral-500 hover:text-white"
							}`}
						>
							{tab === "vault"
								? lang === "bn"
									? "ব্যক্তিগত ভল্ট"
									: "Vault"
								: getTranslation(
										lang,
										tab === "all" ? "allSongs" : "categories",
									)}
						</button>
					))}
				</div>
			</div>

			{subTab === "all" && (
				<>
					{/* YouTube Import Section */}
					<div className="mb-8 p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<div
								className={`w-10 h-10 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center`}
							>
								<Youtube className={`w-5 h-5 ${accentText}`} />
							</div>
							<div className="flex flex-col">
								<h3 className="text-sm font-bold text-white tracking-tight uppercase">
									{lang === "bn" ? "ইউটিউব থেকে ইম্পোর্ট" : "YouTube Import"}
								</h3>
								<p className="text-[10px] text-neutral-500 font-mono">
									{lang === "bn"
										? "অডিও ডাউনলোড করতে ভিডিও লিংক পেস্ট করুন"
										: "Paste a video URL to download as audio"}
								</p>
							</div>
						</div>

						<div className="flex gap-2">
							<input
								type="text"
								placeholder="https://www.youtube.com/watch?v=..."
								value={ytUrl}
								onChange={(e) => setYtUrl(e.target.value)}
								className={`flex-1 bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-${accentColor}/50 font-mono`}
							/>
							<button
								onClick={() => {
									importYoutubeUrl(ytUrl);
									setYtUrl("");
								}}
								disabled={!ytUrl}
								className={`px-5 py-2.5 rounded-xl ${accentBg} text-white font-bold text-[10px] uppercase tracking-wider disabled:opacity-50 disabled:grayscale transition-all active:scale-95`}
							>
								{lang === "bn" ? "যোগ করুন" : "Import"}
							</button>
						</div>
					</div>

					{/* Drag & Drop Upload Space */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={triggerFileInput}
						className={`cursor-pointer rounded-[2rem] border-2 border-dashed p-8 text-center transition-all duration-500 mb-8 flex flex-col items-center justify-center gap-3 ${
							isDragging
								? `border-${accentColor} ${getAccentBg20Class(accent)} shadow-2xl ${getAccentShadowClass(accent)}`
								: "border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900/40 hover:border-neutral-700"
						}`}
					>
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							multiple
							accept="audio/*"
							className="hidden"
						/>
						<div
							className={`w-14 h-14 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center neural-shadow transition-transform group-hover:scale-110`}
						>
							<Upload className={`w-7 h-7 ${accentText}`} />
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-white tracking-tight">
								{getTranslation(lang, "importBtn")}
							</span>
							<span className="text-[10px] text-neutral-400 font-mono mt-1">
								{getTranslation(lang, "importPrompt")}
							</span>
						</div>
					</div>

					{/* List of normal tracks */}
					<div className="space-y-2">
						<h3 className="text-xs font-mono font-extrabold tracking-widest text-neutral-500 uppercase mb-3 flex items-center gap-1">
							<FileAudio className="w-4 h-4 text-neutral-500" />
							{getTranslation(lang, "allSongs")} ({normalTracks.length})
						</h3>

						{normalTracks.length === 0 ? (
							<p className="text-xs text-neutral-500 font-mono text-center py-6">
								{getTranslation(lang, "noSongs")}
							</p>
						) : (
							<motion.div
								initial="hidden"
								animate="show"
								variants={{
									hidden: { opacity: 0 },
									show: {
										opacity: 1,
										transition: { staggerChildren: 0.05 },
									},
								}}
								className="space-y-2"
							>
								{normalTracks.map((track) => {
									const isActive = currentTrack?.id === track.id;
									return (
										<motion.div
											key={track.id}
											variants={{
												hidden: { opacity: 0, y: 15 },
												show: {
													opacity: 1,
													y: 0,
													transition: {
														ease: [0.22, 1, 0.36, 1],
														duration: 0.5,
													},
												},
											}}
											className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
												isActive
													? `${getAccentBg20Class(accent)} ${getAccentBorderClass(accent)}/40 shadow-xl ${getAccentShadowClass(accent)}`
													: "bg-neutral-950/60 border-neutral-900 hover:bg-neutral-900/80 active:scale-[0.98]"
											}`}
										>
											<div
												onClick={() => playTrack(track)}
												className="flex items-center gap-4 overflow-hidden flex-1 cursor-pointer"
											>
												<div
													className="w-12 h-12 squircle shrink-0 border border-neutral-800/50 flex items-center justify-center font-bold shadow-sm"
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
															: track.artist}{" "}
														// {Math.floor(track.duration / 60)}:
														{(track.duration % 60).toString().padStart(2, "0")}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												{/* ID3 tag editor trigger */}
												<button
													onClick={() => openTagEditor(track)}
													className="w-8 h-8 rounded-full bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center"
													title="Edit Tag ID3"
												>
													<Edit2 className="w-3.5 h-3.5 text-neutral-400" />
												</button>

												{track.id.startsWith("local-") && (
													<button
														onClick={() => deleteTrack(track.id)}
														className="w-8 h-8 rounded-full bg-neutral-900/60 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/30 flex items-center justify-center group"
													>
														<Trash2 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400" />
													</button>
												)}
											</div>
										</motion.div>
									);
								})}
							</motion.div>
						)}
					</div>
				</>
			)}

			{subTab === "folders" && (
				<div className="space-y-4">
					{currentFolder ? (
						<div>
							{/* Folder Breadcrumb */}
							<div className="flex items-center gap-2 mb-4">
								<button
									onClick={() => setCurrentFolder(null)}
									className={`text-xs font-mono ${accentText} hover:text-white bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md`}
								>
									{getTranslation(lang, "backToFolders")}
								</button>
								<span className="text-xs text-neutral-400 font-mono">
									/{" "}
									{currentFolder === "Synthesizers"
										? lang === "bn"
											? "সিন্থেসাইজার"
											: "Synthesizers"
										: lang === "bn"
											? "ইম্পোর্ট সমূহ"
											: "Imports"}
								</span>
							</div>

							<div className="space-y-2">
								{(currentFolder === "Synthesizers"
									? foldersList["Synthesizers"]
									: foldersList["Imported Audio"]
								).map((track) => {
									const isActive = currentTrack?.id === track.id;
									return (
										<div
											key={track.id}
											onClick={() => playTrack(track)}
											className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
												isActive
													? `${accentBg}/20 border-${accentColor}/50`
													: "bg-neutral-950/80 border-neutral-900 hover:bg-neutral-900"
											}`}
										>
											<div className="flex items-center gap-3 overflow-hidden">
												<div
													className="w-9 h-9 rounded-lg shrink-0 border border-neutral-800"
													style={{ background: track.artwork }}
												/>
												<div className="flex flex-col text-left overflow-hidden">
													<span
														className={`text-[12px] font-bold ${isActive ? accentText : "text-white"}`}
													>
														{lang === "bn" && track.bengaliTitle
															? track.bengaliTitle
															: track.title}
													</span>
													<span className="text-[10px] text-neutral-400 font-mono">
														{lang === "bn" && track.bengaliArtist
															? track.bengaliArtist
															: track.artist}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3">
							{/* Folder 1: Built-ins */}
							<div
								onClick={() => setCurrentFolder("Synthesizers")}
								className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/80 hover:bg-neutral-900 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 squircle bg-indigo-950 border border-indigo-900/30 flex items-center justify-center neural-shadow">
										<Folder className="w-6 h-6 text-indigo-400" />
									</div>
									<div className="flex flex-col text-left">
										<span className="text-sm font-black text-white uppercase tracking-tight">
											{getTranslation(lang, "synthesizersTitle")}
										</span>
										<span className="text-[10px] text-neutral-500 font-mono">
											/system/acoustic/preloads
										</span>
									</div>
								</div>
								<span className="text-xs font-mono text-neutral-500 font-semibold">
									{lang === "bn"
										? `${foldersList["Synthesizers"].length}টি ফাইল`
										: `${foldersList["Synthesizers"].length} files`}
								</span>
							</div>

							{/* Folder 2: Offline Imports */}
							<div
								onClick={() => setCurrentFolder("Imported Audio")}
								className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/80 hover:bg-neutral-900 cursor-pointer flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 squircle bg-teal-950 border border-teal-900/30 flex items-center justify-center neural-shadow">
										<Folder className="w-6 h-6 text-teal-400" />
									</div>
									<div className="flex flex-col text-left">
										<span className="text-sm font-black text-white uppercase tracking-tight">
											{getTranslation(lang, "importedDownloadsTitle")}
										</span>
										<span className="text-[10px] text-neutral-500 font-mono">
											/local/indexeddb/caching
										</span>
									</div>
								</div>
								<span className="text-xs font-mono text-neutral-500 font-semibold">
									{lang === "bn"
										? `${foldersList["Imported Audio"].length}টি ফাইল`
										: `${foldersList["Imported Audio"].length} files`}
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{subTab === "vault" && (
				<div className="space-y-4">
					<AnimatePresence>
						{isFaceScanning && (
							<PinUnlock
								accent={accent}
								onUnlock={async (pin) => {
									const enteredPinHash = await hashPIN(pin);
									const requiredPinHash = settings.privateFolderPin || null;
									if (
										enteredPinHash === requiredPinHash ||
										(!requiredPinHash && pin === "1234")
									) {
										setPrivateFolderUnlocked(true);
										setIsFaceScanning(false);
									}
								}}
								onCancel={() => setIsFaceScanning(false)}
							/>
						)}
					</AnimatePresence>

					{!privateFolderUnlocked ? (
						/* Native-inspired Apple Face ID Lock Screen */
						<div className="p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/80 flex flex-col items-center justify-center text-center max-w-sm mx-auto shadow-2xl neural-shadow">
							<div className="mb-6 text-neutral-400 animate-pulse">
								<svg
									viewBox="0 0 100 100"
									className={`w-16 h-16 ${accentText}`}
								>
									<path
										d="M 20 32 L 20 20 L 32 20"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
									/>
									<path
										d="M 68 20 L 80 20 L 80 32"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
									/>
									<path
										d="M 80 68 L 80 80 L 68 80"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
									/>
									<path
										d="M 32 80 L 20 80 L 20 68"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
									/>
									<path
										d="M 35 41 L 41 41"
										fill="none"
										stroke="currentColor"
										strokeWidth="4"
										strokeLinecap="round"
									/>
									<path
										d="M 59 41 L 65 41"
										fill="none"
										stroke="currentColor"
										strokeWidth="4"
										strokeLinecap="round"
									/>
									<path
										d="M 50 36 L 50 56 L 43 56"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M 38 67 Q 50 78 62 67"
										fill="none"
										stroke="currentColor"
										strokeWidth="3.5"
										strokeLinecap="round"
									/>
								</svg>
							</div>

							<h3 className="text-base font-black text-white mb-2 uppercase tracking-tight">
								{lang === "bn" ? "ভল্টটি লক করা আছে" : "Private Vault is Locked"}
							</h3>
							<p className="text-[10px] text-neutral-500 font-mono mb-6 leading-normal uppercase tracking-wider">
								{lang === "bn"
									? "ভল্ট খুলতে ফেস আইডি ভেরিফিকেশন প্রয়োজন"
									: "Requires Face ID verification to enter"}
							</p>

							<button
								onClick={() => setIsFaceScanning(true)}
								className={`w-full py-3.5 rounded-2xl ${accentBg} hover:opacity-90 text-white font-black text-xs uppercase shadow-lg ${getAccentShadowClass(accent)} active:scale-95 transition-all flex items-center justify-center gap-2`}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									className="w-4 h-4"
								>
									<path d="M3 7V5a2 2 0 0 1 2-2h2" />
									<path d="M17 3h2a2 2 0 0 1 2 2v2" />
									<path d="M21 17v2a2 2 0 0 1-2 2h-2" />
									<path d="M7 21H5a2 2 0 0 1-2-2v-2" />
									<path d="M8 14s1.5 2 4 2 4-2 4-2" />
									<line x1="9" y1="9" x2="9.01" y2="9" />
									<line x1="15" y1="9" x2="15.01" y2="9" />
								</svg>
								{lang === "bn" ? "ফেস আইডি স্ক্যান করুন" : "Scan Face ID"}
							</button>
						</div>
					) : (
						/* Unlocked Private view */
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 rounded-xl bg-green-950/15 border border-green-900/30 text-emerald-400">
								<div className="flex items-center gap-2">
									<Unlock className="w-4 h-4" />
									<span className="text-xs font-bold leading-none">
										Vault Active & Decrypted
									</span>
								</div>
								<button
									onClick={() => setPrivateFolderUnlocked(false)}
									className="text-[10px] font-mono bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 px-2.5 py-1 rounded-md text-neutral-200"
								>
									{getTranslation(lang, "lockFolder")}
								</button>
							</div>

							{privateTracks.length === 0 ? (
								<div className="p-8 text-center border border-dashed border-neutral-900 rounded-xl">
									<ShieldAlert className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
									<p className="text-xs text-neutral-400 font-mono">
										{getTranslation(lang, "emptyVault")}
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{privateTracks.map((track) => (
										<div
											key={`vault-${track.id}`}
											className="p-2.5 rounded-xl border border-neutral-900 bg-neutral-950 flex items-center justify-between"
										>
											<div
												onClick={() => playTrack(track)}
												className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
											>
												<div
													className="w-10 h-10 rounded-lg shrink-0 border border-neutral-800"
													style={{ background: track.artwork }}
												/>
												<div className="flex flex-col text-left overflow-hidden">
													<span className="text-xs font-bold text-white truncate">
														{track.title}
													</span>
													<span className="text-[10px] text-neutral-500 font-mono truncate">
														{track.artist}
													</span>
												</div>
											</div>

											<button
												onClick={() => {
													const updated = { ...track, isPrivate: false };
													updateTrackTags(updated);
												}}
												className="px-2.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-sans font-bold text-neutral-200"
											>
												Move to Public
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* ID3 Tag Editor Modal */}
			{editingTrack && (
				<div className="absolute inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/85 backdrop-blur-sm"
						onClick={() => setEditingTrack(null)}
					/>

					<div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl flex flex-col gap-4 text-left">
						<div className="flex items-center justify-between border-b border-neutral-900 pb-3">
							<span className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
								<Edit2 className="w-3.5 h-3.5" />
								{getTranslation(lang, "tagEditor")}
							</span>
							<button
								onClick={() => setEditingTrack(null)}
								className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center"
							>
								<X className="w-3.5 h-3.5 text-neutral-400" />
							</button>
						</div>

						<div className="space-y-3">
							{/* Title input */}
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-semibold text-neutral-400 uppercase font-mono">
									{getTranslation(lang, "titleLabel")}
								</label>
								<input
									type="text"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									className={`w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-${accentColor}`}
								/>
							</div>

							{/* Artist input */}
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-semibold text-neutral-400 uppercase font-mono">
									{getTranslation(lang, "artistLabel")}
								</label>
								<input
									type="text"
									value={editArtist}
									onChange={(e) => setEditArtist(e.target.value)}
									className={`w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-${accentColor}`}
								/>
							</div>

							{/* Album input */}
							<div className="flex flex-col gap-1">
								<label className="text-[10px] font-semibold text-neutral-400 uppercase font-mono">
									{getTranslation(lang, "albumLabel")}
								</label>
								<input
									type="text"
									value={editAlbum}
									onChange={(e) => setEditAlbum(e.target.value)}
									className={`w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-${accentColor}`}
								/>
							</div>

							{/* Category selector */}
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-neutral-400 uppercase font-mono">
										{getTranslation(lang, "genreLabel")}
									</label>
									<input
										type="text"
										value={editGenre}
										onChange={(e) => setEditGenre(e.target.value)}
										className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-semibold text-white focus:outline-none"
									/>
								</div>

								<div className="flex flex-col gap-1">
									<label className="text-[10px] font-semibold text-neutral-400 uppercase font-mono">
										Mood Analysis
									</label>
									<select
										value={editMood}
										onChange={(e) => setEditMood(e.target.value as any)}
										className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs font-semibold text-white focus:outline-none"
									>
										<option value="Happy">Happy</option>
										<option value="Chill">Chill</option>
										<option value="Focus">Focus</option>
										<option value="Sad">Sad</option>
										<option value="Energy">Energy</option>
									</select>
								</div>
							</div>

							{/* Privacy toggle option */}
							<div className="pt-2 flex items-center justify-between border-t border-neutral-900">
								<div className="flex items-center gap-2">
									<Shield className={`w-4 h-4 ${accentText}`} />
									<div className="flex flex-col text-left">
										<span className="text-[11px] font-semibold text-white">
											{getTranslation(lang, "hideInPrivateVault")}
										</span>
										<span className="text-[9px] text-neutral-500">
											{getTranslation(lang, "pinVerificationRequired")}
										</span>
									</div>
								</div>

								<button
									type="button"
									onClick={() => setEditPrivate(!editPrivate)}
									className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${
										editPrivate ? accentBg : "bg-neutral-800"
									}`}
								>
									<div
										className={`h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
											editPrivate ? "translate-x-[24px]" : "translate-x-0"
										}`}
									/>
								</button>
							</div>
						</div>

						<button
							onClick={handleSaveTags}
							className={`mt-2 w-full py-2.5 rounded-lg ${accentBg} hover:opacity-90 text-white font-bold text-xs font-sans uppercase shadow-md shadow-${accentColor}/20`}
						>
							{getTranslation(lang, "saveTags")}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
export default LibraryView;
