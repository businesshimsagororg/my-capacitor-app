import { useEffect } from "react";
import { useMusic } from "../context/MusicContext";
import { updateNowPlaying, onRemoteCommand } from "../utils/mediaControls";
import { Capacitor } from "@capacitor/core";

export const useLockScreenControls = () => {
	const { currentTrack, isPlaying, currentTime, duration, togglePlay, nextTrack, prevTrack } = useMusic();

	// Update the Lock Screen / Control Center info when track state updates
	useEffect(() => {
		if (!Capacitor.isNativePlatform() || !currentTrack) return;

		updateNowPlaying({
			title: currentTrack.title,
			artist: currentTrack.artist,
			artwork: currentTrack.artwork.startsWith("http") ? currentTrack.artwork : "",
			duration: duration || currentTrack.duration || 0,
			currentTime: currentTime || 0,
		});
	}, [currentTrack, isPlaying, duration]);

	// Register OS-level lock screen commands (play, pause, skip buttons)
	useEffect(() => {
		if (!Capacitor.isNativePlatform()) return;

		const unregister = onRemoteCommand((command) => {
			switch (command) {
				case "play":
					if (!isPlaying) togglePlay();
					break;
				case "pause":
					if (isPlaying) togglePlay();
					break;
				case "next":
					nextTrack();
					break;
				case "prev":
					prevTrack();
					break;
			}
		});
		return () => {
			if (unregister) unregister();
		};
	}, [isPlaying, togglePlay, nextTrack, prevTrack]);
};
