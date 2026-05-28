import { useEffect, useState } from "react";
import { audioEngine } from "../utils/audioEngine";

export function useAudioFrequency(frequencyBin: number = 0) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const analyser = audioEngine.analyserNode;
		if (!analyser) return;

		let animationId: number;
		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		const update = () => {
			analyser.getByteFrequencyData(dataArray);
			// We take the value at the specified bin (default 0 for bass/beat)
			// Normalized to 0.0 - 1.0
			setValue(dataArray[frequencyBin] / 255);
			animationId = requestAnimationFrame(update);
		};

		update();
		return () => cancelAnimationFrame(animationId);
	}, [frequencyBin]);

	return value;
}
