import {
	Award,
	Camera,
	Check,
	Combine,
	EyeOff,
	Headphones,
	Languages,
	Palette,
	RefreshCw,
	Sliders,
	Smartphone,
	Timer,
	Upload,
	Volume2,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useMusic } from "../context/MusicContext";
import type { EqualizerPreset, UserSettings } from "../types";
import { audioEngine } from "../utils/audioEngine";
import { getTranslation } from "../utils/bengaliTranslations";
import { resetAppDB } from "../utils/indexedDB";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentBorderClass,
	getAccentHex,
	getAccentRGB,
	getAccentShadowClass,
	getAccentTextClass,
} from "../utils/themeUtils";

export const SettingsView: React.FC = () => {
	const { settings, updateSettings, triggerHaptic, showIsland } = useMusic();

	const iconInputRef = useRef<HTMLInputElement>(null);

	const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Size limit 1MB for app icon to prevent DB bloat
		if (file.size > 1024 * 1024) {
			showIsland("File Too Large", "Icon must be under 1MB", "⚠️");
			return;
		}

		const reader = new FileReader();
		reader.onload = (ev) => {
			const dataUrl = ev.target?.result as string;
			updateSettings({ appIcon: dataUrl });
			showIsland("Icon Updated", "Custom app icon set successfully", "🖼️");
		};
		reader.readAsDataURL(file);
	};

	const lang = settings.language;
	const accent = settings.themeAccent;
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const _accentRGB = getAccentRGB(accent);
	const accentHex = getAccentHex(accent);

	// Track active preset
	const [selectedPresetName, setSelectedPresetName] = useState<string>("Flat");

	// UI states
	const [pinInput, setPinInput] = useState<string>("");
	const [_showPinSaved, setShowPinSaved] = useState<boolean>(false);
	const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

	// EQ Presets Definition
	const eqPresets: EqualizerPreset[] = [
		{ name: "Flat", bengaliName: "স্বাভাবিক", gains: [0, 0, 0, 0, 0] },
		{ name: "Bass Heavy", bengaliName: "বেস হেভি", gains: [9, 5, -2, -1, 3] },
		{
			name: "Vocal Boost",
			bengaliName: "কণ্ঠস্বর বর্ধক",
			gains: [-3, 2, 7, 4, -1],
		},
		{ name: "Pop Hits", bengaliName: "পপ ট্র্যাকস", gains: [4, -1, 2, 5, 8] },
		{ name: "Acoustic Folk", bengaliName: "ফোক সুর", gains: [2, 3, 5, -1, 4] },
	];

	// Manual EQ slider states
	const [sliderGains, setSliderGains] = useState<number[]>([0, 0, 0, 0, 0]);

	const handlePresetSelect = (preset: EqualizerPreset) => {
		triggerHaptic();
		setSelectedPresetName(preset.name);
		setSliderGains(preset.gains);
		audioEngine.setEQPreset(preset.gains);
		showIsland("Equalizer Preset", `Applied: ${preset.name}`, "🏷️");
	};

	const handleSliderChange = (bandIndex: number, dbValue: number) => {
		const nextGains = [...sliderGains];
		nextGains[bandIndex] = dbValue;
		setSliderGains(nextGains);
		setSelectedPresetName("Custom");
		audioEngine.setEQBand(bandIndex, dbValue);
	};

	const _handleSavePin = () => {
		triggerHaptic();
		if (pinInput.length === 4) {
			updateSettings({ privateFolderPin: pinInput });
			setShowPinSaved(true);
			setPinInput("");
			setTimeout(() => setShowPinSaved(false), 2000);
			showIsland("PIN Saved", "Private vault passcode updated.", "✅");
		}
	};

	const _handleLanguageToggle = () => {
		triggerHaptic();
		const nextLang = lang === "en" ? "bn" : "en";
		updateSettings({ language: nextLang });
		const msg =
			nextLang === "bn"
				? "ভাষা সফলভাবে পরিবর্তন হয়েছে"
				: "Language toggled successfully";
		showIsland("Language Changed", msg, "🌐");
	};

	const clearAllAppCache = async () => {
		triggerHaptic();
		await resetAppDB();
		window.location.reload();
	};

	const timerOptions = [
		{ label: "Off", val: null },
		{ label: "10 mins", val: 10 },
		{ label: "20 mins", val: 20 },
		{ label: "45 mins", val: 45 },
		{ label: "60 mins", val: 60 },
	];

	return (
		<div className="flex-1 overflow-y-auto pb-24 text-left px-4">
			{/* Title */}
			<div className="py-4 border-b border-neutral-900 mb-5">
				<h2 className="text-lg font-black text-white tracking-tight">
					{getTranslation(lang, "settings")}
				</h2>
			</div>

			<div className="space-y-6">
				{/* Language Selection Bar */}
				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/85 flex items-center justify-between shadow-sm">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 squircle bg-gradient-to-br from-pink-500/20 to-pink-900/10 border border-pink-500/20 flex items-center justify-center text-pink-400 neural-shadow">
							<Languages className="w-5 h-5" />
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-white">
								{getTranslation(lang, "bilingualToggle")}
							</span>
							<span className="text-[10px] text-neutral-500 font-mono">
								English / বাংলা
							</span>
						</div>
					</div>
					<div className="bg-black/50 border border-neutral-900 rounded-lg p-0.5 flex items-center gap-0.5 shadow-inner">
						<button
							onClick={() => {
								if (lang !== "en") {
									triggerHaptic();
									updateSettings({ language: "en" });
									showIsland(
										"Language Changed",
										"Language toggled to English",
										"🌐",
									);
								}
							}}
							className={`px-3.5 py-1.5 text-[10px] font-sans font-extrabold uppercase rounded-md transition-all cursor-pointer ${
								lang === "en"
									? `${accentBg} text-white shadow-lg ${getAccentShadowClass(accent)}`
									: "text-neutral-500 hover:text-neutral-300"
							}`}
						>
							English
						</button>
						<button
							onClick={() => {
								if (lang !== "bn") {
									triggerHaptic();
									updateSettings({ language: "bn" });
									showIsland(
										"Language Changed",
										"ভাষা সফলভাবে পরিবর্তন হয়েছে",
										"🌐",
									);
								}
							}}
							className={`px-3.5 py-1.5 text-[10px] font-sans font-extrabold uppercase rounded-md transition-all cursor-pointer ${
								lang === "bn"
									? `${accentBg} text-white shadow-lg ${getAccentShadowClass(accent)}`
									: "text-neutral-500 hover:text-neutral-300"
							}`}
						>
							বাংলা
						</button>
					</div>
				</div>

				{/* Branding Customization Section */}
				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/85 flex flex-col gap-4 shadow-sm">
					<div className="flex items-center gap-3">
						<div
							className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} neural-shadow`}
						>
							<Smartphone className="w-5 h-5" />
						</div>
						<div className="flex flex-col text-left">
							<span className="text-xs font-bold text-white">
								{lang === "bn" ? "ব্র্যান্ডিং কাস্টমাইজেশন" : "Brand Customization"}
							</span>
							<span className="text-[10px] text-neutral-500 font-mono">
								Personalize app name & icon
							</span>
						</div>
					</div>

					<div className="space-y-4">
						{/* App Name Input */}
						<div className="space-y-1.5">
							<label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block ml-1">
								{lang === "bn" ? "অ্যাপের নাম" : "App Name"}
							</label>
							<input
								type="text"
								placeholder="E.g. ZMusic"
								value={settings.appName}
								onChange={(e) => updateSettings({ appName: e.target.value })}
								className="w-full px-3 py-2 text-sm font-bold text-white rounded-lg bg-black border border-neutral-900 focus:outline-none focus:border-blue-500 transition-colors"
								maxLength={20}
							/>
						</div>

						{/* App Icon Picker */}
						<div className="space-y-2">
							<label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block ml-1">
								{lang === "bn" ? "অ্যাপ আইকন" : "App Icon"}
							</label>
							<div className="flex gap-2 flex-wrap pb-1">
								{/* Custom Upload Launcher */}
								<button
									onClick={() => {
										triggerHaptic();
										iconInputRef.current?.click();
									}}
									className={`w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 border-2 border-dashed border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:text-white transition-all`}
								>
									<Upload className="w-4 h-4" />
								</button>
								<input
									type="file"
									ref={iconInputRef}
									className="hidden"
									accept="image/*"
									onChange={handleIconUpload}
								/>

								{[
									"🎵",
									"🎧",
									"📻",
									"🎼",
									"🎹",
									"🎸",
									"🥁",
									"🎤",
									"🎬",
									"💎",
									"🔥",
									"⚡",
									"🛸",
									"🛰️",
								].map((emoji) => (
									<button
										key={emoji}
										onClick={() => {
											triggerHaptic();
											updateSettings({ appIcon: emoji });
											showIsland(
												"Icon Updated",
												`App icon set to ${emoji}`,
												emoji,
											);
										}}
										className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${
											settings.appIcon === emoji
												? `border-white bg-white/10 scale-110 shadow-lg`
												: "border-neutral-900 bg-neutral-950 hover:border-neutral-700"
										}`}
									>
										{emoji}
									</button>
								))}

								{/* Custom Image Icon Preview if set */}
								{settings.appIcon?.startsWith("data:") && (
									<div className="w-9 h-9 rounded-lg border-2 border-white bg-white/10 scale-110 shadow-lg overflow-hidden relative group">
										<img
											src={settings.appIcon}
											alt="Custom Icon"
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
											<Check className="w-3 h-3 text-white" />
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Theme Accent Section */}
				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/85 flex flex-col gap-3 shadow-sm">
					<div className="flex items-center gap-3">
						<div
							className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} neural-shadow`}
						>
							<Palette className="w-5 h-5" />
						</div>
						<div className="flex flex-col text-left">
							<span className="text-xs font-bold text-white">
								{lang === "bn" ? "থিম অ্যাকসেন্ট" : "Theme Accent"}
							</span>
							<span className="text-[10px] text-neutral-500 font-mono text-left">
								Customize system visual glow
							</span>
						</div>
					</div>

					<div className="flex justify-between items-center gap-2">
						{(
							[
								"neon-blue",
								"emerald",
								"amber",
								"rose",
								"monochrome",
							] as UserSettings["themeAccent"][]
						).map((t) => (
							<button
								key={t}
								onClick={() => {
									triggerHaptic();
									updateSettings({ themeAccent: t });
									showIsland(
										"Theme Updated",
										`System accent set to ${t}`,
										"🎨",
									);
								}}
								className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
									accent === t
										? `border-white scale-110 shadow-lg`
										: "border-transparent hover:scale-105"
								}`}
								style={{ backgroundColor: getAccentHex(t) }}
							>
								{accent === t && (
									<Check
										className={`w-5 h-5 ${t === "monochrome" ? "text-black" : "text-white"}`}
									/>
								)}
							</button>
						))}
					</div>
				</div>

				{/* Tactile Graphic EQ Dashboard */}
				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/85">
					<div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
						<div className="flex items-center gap-3">
							<div
								className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} neural-shadow`}
							>
								<Sliders className="w-5 h-5" />
							</div>
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang, "equalizer")}
							</span>
						</div>
						<span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
							{selectedPresetName}
						</span>
					</div>

					{/* Preset Buttons Grid */}
					<div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
						{eqPresets.map((preset) => (
							<button
								key={preset.name}
								onClick={() => handlePresetSelect(preset)}
								className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
									selectedPresetName === preset.name
										? `${accentBg} text-white`
										: "bg-neutral-900 text-neutral-400 hover:text-white"
								}`}
							>
								{lang === "bn" ? preset.bengaliName : preset.name}
							</button>
						))}
					</div>

					{/* Equalizer Frequency sliders */}
					<div className="grid grid-cols-5 gap-3 h-44 py-3 border-t border-b border-neutral-900/40 mb-3.5">
						{sliderGains.map((gain, idx) => {
							const bandsFreqs = ["60Hz", "230Hz", "910Hz", "4kHz", "14kHz"];
							return (
								<div
									key={idx}
									className="flex flex-col items-center justify-between h-full"
								>
									<span className="text-[9px] font-mono text-neutral-400 font-semibold">
										{gain > 0 ? `+${gain}` : gain}dB
									</span>

									{/* Vertical input range element */}
									<div className="relative h-28 flex items-center justify-center">
										<input
											type="range"
											min={-12}
											max={12}
											step={1}
											value={gain}
											onChange={(e) =>
												handleSliderChange(idx, parseInt(e.target.value, 10))
											}
											className={`vertical-slider appearance-none bg-neutral-900 border border-neutral-950 h-24 w-1.5 rounded-lg`}
											style={{
												writingMode: "vertical-lr",
												direction: "rtl",
												cursor: "ns-resize",
												accentColor: accentHex,
											}}
										/>
									</div>

									<span className="text-[8px] font-mono font-bold text-neutral-500">
										{bandsFreqs[idx]}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Bass Booster Dial & Space Optimization */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Bass Dial */}
					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<Volume2 className="w-4 h-4 text-emerald-400" />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang, "bassBoost")}
							</span>
						</div>

						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang, "bassBoostDesc")}
						</p>

						<div className="flex items-center gap-4">
							<input
								type="range"
								min={0}
								max={100}
								step={5}
								value={settings.bassBoost}
								onChange={(e) =>
									updateSettings({ bassBoost: parseInt(e.target.value, 10) })
								}
								className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
							/>
							<span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
								{settings.bassBoost}%
							</span>
						</div>
					</div>

					{/* Spatial Headphone toggler */}
					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<Headphones className="w-4 h-4 text-indigo-400 animate-pulse" />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang, "stageWidener")}
							</span>
						</div>
						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang, "bluetoothOpt")}
						</p>

						<div className="flex items-center justify-between">
							<span className="text-[11px] text-neutral-400 font-semibold">
								{getTranslation(lang, "stageWidener")}
							</span>
							<button
								type="button"
								onClick={() =>
									updateSettings({
										optimizationsEnabled: !settings.optimizationsEnabled,
									})
								}
								className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
									settings.optimizationsEnabled
										? "bg-indigo-600"
										: "bg-neutral-800"
								}`}
							>
								<div
									className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 ${
										settings.optimizationsEnabled
											? "translate-x-[22px]"
											: "translate-x-0"
									}`}
								/>
							</button>
						</div>
					</div>

					{/* Crossfade Duration Section */}
					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<Combine className={`w-4 h-4 ${accentText}`} />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang as any, "crossfadeDuration")}
							</span>
						</div>

						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang as any, "crossfadeDesc")}
						</p>

						<div className="flex items-center gap-4">
							<input
								type="range"
								min={0}
								max={12}
								step={1}
								value={settings.crossfadeDuration}
								onChange={(e) =>
									updateSettings({
										crossfadeDuration: parseInt(e.target.value, 10),
									})
								}
								className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
								style={{ accentColor: accentHex }}
							/>
							<span
								className={`text-[11px] font-mono font-bold ${accentText} shrink-0`}
							>
								{settings.crossfadeDuration}s
							</span>
						</div>
					</div>
				</div>

				{/* Intelligent App Core Capabilities */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<Smartphone className="w-4 h-4 text-orange-400" />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang as any, "hapticFeedback")}
							</span>
						</div>
						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang as any, "hapticFeedbackDesc")}
						</p>
						<div className="flex items-center justify-between mt-auto">
							<span className="text-[11px] text-neutral-400 font-semibold">
								{getTranslation(lang as any, "hapticFeedback")}
							</span>
							<button
								type="button"
								onClick={() =>
									updateSettings({
										hapticFeedbackEnabled: !settings.hapticFeedbackEnabled,
									})
								}
								className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
									settings.hapticFeedbackEnabled
										? "bg-orange-600"
										: "bg-neutral-800"
								}`}
							>
								<div
									className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 ${
										settings.hapticFeedbackEnabled
											? "translate-x-[22px]"
											: "translate-x-0"
									}`}
								/>
							</button>
						</div>

						{settings.hapticFeedbackEnabled && (
							<div className="mt-3 flex items-center gap-2">
								<input
									type="range"
									min={0.1}
									max={1.0}
									step={0.1}
									value={settings.hapticIntensity}
									onChange={(e) =>
										updateSettings({
											hapticIntensity: parseFloat(e.target.value),
										})
									}
									className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
								/>
								<span className="text-[10px] font-mono text-neutral-500 min-w-[20px]">
									{Math.round(settings.hapticIntensity * 100)}%
								</span>
							</div>
						)}
					</div>

					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<EyeOff className="w-4 h-4 text-neutral-400" />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang as any, "minimalistMode")}
							</span>
						</div>
						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang as any, "minimalistModeDesc")}
						</p>
						<div className="flex items-center justify-between mt-auto">
							<span className="text-[11px] text-neutral-400 font-semibold">
								{getTranslation(lang as any, "minimalistMode")}
							</span>
							<button
								type="button"
								onClick={() =>
									updateSettings({ minimalistMode: !settings.minimalistMode })
								}
								className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
									settings.minimalistMode ? "bg-neutral-600" : "bg-neutral-800"
								}`}
							>
								<div
									className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 ${
										settings.minimalistMode
											? "translate-x-[22px]"
											: "translate-x-0"
									}`}
								/>
							</button>
						</div>
					</div>

					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left">
						<div className="flex items-center gap-2 mb-2">
							<Sliders className="w-4 h-4 text-blue-400" />
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang as any, "adaptiveAudio")}
							</span>
						</div>
						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang as any, "adaptiveAudioDesc")}
						</p>
						<div className="flex items-center justify-between mt-auto">
							<span className="text-[11px] text-neutral-400 font-semibold">
								{getTranslation(lang as any, "adaptiveAudio")}
							</span>
							<button
								type="button"
								onClick={() =>
									updateSettings({ adaptiveAudio: !settings.adaptiveAudio })
								}
								className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
									settings.adaptiveAudio ? accentBg : "bg-neutral-800"
								}`}
							>
								<div
									className={`h-4.5 w-4.5 rounded-full bg-white transition-transform duration-200 ${
										settings.adaptiveAudio
											? "translate-x-[22px]"
											: "translate-x-0"
									}`}
								/>
							</button>
						</div>
					</div>

					<div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 flex flex-col justify-between text-left md:col-span-2">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
								{getTranslation(lang as any, "zenMode")}
							</span>
						</div>
						<p className="text-[10px] text-neutral-500 leading-normal mb-3">
							{getTranslation(lang as any, "zenModeDesc")}
						</p>
						<div className="flex items-center justify-between mt-auto">
							<span className="text-[11px] text-neutral-400 font-semibold">
								{getTranslation(lang as any, "zenMode")}
							</span>
							<button
								type="button"
								onClick={() => updateSettings({ zenMode: !settings.zenMode })}
								className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
									settings.zenMode ? "bg-white" : "bg-neutral-800"
								}`}
							>
								<div
									className={`h-4.5 w-4.5 rounded-full bg-neutral-900 transition-transform duration-200 ${
										settings.zenMode ? "translate-x-[22px]" : "translate-x-0"
									}`}
								/>
							</button>
						</div>
					</div>
				</div>

				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/80">
					<div className="flex items-center gap-3 mb-3">
						<div
							className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} neural-shadow`}
						>
							<Timer className="w-5 h-5 animate-pulse" />
						</div>
						<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
							{getTranslation(lang, "sleepTimer")}
						</span>
					</div>

					<p className="text-[10px] text-neutral-500 leading-normal mb-4">
						{getTranslation(lang, "sleepTimerDesc")}
					</p>

					<div className="grid grid-cols-5 gap-2">
						{timerOptions.map((opt) => (
							<button
								key={opt.label}
								onClick={() => updateSettings({ sleepTimerDuration: opt.val })}
								className={`py-2 rounded-lg text-[9px] font-sans font-bold border transition-all ${
									settings.sleepTimerDuration === opt.val
										? `${accentBg} ${getAccentBorderClass(accent)} text-white`
										: "bg-black border-neutral-900 text-neutral-400"
								}`}
							>
								{opt.val === null
									? lang === "bn"
										? "বন্ধ"
										: "Off"
									: lang === "bn"
										? `${opt.val} মিনিট`
										: `${opt.val} mins`}
							</button>
						))}
					</div>
				</div>

				{/* Apple Face ID Security Bridge Placeholder */}
				<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/80">
					<div className="flex items-center gap-3 mb-3">
						<div
							className={`w-9 h-9 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center ${accentText} neural-shadow`}
						>
							<Camera className="w-5 h-5" />
						</div>
						<span className="text-xs font-bold text-white uppercase font-mono tracking-tight">
							{lang === "bn" ? "অ্যাপল ফেস আইডি" : "Apple Face ID Security"}
						</span>
					</div>

					<p className="text-[10px] text-neutral-500 leading-normal mb-4 font-mono">
						{lang === "bn"
							? "আপনার ব্যক্তিগত ভল্ট সুরক্ষিত করার জন্য আইওএস নেটিভ বায়োমেট্রিক্স ব্যবহার করুন।"
							: "This UI is a placeholder. Implement `LocalAuthentication` in Xcode (Swift) after export to enable native Face ID for secure vault access."}
					</p>

					<div className="flex flex-col gap-3.5 mb-2">
						<button
							onClick={() => {
								triggerHaptic();
								showIsland(
									"Native Bridge",
									"Implement Face ID in Xcode (Swift) to unlock.",
									"🛡️",
								);
							}}
							className={`w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${accentText}`}
						>
							<Camera className="w-3.5 h-3.5" />
							{lang === "bn"
								? "ফেস আইডি কনফিগার করুন"
								: "Configure Native Face ID"}
						</button>
					</div>
				</div>

				{/* System Reset Option */}
				<div className="p-4 rounded-xl border border-red-900/25 bg-neutral-950/80 flex flex-col gap-4">
					<div className="flex items-center justify-between w-full">
						<div className="flex flex-col text-left">
							<span className="text-xs font-bold text-white">
								{getTranslation(lang, "resetStorageTitle")}
							</span>
							<span className="text-[9px] text-neutral-600 font-mono">
								{getTranslation(lang, "resetStorageDesc")}
							</span>
						</div>

						{!showResetConfirm ? (
							<button
								onClick={() => {
									triggerHaptic();
									setShowResetConfirm(true);
								}}
								className="px-3.5 py-1.5 rounded-lg hover:bg-red-950/40 text-[10px] font-sans font-bold text-red-500 border border-neutral-900 hover:border-red-900/30 flex items-center gap-1 transition-all"
							>
								<RefreshCw className="w-3.5 h-3.5" />
								{getTranslation(lang, "clearCache")}
							</button>
						) : (
							<div className="flex gap-2">
								<button
									onClick={() => setShowResetConfirm(false)}
									className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-400 text-[10px] font-bold"
								>
									Cancel
								</button>
								<button
									onClick={clearAllAppCache}
									className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-bold shadow-lg shadow-red-600/20"
								>
									Confirm Reset
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Cultural Tribute Credits Card */}
				<div className="p-4 rounded-xl border border-neutral-900 bg-gradient-to-br from-neutral-950/40 to-black text-center">
					<Award className="w-6 h-6 text-amber-500 mx-auto mb-2 animate-bounce" />
					<h4 className="text-[11px] font-bold text-neutral-300">
						{getTranslation(lang, "iosNativeWebPlayer")}
					</h4>
					<p className="text-[9px] text-neutral-500 max-w-xs mx-auto mt-1 leading-normal">
						{getTranslation(lang, "acousticPurityDesc")}
					</p>
				</div>
			</div>
		</div>
	);
};
export default SettingsView;
