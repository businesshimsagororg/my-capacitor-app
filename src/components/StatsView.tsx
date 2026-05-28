import {
	BarChart3,
	Clock,
	Flame,
	Music,
	SkipForward,
	TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMemo, useEffect, useRef } from "react";
import { useMusic } from "../context/MusicContext";
import {
	getAccentBg20Class,
	getAccentBgClass,
	getAccentBorder30Class,
	getAccentColor,
	getAccentTextClass,
} from "../utils/themeUtils";

// Lightweight canvas-based Bar Chart replacement
const CanvasBarChart: React.FC<{ data: { name: string; value: number }[]; color: string }> = ({ data, color }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Handle high-DPI displays
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		const width = rect.width;
		const height = rect.height;

		ctx.clearRect(0, 0, width, height);

		if (data.length === 0) return;

		const maxValue = Math.max(...data.map(d => d.value), 1);
		const barWidth = Math.floor((width - (data.length - 1) * 12) / data.length);
		const paddingBottom = 24;
		const chartHeight = height - paddingBottom - 10;

		data.forEach((item, index) => {
			const barHeight = (item.value / maxValue) * chartHeight;
			const x = index * (barWidth + 12);
			const y = height - paddingBottom - barHeight;

			// Draw rounded bar
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.4 + (index / data.length) * 0.6;
			ctx.beginPath();
			ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
			ctx.fill();

			// Draw label
			ctx.globalAlpha = 1.0;
			ctx.fillStyle = "#888888";
			ctx.font = "10px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(item.name, x + barWidth / 2, height - 8, barWidth);
		});
	}, [data, color]);

	return <canvas ref={canvasRef} className="w-full h-full" />;
};

// Lightweight canvas-based Pie/Donut Chart replacement
const CanvasPieChart: React.FC<{ data: { name: string; value: number }[]; color: string }> = ({ data, color }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		const width = rect.width;
		const height = rect.height;
		const centerX = width / 2;
		const centerY = height / 2;
		const outerRadius = Math.min(width, height) / 2 - 10;
		const innerRadius = outerRadius - 20;

		ctx.clearRect(0, 0, width, height);

		if (data.length === 0) return;

		const total = data.reduce((sum, d) => sum + d.value, 0);
		let startAngle = -Math.PI / 2;

		data.forEach((item, index) => {
			const sliceAngle = (item.value / total) * 2 * Math.PI;

			// Draw slice segment
			ctx.fillStyle = color;
			ctx.globalAlpha = 1 - index * 0.15;
			ctx.beginPath();
			ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
			ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
			ctx.closePath();
			ctx.fill();

			// Draw legend / label at center of segment if space permits
			const middleAngle = startAngle + sliceAngle / 2;
			const labelX = centerX + (outerRadius + 14) * Math.cos(middleAngle);
			const labelY = centerY + (outerRadius + 14) * Math.sin(middleAngle);

			ctx.globalAlpha = 1.0;
			ctx.fillStyle = "#aaaaaa";
			ctx.font = "9px sans-serif";
			ctx.textAlign = Math.cos(middleAngle) > 0 ? "left" : "right";
			ctx.textBaseline = "middle";
			ctx.fillText(`${item.name} (${item.value})`, labelX, labelY);

			startAngle += sliceAngle;
		});
	}, [data, color]);

	return <canvas ref={canvasRef} className="w-full h-full" />;
};

