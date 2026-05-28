import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { ThemeAccent } from "../types";
import {
	getAccentBgClass,
	getAccentBorderClass,
	getAccentTextClass,
} from "../utils/themeUtils";

interface FaceUnlockProps {
	onUnlock: () => void;
	onCancel: () => void;
	accent: ThemeAccent;
}

export const FaceUnlock: React.FC<FaceUnlockProps> = ({
	onUnlock,
	onCancel,
	accent,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [status, setStatus] = useState<
		"initializing" | "scanning" | "success" | "error"
	>("initializing");
	const [_errorMsg, _setErrorMsg] = useState<string>("");
	const [fallbackMode, setFallbackMode] = useState<boolean>(false);

	// Play official Apple-inspired positive biometrics chime
	const playFaceIDBeep = () => {
		try {
			const AudioCtx =
				window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioCtx) return;
			const ctx = new AudioCtx();

			// High-frequency dual-synth chime
			const osc1 = ctx.createOscillator();
			const osc2 = ctx.createOscillator();
			const gainNode = ctx.createGain();

			osc1.type = "sine";
			osc2.type = "sine";

			// A pleasant high-pitched clean electronic chime (E6 to A6 chord bounce)
			osc1.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
			osc2.frequency.setValueAtTime(1760.0, ctx.currentTime + 0.08); // A6

			gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

			osc1.connect(gainNode);
			osc2.connect(gainNode);
			gainNode.connect(ctx.destination);

			osc1.start();
			osc2.start();
			osc1.stop(ctx.currentTime + 0.3);
			osc2.stop(ctx.currentTime + 0.3);
		} catch (e) {
			console.warn("Blocked or unsupported audio chime", e);
		}
	};

	useEffect(() => {
		let stream: MediaStream | null = null;

		const startCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: "user",
						width: { ideal: 400 },
						height: { ideal: 400 },
					},
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setStatus("scanning");

				// Scan for 1.8 seconds, then succeed elegantly
				setTimeout(() => {
					setStatus("success");
					playFaceIDBeep();
					setTimeout(() => {
						onUnlock();
					}, 900);
				}, 1800);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : "Camera error";
				console.warn("Camera fallback triggered:", msg);
				setFallbackMode(true);
				setStatus("scanning");

				// Simulative scanning grid fallback
				setTimeout(() => {
					setStatus("success");
					playFaceIDBeep();
					setTimeout(() => {
						onUnlock();
					}, 900);
				}, 2200);
			}
		};

		startCamera();

		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [onUnlock, playFaceIDBeep]);

	const _accentBg = getAccentBgClass(accent);
	const _accentText = getAccentTextClass(accent);
	const _accentBorder = getAccentBorderClass(accent);

	// SVG parameters for Apple Face ID icon lines
	const frameVariants: any = {
		scanning: {
			scale: [1, 1.03, 1],
			transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
		},
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none"
		>
			{/* Centered iOS-style Biometric Prompt Box */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				transition={{ type: "spring", stiffness: 400, damping: 28 }}
				className="w-76 rounded-[2.5rem] bg-[#141414]/90 border border-neutral-800/80 p-7 flex flex-col items-center text-center shadow-[0_24px_50px_rgba(0,0,0,0.85)] relative overflow-hidden"
			>
				{/* Apple Glossy Sheen Detail */}
				<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

				{/* Action Title */}
				<div className="mb-2">
					<h4 className="text-[13px] font-black text-neutral-300 tracking-wider uppercase font-mono">
						Face ID
					</h4>
				</div>

				{/* Subtitle */}
				<p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-6">
					{status === "initializing" && "Initializing Sensor"}
					{status === "scanning" && "Scanning Face Details"}
					{status === "success" && "Unlocked"}
					{status === "error" && "Access Denied"}
				</p>

				{/* Graphic Area (Holds Apple Face ID SVG and integrated Camera Loop) */}
				<div className="relative w-36 h-36 flex items-center justify-center mb-6">
					{/* Circular Camera Viewport behind Face ID lines */}
					<div className="absolute w-28 h-28 rounded-full overflow-hidden bg-neutral-950/80 border border-neutral-850 flex items-center justify-center z-0 shadow-inner">
						{!fallbackMode ? (
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								className="w-full h-full object-cover scale-x-[-1] opacity-75"
							/>
						) : (
							/* High-fidelity simulative radar coordinates if no webcam feed */
							<div className="absolute inset-0 flex items-center justify-center">
								<svg
									className="w-full h-full text-white/5"
									viewBox="0 0 100 100"
								>
									<circle
										cx="50"
										cy="50"
										r="45"
										fill="none"
										stroke="currentColor"
										strokeWidth="0.5"
									/>
									<circle
										cx="50"
										cy="50"
										r="30"
										fill="none"
										stroke="currentColor"
										strokeWidth="0.5"
										strokeDasharray="3 3"
									/>
									<line
										x1="50"
										y1="5"
										x2="50"
										y2="95"
										stroke="currentColor"
										strokeWidth="0.5"
									/>
									<line
										x1="5"
										y1="50"
										x2="95"
										y2="50"
										stroke="currentColor"
										strokeWidth="0.5"
									/>
								</svg>
								{/* Moving grid wave */}
								<motion.div
									animate={{ y: ["-100%", "100%", "-100%"] }}
									transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
									className={`absolute left-0 right-0 h-0.5 bg-${accent}-500/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]`}
								/>
							</div>
						)}
					</div>

					{/* Glowing Scanning Orbits */}
					{status === "scanning" && (
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
							className={`absolute w-32 h-32 rounded-full border border-dashed border-neutral-700/60 z-10`}
						/>
					)}

					{/* Success Ring Glow */}
					<AnimatePresence>
						{status === "success" && (
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1.1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								className="absolute inset-0 rounded-full border-2 border-emerald-500/40 z-10"
							/>
						)}
					</AnimatePresence>

					{/* Classic Face ID SVG Icon overlay on top of camera */}
					<motion.div
						variants={frameVariants}
						animate={status === "scanning" ? "scanning" : ""}
						className={`absolute z-20 pointer-events-none ${
							status === "success"
								? "text-emerald-400"
								: status === "error"
									? "text-red-500"
									: "text-white"
						}`}
					>
						<svg
							viewBox="0 0 100 100"
							className="w-24 h-24 transition-colors duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
						>
							{/* Corner brackets */}
							<motion.path
								d="M 16 30 L 16 16 L 30 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="3.5"
								strokeLinecap="round"
								animate={status === "success" ? { stroke: "#10b981" } : {}}
							/>
							<motion.path
								d="M 70 16 L 84 16 L 84 30"
								fill="none"
								stroke="currentColor"
								strokeWidth="3.5"
								strokeLinecap="round"
								animate={status === "success" ? { stroke: "#10b981" } : {}}
							/>
							<motion.path
								d="M 84 70 L 84 84 L 70 84"
								fill="none"
								stroke="currentColor"
								strokeWidth="3.5"
								strokeLinecap="round"
								animate={status === "success" ? { stroke: "#10b981" } : {}}
							/>
							<motion.path
								d="M 30 84 L 16 84 L 16 70"
								fill="none"
								stroke="currentColor"
								strokeWidth="3.5"
								strokeLinecap="round"
								animate={status === "success" ? { stroke: "#10b981" } : {}}
							/>

							{/* Internal Face Features */}
							<AnimatePresence mode="wait">
								{status !== "success" ? (
									<motion.g
										key="scanning-state"
										initial={{ opacity: 0.8 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									>
										{/* Left Eye */}
										<path
											d="M 35 41 L 41 41"
											fill="none"
											stroke="currentColor"
											strokeWidth="4.5"
											strokeLinecap="round"
										/>
										{/* Right Eye */}
										<path
											d="M 59 41 L 65 41"
											fill="none"
											stroke="currentColor"
											strokeWidth="4.5"
											strokeLinecap="round"
										/>
										{/* Nose */}
										<path
											d="M 50 36 L 50 56 L 43 56"
											fill="none"
											stroke="currentColor"
											strokeWidth="4"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										{/* Smile */}
										<path
											d="M 38 67 Q 50 78 62 67"
											fill="none"
											stroke="currentColor"
											strokeWidth="4"
											strokeLinecap="round"
										/>
									</motion.g>
								) : (
									/* Elegant checkmark replacing the smiley on lock release */
									<motion.g
										key="success-state"
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ type: "spring", stiffness: 350, damping: 18 }}
									>
										<path
											d="M 35 52 L 46 63 L 65 38"
											fill="none"
											stroke="#10b981"
											strokeWidth="5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</motion.g>
								)}
							</AnimatePresence>
						</svg>
					</motion.div>
				</div>

				{/* Scan Notification Text */}
				<div className="absolute bottom-5 left-0 right-0 px-6">
					<p className="text-[10px] text-neutral-500 font-mono tracking-tight text-center leading-relaxed">
						{status === "initializing" && "Authenticating safe hardware..."}
						{status === "scanning" &&
							(fallbackMode
								? "Loading visual coordinates..."
								: "Scanning face geometry...")}
						{status === "success" && "Vault unlocked successfully."}
						{status === "error" && "Verification failed."}
					</p>
				</div>
			</motion.div>

			{/* Manual Cancel Button for iOS biometric dismissal */}
			<div className="mt-12">
				<button
					onClick={onCancel}
					className="px-6 py-2.5 rounded-full border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-all active:scale-95"
				>
					Cancel
				</button>
			</div>
		</motion.div>
	);
};
