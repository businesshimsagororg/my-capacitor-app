import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.zmusic.app",
	appName: "zmusic",
	webDir: "dist",
	ios: {
		allowsInlineMediaPlayback: true,
		backgroundColor: "#000000",
		scheme: "zmusic",
		allowNavigation: ["http://localhost:5173"],
	},
};

export default config;
