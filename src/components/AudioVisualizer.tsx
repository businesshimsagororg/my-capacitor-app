import { Activity } from "lucide-react";
import { useSpring } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useMusic } from "../context/MusicContext";
import { audioEngine } from "../utils/audioEngine";
import {
	getAccentBgClass,
	getAccentColor,
	getAccentHex,
	getAccentRGB,
	getAccentTextClass,
} from "../utils/themeUtils";

interface AudioVisualizerProps {
	height?: number;
	className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
	height = 120,
	className = "",
}) => {
	const { isPlaying, settings } = useMusic();
	const settingsRef = useRef(settings);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationRef = useRef<number | null>(null);
	const [visMode, setVisMode] = useState<"bars" | "circle" | "wave" | "pulse">(
		"bars",
	);
	const visModeRef = useRef(visMode);
	const prevVisModeRef = useRef(visMode);

	// Spring animation for mode switching
	const transitionProgress = useSpring(1, { stiffness: 100, damping: 30 });

	useEffect(() => {
		settingsRef.current = settings;
	}, [settings]);

	const accent = settings.themeAccent;
	const accentHex = getAccentHex(accent);
	const accentText = getAccentTextClass(accent);
	const accentBg = getAccentBgClass(accent);
	const accentRGB = getAccentRGB(accent);
	const accentColor = getAccentColor(accent);

	useEffect(() => {
		visModeRef.current = visMode;
	}, [visMode]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Fluid resize observer binding to ensure accurate scaling
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				canvas.width = entry.contentRect.width * window.devicePixelRatio;
				canvas.height = entry.contentRect.height * window.devicePixelRatio;
				ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			}
		});

		if (canvas.parentElement) {
			resizeObserver.observe(canvas.parentElement);
		}

		const bufferLength = audioEngine.analyserNode
			? audioEngine.analyserNode.frequencyBinCount
			: 128;
		const dataArray = new Uint8Array(bufferLength);

		let offset = 0;

		const draw = () => {
			animationRef.current = requestAnimationFrame(draw);

			const w = canvas.width / window.devicePixelRatio;
			const h = canvas.height / window.devicePixelRatio;

			// Ensure canvas is blanked with pure pitch black background
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, w, h);

			// Get real audio frequencies or mock calm frequencies if not playing
			if (isPlaying && audioEngine.analyserNode) {
				audioEngine.analyserNode.getByteFrequencyData(dataArray);
			} else {
				// Mock peaceful wave sequence when player is resting
				for (let i = 0; i < bufferLength; i++) {
					const sine = Math.sin(i * 0.1 + offset);
					dataArray[i] = (sine + 1) * 35 * Math.sin(offset * 0.5 + i * 0.05);
				}
				offset += 0.04;
			}

			// Apply fade-in transition
			const progress = transitionProgress.get();
			ctx.globalAlpha = progress;

			const currentMode = visModeRef.current;
			const _prevMode = prevVisModeRef.current;

			// We only render one mode for now for simplicity,
			// the spring animation can be used to fade between them if we were rendering both.
			// Given simple canvas drawing, full blending is complex, let's start with just not resetting.

			if (currentMode === "bars") {
				const barWidth = (w / bufferLength) * 1.8;
				let barHeight;
				let x = 0;

				for (let i = 0; i < bufferLength; i++) {
					barHeight =
						(dataArray[i] / 255) * h * 0.85 * settingsRef.current.volume;

					// Glowing premium electric accent gradients
					const gradient = ctx.createLinearGradient(x, h, x, h - barHeight);
					gradient.addColorStop(0, "#1e1b4b"); // Very deep purple
					gradient.addColorStop(0.5, accentHex);
					gradient.addColorStop(
						1,
						accentHex === "#f0f0f0" ? "#ffffff" : "#00f2fe",
					);

					ctx.fillStyle = gradient;
					ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);

					x += barWidth;
				}
			} else if (currentMode === "circle") {
				// Draw orbital sonic tunnel
				const centerX = w / 2;
				const centerY = h / 2;
				const baseRadius = Math.min(w, h) * 0.22;

				ctx.beginPath();
				ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
				ctx.strokeStyle = `rgba(${accentRGB}, 0.15)`;
				ctx.lineWidth = 1;
				ctx.stroke();

				const dotsCount = Math.min(bufferLength, 64);
				for (let i = 0; i < dotsCount; i++) {
					const angle = (i / dotsCount) * Math.PI * 2;
					const amplitude =
						(dataArray[i] / 255) * 45 * settingsRef.current.volume;
					const radius = baseRadius + amplitude;

					const x = centerX + Math.cos(angle) * radius;
					const y = centerY + Math.sin(angle) * radius;

					ctx.beginPath();
					ctx.arc(x, y, 2.5, 0, Math.PI * 2);
					ctx.fillStyle =
						i % 2 === 0
							? accentHex === "#f0f0f0"
								? "#ffffff"
								: "#00f2fe"
							: accentHex;
					ctx.shadowBlur = 8;
					ctx.shadowColor = accentHex;
					ctx.fill();
					ctx.shadowBlur = 0; // reset
				}

				// Draw pulsing core ring
				const avgAmplitude =
					Array.from(dataArray)
						.slice(0, 30)
						.reduce((a, b) => a + b, 0) / 30;
				const pulseFactor =
					1 + (avgAmplitude / 255) * 0.15 * settingsRef.current.volume;
				ctx.beginPath();
				ctx.arc(centerX, centerY, baseRadius * pulseFactor, 0, Math.PI * 2);
				ctx.strokeStyle = accentHex;
				ctx.lineWidth = 2.5;
				ctx.stroke();
			} else if (currentMode === "wave") {
				// Dynamic oscilloscope line
				ctx.beginPath();
				ctx.lineWidth = 3;
				ctx.strokeStyle = accentHex === "#f0f0f0" ? "#ffffff" : "#00f2fe";
				ctx.shadowBlur = 12;
				ctx.shadowColor = `rgba(${accentRGB}, 0.61)`;

				const sliceWidth = w / bufferLength;
				let x = 0;

				for (let i = 0; i < bufferLength; i++) {
					const v = (dataArray[i] / 128.0 - 1) * settingsRef.current.volume + 1;
					const y = (v * h) / 2.3;

					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}

					x += sliceWidth;
				}

				ctx.lineTo(w, h / 2);
				ctx.stroke();
				ctx.shadowBlur = 0; // reset
			} else if (currentMode === "pulse") {
				// Central bass pulse
				const centerX = w / 2;
				const centerY = h / 2;

				// Calculate bass intensity (average of first 15 bins)
				let bassSum = 0;
				for (let i = 0; i < 15; i++) bassSum += dataArray[i];
				const bassIntensity = bassSum / 15 / 255;

				const baseRadius = Math.min(w, h) * 0.15;
				const maxScaling = 2.5 * settingsRef.current.volume;
				const radius = baseRadius * (1 + bassIntensity * maxScaling);

				// Draw glowing pulse circle
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx.fillStyle = accentHex;
				ctx.shadowBlur = 40 * bassIntensity + 10;
				ctx.shadowColor = accentHex;
				ctx.fill();
				ctx.shadowBlur = 0;

				// Center core
				ctx.beginPath();
				ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
				ctx.fillStyle = "#000000";
				ctx.fill();
			}
		};

		draw();

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
			resizeObserver.disconnect();
		};
	}, [isPlaying, transitionProgress.get, accentRGB, accentHex]); // Effect now only depends on isPlaying (canvas init once)

	return (
		<div
			className={`relative rounded-xl border border-neutral-900 overflow-hidden bg-black flex flex-col ${className}`}
		>
			{/* Top Controller Panel */}
			<div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-900 bg-neutral-950/80">
				<span className="text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
					<Activity className={`w-3.5 h-3.5 ${accentText} animate-pulse`} />
					Acoustics Output Analyzer
				</span>

				<div className="flex gap-1">
					{(["bars", "circle", "wave", "pulse"] as const).map((mode) => (
						<button
							key={mode}
							onClick={() => {
								prevVisModeRef.current = visModeRef.current;
								visModeRef.current = mode;
								setVisMode(mode);
								transitionProgress.set(0);
								transitionProgress.set(1);
							}}
							className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded-md transition-all duration-200 ${
								visMode === mode
									? `${accentBg} text-white border border-${accentColor}-400`
									: "bg-neutral-900 text-neutral-400 border border-neutral-950 hover:text-white"
							}`}
						>
							{mode}
						</button>
					))}
				</div>
			</div>

			<div
				className="relative w-full overflow-hidden"
				style={{ height: `${height}px` }}
			>
				<canvas ref={canvasRef} className="w-full h-full block" />
			</div>
		</div>
	);
};
export default AudioVisualizer;
