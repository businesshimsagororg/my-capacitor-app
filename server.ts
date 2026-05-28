import path from "node:path";
import { PassThrough } from "node:stream";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { createServer as createViteServer } from "vite";
const { YTDlpWrap } = require('yt-dlp-wrap');

const ytDlp = new YTDlpWrap(); // auto-finds yt-dlp in PATH

async function startServer() {
	const app = express();
	const PORT = 3000;

	app.use(cors());
	app.use(express.json());

	// --- Info endpoint ---
	app.get("/api/youtube/info", async (req: Request, res: Response) => {
		const url = req.query.url as string;
		if (!url) return res.status(400).json({ error: "Missing URL" });

		try {
			const metadata = await ytDlp.getVideoInfo(url);
			res.json({
				title: metadata.title,
				author: metadata.uploader || metadata.channel || "Unknown",
				duration: metadata.duration, // already a number (seconds)
				thumbnail: metadata.thumbnail,
			});
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Failed to fetch info";
			console.error("yt-dlp info error:", msg);
			res.status(500).json({ error: msg });
		}
	});

	// --- Download endpoint — streams audio directly to client ---
	app.get("/api/youtube/download", async (req: Request, res: Response) => {
		const url = req.query.url as string;
		if (!url) return res.status(400).json({ error: "Missing URL" });

		// Get info first so we can set Content-Length and filename
		let info: Record<string, unknown>;
		try {
			info = await ytDlp.getVideoInfo(url);
		} catch (_e: unknown) {
			return res.status(500).json({ error: "Failed to fetch video info" });
		}

		const safeTitle = (info.title as string)
			.replace(/[^a-z0-9 \-_]/gi, "")
			.trim()
			.slice(0, 80);

		res.setHeader("Content-Type", "audio/mp4");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${safeTitle}.m4a"`,
		);
		// Note: we can't know exact size without downloading first,
		// so we skip Content-Length and let the client handle it

		const passThrough = new PassThrough();
		passThrough.pipe(res);

		try {
			const stream = ytDlp.execStream([
				url,
				"-f",
				"bestaudio[ext=m4a]/bestaudio/best", // prefer m4a for broad browser support
				"-o",
				"-", // output to stdout
				"--no-playlist", // single video only
				"--quiet",
			]);

			stream.pipe(passThrough);

			stream.on("error", (e) => {
				console.error("yt-dlp stream error:", e.message);
				if (!res.headersSent) {
					res.status(500).json({ error: "Stream failed" });
				} else {
					res.destroy(); // abort partial response so client knows something went wrong
				}
			});

			req.on("close", () => stream.destroy()); // client disconnected — stop downloading
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Stream failed";
			console.error("yt-dlp exec error:", msg);
			if (!res.headersSent) res.status(500).json({ error: msg });
		}
	});

	// Vite or static
	if (process.env.NODE_ENV !== "production") {
		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "spa",
		});
		app.use(vite.middlewares);
	} else {
		const distPath = path.join(process.cwd(), "dist");
		app.use(express.static(distPath));
		app.get("*", (_req: Request, res: Response) =>
			res.sendFile(path.join(distPath, "index.html")),
		);
	}

	app.listen(PORT, "0.0.0.0", () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

startServer();
