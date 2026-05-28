import { motion } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAudioFrequency } from "../../hooks/useAudioFrequency";
import type { ThemeAccent } from "../../types";
import { audioEngine } from "../../utils/audioEngine";
import { getAccentRGB } from "../../utils/themeUtils";

interface VisualizerProps {
	isPlaying: boolean;
	accent: ThemeAccent;
	onCenterClick?: () => void;
}

export const AestheticAudioVisualizer: React.FC<VisualizerProps> = ({
	isPlaying,
	accent,
	onCenterClick,
}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [tilt, setTilt] = useState<{
		x: number;
		y: number;
		isHovered: boolean;
	}>({ x: 0, y: 0, isHovered: false });

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const el = e.currentTarget;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const centerX = rect.width / 2;
		const centerY = rect.height / 2;
		const rotateY = ((x - centerX) / centerX) * 12;
		const rotateX = -((y - centerY) / centerY) * 12;

		setTilt({ x: rotateX, y: rotateY, isHovered: true });
	};

	const handleMouseLeave = () => {
		setTilt({ x: 0, y: 0, isHovered: false });
	};

	const accentRGB = useMemo(() => getAccentRGB(accent), [accent]);

	useEffect(() => {
		let animId: number;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let width = (canvas.width = 300);
		let height = (canvas.height = 300);

		const resize = () => {
			const parent = canvas.parentElement;
			if (parent) {
				width = canvas.width = parent.clientWidth || 300;
				height = canvas.height = parent.clientHeight || 300;
			}
		};
		resize();
		window.addEventListener("resize", resize);

		const bufferLength = audioEngine.analyserNode
			? audioEngine.analyserNode.frequencyBinCount
			: 128;
		const dataArray = new Uint8Array(bufferLength);

		let phase = 0;

		const render = () => {
			animId = requestAnimationFrame(render);
			ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
			ctx.fillRect(0, 0, width, height);

			const analyser = audioEngine.analyserNode;

			if (analyser && isPlaying) {
				analyser.getByteFrequencyData(dataArray);
				const colorActive = `rgba(${accentRGB}, 0.85)`;
				const center = { x: width / 2, y: height / 2 };

				let _totalFreq = 0;
				for (let i = 0; i < bufferLength; i++) {
					_totalFreq += dataArray[i];
				}

				ctx.shadowBlur = 12;
				ctx.shadowColor = colorActive;
				const wavesCount = 4;
				for (let w = 0; w < wavesCount; w++) {
					ctx.beginPath();
					ctx.strokeStyle =
						w === 0 ? colorActive : `rgba(${accentRGB}, ${0.3 - w * 0.05})`;
					ctx.lineWidth = w === 0 ? 2.5 : 1.5;

					for (let x = 0; x < width; x += 3) {
						const dataIdx = Math.floor((x / width) * bufferLength);
						const value = dataArray[dataIdx] || 0;
						const amp = (value / 255) * 60;
						const y =
							center.y +
							Math.sin(x * 0.015 + phase + w * (Math.PI / 3)) *
								(amp + 15) *
								Math.sin((x / width) * Math.PI);
						if (x === 0) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
					}
					ctx.stroke();
				}
				phase += 0.04;
			} else {
				const center = { x: width / 2, y: height / 2 };
				const colorActive = `rgba(${accentRGB}, 0.3)`;
				ctx.shadowBlur = 0;
				const wavesCount = 4;
				for (let w = 0; w < wavesCount; w++) {
					ctx.beginPath();
					ctx.strokeStyle =
						w === 0 ? colorActive.replace("0.3", "0.6") : colorActive;
					ctx.lineWidth = w === 0 ? 1.8 : 1.0;
					for (let x = 0; x < width; x += 4) {
						const amp = isPlaying ? 30 : 10;
						const freq = 0.01;
						const y =
							center.y +
							Math.sin(x * freq + phase + w * (Math.PI / 4)) *
								amp *
								Math.sin((x / width) * Math.PI);
						if (x === 0) ctx.moveTo(x, y);
						else ctx.lineTo(x, y);
					}
					ctx.stroke();
				}
				phase += isPlaying ? 0.025 : 0.005;
			}
		};

		render();
		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener("resize", resize);
		};
	}, [isPlaying, accentRGB]);

	const frequency = useAudioFrequency(0); // Bass bin

	const baseScale = isPlaying ? 1.02 : 0.95;
	const pulseBoost = isPlaying ? frequency * 0.08 : 0;
	const hoverScale = tilt.isHovered ? 1.06 : baseScale;
	const finalScale = hoverScale + pulseBoost;
	const finalOpacity = isPlaying ? 1.0 : 0.82;

	return (
		<motion.div
			onClick={onCenterClick}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className="w-56 h-56 md:w-64 md:h-64 rounded-2xl flex items-center justify-center relative overflow-hidden bg-black/50 border border-neutral-900 cursor-pointer group hover:border-neutral-800"
			style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
			animate={{
				opacity: finalOpacity,
				scale: finalScale,
				rotateX: tilt.x,
				rotateY: tilt.y,
				boxShadow: tilt.isHovered
					? `0 25px 75px rgba(0,0,0,0.92), 0 0 45px rgba(${accentRGB}, 0.25)`
					: `0 15px 60px rgba(0,0,0,0.85), 0 0 30px rgba(${accentRGB}, 0.12)`,
			}}
			transition={{
				type: "spring",
				stiffness: isPlaying ? 180 : tilt.isHovered ? 450 : 130,
				damping: isPlaying ? 16 : tilt.isHovered ? 22 : 19,
				mass: 0.75,
			}}
		>
			<canvas
				ref={canvasRef}
				className="absolute inset-0 w-full h-full pointer-events-none"
			/>
		</motion.div>
	);
};
