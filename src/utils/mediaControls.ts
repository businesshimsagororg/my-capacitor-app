import { registerPlugin } from "@capacitor/core";

export interface NowPlayingData {
	title: string;
	artist: string;
	artwork: string;
	duration: number;
	currentTime: number;
}

export interface MediaControlsPluginType {
	updateNowPlaying(data: NowPlayingData): Promise<void>;
	addListener(
		eventName: "remoteCommand",
		listenerFunc: (data: { command: "play" | "pause" | "next" | "prev" }) => void,
	): Promise<any>;
}

const MediaControls = registerPlugin<MediaControlsPluginType>("MediaControls");

export const updateNowPlaying = async (data: NowPlayingData): Promise<void> => {
	try {
		await MediaControls.updateNowPlaying(data);
	} catch (e) {
		console.error("Failed to update Now Playing Info", e);
	}
};

export const onRemoteCommand = (
	callback: (command: "play" | "pause" | "next" | "prev") => void,
) => {
	MediaControls.addListener("remoteCommand", (data) => {
		callback(data.command);
	});
};