export const StatsView: React.FC = () => {
	const { tracks, settings } = useMusic();
	const { language: lang, themeAccent: accent } = settings;

	const accentText = getAccentTextClass(accent);
	const _accentBg = getAccentBgClass(accent);
	const accentColor = getAccentColor(accent);

	// Derived Data
	const stats = useMemo(() => {
		const totalPlays = tracks.reduce((sum, t) => sum + (t.playCount || 0), 0);
		const totalSkips = tracks.reduce((sum, t) => sum + (t.skipCount || 0), 0);
		const totalDurationMinutes = tracks.reduce(
			(sum, t) => sum + (t.playCount || 0) * (t.duration / 60),
			0,
		);

		// Group by genre
		const genreMap: Record<string, number> = {};
		tracks.forEach((t) => {
			if (t.playCount > 0) {
				genreMap[t.genre] = (genreMap[t.genre] || 0) + t.playCount;
			}
		});
		const genreData = Object.entries(genreMap)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);

		// Group by mood
		const moodMap: Record<string, number> = {};
		tracks.forEach((t) => {
			if (t.playCount > 0) {
				moodMap[t.mood] = (moodMap[t.mood] || 0) + t.playCount;
			}
		});
		const moodData = Object.entries(moodMap)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);

		// Top Tracks
		const topTracks = [...tracks]
			.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
			.slice(0, 5);

		return {
			totalPlays,
			totalSkips,
			totalDurationMinutes,
			genreData,
			moodData,
			topTracks,
		};
	}, [tracks]);

	return (
		<div className="flex-1 overflow-y-auto pb-32 pt-6 px-6 custom-scrollbar">
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
					{lang === "bn" ? "আপনার পরিসংখ্যান" : "Your Statistics"}
				</h1>
				<p className="text-neutral-500 text-sm">
					{lang === "bn"
						? "আপনার শোনার অভ্যাসের বিস্তৃত বিবরণ"
						: "Insights into your listening habits and patterns."}
				</p>
			</header>

			{/* Highlight Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<StatCard
					icon={<Clock className={`w-5 h-5 ${accentText}`} />}
					value={`${Math.round(stats.totalDurationMinutes)}m`}
					label={lang === "bn" ? "মোট সময় (মিনিট)" : "Total Time (m)"}
					accent={accent}
				/>
				<StatCard
					icon={<TrendingUp className={`w-5 h-5 ${accentText}`} />}
					value={stats.totalPlays.toString()}
					label={lang === "bn" ? "মোট প্লে" : "Total Plays"}
					accent={accent}
				/>
				<StatCard
					icon={<SkipForward className={`w-5 h-5 ${accentText}`} />}
					value={stats.totalSkips.toString()}
					label={lang === "bn" ? "মোট স্কিপ" : "Total Skips"}
					accent={accent}
				/>
				<StatCard
					icon={<Flame className={`w-5 h-5 ${accentText}`} />}
					value="7" // Mocking for now, could be derived from indexedDB history dates
					label={lang === "bn" ? "স্ট্রিক (দিন)" : "Daily Streak"}
					accent={accent}
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{/* Volume/Activity Chart (Simplified as Genre Distribution) */}
				<div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 neural-shadow h-80 flex flex-col">
					<div className="flex items-center gap-2 mb-6">
						<BarChart3 className={`w-4 h-4 ${accentText}`} />
						<span className="text-xs font-bold text-white uppercase tracking-wider">
							{lang === "bn" ? "জনরা ডিস্ট্রিবিউশন" : "Genre Distribution"}
						</span>
					</div>
					<div className="flex-1 w-full min-h-0">
						{stats.genreData.length > 0 ? (
							<CanvasBarChart data={stats.genreData} color={accentColor} />
						) : (
							<div className="flex items-center justify-center h-full text-neutral-600 text-xs">
								{lang === "bn" ? "কোন ডেটা নেই" : "No data available"}
							</div>
						)}
					</div>
				</div>

				{/* Mood Distribution */}
				<div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 neural-shadow h-80 flex flex-col">
					<div className="flex items-center gap-2 mb-6">
						<Music className={`w-4 h-4 ${accentText}`} />
						<span className="text-xs font-bold text-white uppercase tracking-wider">
							{lang === "bn" ? "মুড অ্যানালাইসিস" : "Mood Analysis"}
						</span>
					</div>
					<div className="flex-1 w-full min-h-0">
						{stats.moodData.length > 0 ? (
							<CanvasPieChart data={stats.moodData} color={accentColor} />
						) : (
							<div className="flex items-center justify-center h-full text-neutral-600 text-xs">
								{lang === "bn" ? "কোন ডেটা নেই" : "No data available"}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Top Tracks */}
			<section className="mb-8">
				<div className="flex items-center gap-2 mb-4">
					<TrendingUp className={`w-4 h-4 ${accentText}`} />
					<h3 className="text-sm font-bold text-white uppercase tracking-wider">
						{lang === "bn" ? "অধিক বার শোনা গান" : "Most Played Tracks"}
					</h3>
				</div>
				<div className="space-y-3">
					{stats.topTracks.map((track, idx) => (
						<motion.div
							key={track.id}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: idx * 0.1 }}
							className="group p-3 rounded-xl bg-neutral-950 border border-neutral-900 flex items-center gap-4 hover:border-neutral-800 transition-colors"
						>
							<div className="w-10 h-10 squircle overflow-hidden shrink-0">
								<img
									src={track.artwork}
									alt={track.title}
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="text-xs font-bold text-white truncate">
									{lang === "bn" && track.bengaliTitle
										? track.bengaliTitle
										: track.title}
								</h4>
								<p className="text-[10px] text-neutral-500 truncate">
									{lang === "bn" && track.bengaliArtist
										? track.bengaliArtist
										: track.artist}
								</p>
							</div>
							<div className="text-right">
								<div className={`text-xs font-mono font-bold ${accentText}`}>
									{track.playCount} {lang === "bn" ? "প্লে" : "plays"}
								</div>
								<div className="text-[10px] text-neutral-600 font-mono">
									{Math.round(track.playCount * (track.duration / 60))}m
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</section>
		</div>
	);
};

import type { ThemeAccent } from "../types";

const StatCard: React.FC<{
	icon: React.ReactNode;
	value: string;
	label: string;
	accent: ThemeAccent;
}> = ({ icon, value, label, accent }) => (
	<div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 neural-shadow flex flex-col justify-between">
		<div
			className={`w-10 h-10 squircle ${getAccentBg20Class(accent)} border ${getAccentBorder30Class(accent)} flex items-center justify-center mb-3`}
		>
			{icon}
		</div>
		<div>
			<div className="text-xl font-bold text-white mb-0.5">{value}</div>
			<div className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight">
				{label}
			</div>
		</div>
	</div>
);

export default StatsView;
