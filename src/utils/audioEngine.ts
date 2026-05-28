import type { Track } from "../types";

class AudioEngine {
	private ctx: AudioContext | null = null;
	private audio: HTMLAudioElement | null = null;
	private source: MediaElementAudioSourceNode | null = null;

	// Custom EQ nodes in series
	private eqFilters: BiquadFilterNode[] = [];
	private bassBoostNode: BiquadFilterNode | null = null;

	// Spatial/spatializer nodes
	private spatialNode: StereoPannerNode | null = null;
	private widenerSplitter: ChannelSplitterNode | null = null;
	private widenerMerger: ChannelMergerNode | null = null;
	private widenerDelay: DelayNode | null = null;
	private widenerGain: GainNode | null = null;

	private gainNode: GainNode | null = null;
	private trackGainNode: GainNode | null = null;
	public analyserNode: AnalyserNode | null = null;

	// Synthesizer variables for mock music
	private synthInterval: any = null;
	private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
	private currentSynthTrack: Track | null = null;
	private trackStartTime: number = 0;
	private isSynthPlaying: boolean = false;
	private synthTempo: number = 100; // BPM
	private synthBeatsCount: number = 0;
	private synthStepFunction: (() => void) | null = null;
	private synthSimulatedCurrentTime: number = 0;

	// Audio Playback Settings
	private _volume: number = 0.8;
	private _playbackRate: number = 1.0;
	private _bassPercent: number = 30;
	private _eqGains: number[] = [0, 0, 0, 0, 0];
	private vocalFilterNode: BiquadFilterNode | null = null;
	private vocalDryGainNode: GainNode | null = null;
	private vocalWetGainNode: GainNode | null = null;
	private _isVocalOnly: boolean = false;
	private _vocalSuppressionLevel: number = 70;
	private _isSkipSilenceEnabled: boolean = false;
	private _crossfadeDuration: number = 3;
	private silenceCheckInterval: any = null;
	private silenceDurationMs: number = 0;

	private adaptiveCompressor: DynamicsCompressorNode | null = null;
	private _isSpatialEnabled: boolean = false;
	private _isAdaptiveAudioEnabled: boolean = false;
	private isInitializing: boolean = false;

	private onTimeUpdateCallback:
		| ((currentTime: number, duration: number) => void)
		| null = null;
	private onEndedCallback: (() => void) | null = null;

	private initContext() {
		if (this.ctx || this.isInitializing) return;
		this.isInitializing = true;
		try {
			this.ctx = new (
				window.AudioContext || (window as any).webkitAudioContext
			)();
			this.analyserNode = this.ctx.createAnalyser();
			this.analyserNode.fftSize = 256;

			this.gainNode = this.ctx.createGain();
			this.gainNode.gain.value = this._volume;

			this.trackGainNode = this.ctx.createGain();
			this.trackGainNode.gain.value = 1.0;

			this.adaptiveCompressor = this.ctx.createDynamicsCompressor();
			this.adaptiveCompressor.threshold.value = -35;
			this.adaptiveCompressor.knee.value = 15;
			this.adaptiveCompressor.ratio.value = 1; // 1 means passive Bypass initially
			this.adaptiveCompressor.attack.value = 0.03;
			this.adaptiveCompressor.release.value = 0.25;

			// Create dedicated Bass Boost low shelf filter
			this.bassBoostNode = this.ctx.createBiquadFilter();
			this.bassBoostNode.type = "lowshelf";
			this.bassBoostNode.frequency.value = 100; // Bass frequency limit
			this.bassBoostNode.gain.value = (this._bassPercent / 100) * 15; // Max boost of +15dB

			// Create EQ filters (5 Bands: 60Hz, 230Hz, 910Hz, 4kHz, 14kHz)
			const freqs = [60, 230, 910, 4000, 14000];
			this.eqFilters = freqs.map((freq, index) => {
				const filter = this.ctx?.createBiquadFilter();
				if (index === 0) {
					filter.type = "lowshelf";
				} else if (index === freqs.length - 1) {
					filter.type = "highshelf";
				} else {
					filter.type = "peaking";
					filter.Q.value = 1.0; // standard width
				}
				filter.frequency.value = freq;
				filter.gain.value = this._eqGains[index];
				return filter;
			});

			// Spatial stereo panner
			this.spatialNode = this.ctx.createStereoPanner();
			this.spatialNode.pan.value = 0; // centered default

			// Stereo Widener (Haas Effect)
			this.widenerSplitter = this.ctx.createChannelSplitter(2);
			this.widenerMerger = this.ctx.createChannelMerger(2);
			this.widenerDelay = this.ctx.createDelay(0.1);
			this.widenerDelay.delayTime.value = 0.025; // 25ms widening
			this.widenerGain = this.ctx.createGain();
			this.widenerGain.gain.value = 0; // disabled by default

			// Wire up widener path
			this.widenerSplitter.connect(this.ctx.destination, 0); // Left pass through
			this.widenerSplitter.connect(this.widenerDelay, 1); // Right channel to delay
			this.widenerDelay.connect(this.widenerMerger, 0, 1); // Delayed right to merger Right
			this.widenerSplitter.connect(this.widenerMerger, 0, 0); // Left to merger Left
			// Note: This widener logic is for the 'optimization' toggle.
			// We will integrate it into the main graph later.

			// Vocal Filter Node (uses bandpass mode specifically for isolation)
			this.vocalFilterNode = this.ctx.createBiquadFilter();
			this.vocalFilterNode.type = "bandpass";
			this.vocalFilterNode.frequency.value = 1500; // center frequency of human vocal range
			this.vocalFilterNode.Q.value = 0.45; // wide enough to cover speech/singing frequencies

			// Dry and Wet mixer gain nodes for adjustable vocal isolation
			this.vocalDryGainNode = this.ctx.createGain();
			this.vocalWetGainNode = this.ctx.createGain();

			// Update their dynamic initial values
			this.updateVocalMixer();

			// Wire them up in series:
			// Source -> BassBoost -> EQ0 -> EQ1 -> EQ2 -> EQ3 -> EQ4 -> Split
			let lastNode: AudioNode = this.bassBoostNode;
			this.eqFilters.forEach((filter) => {
				lastNode.connect(filter);
				lastNode = filter;
			});

			// Split the signal into a Dry path and a Filtered/Isolated (Wet) path
			lastNode.connect(this.vocalDryGainNode);
			lastNode.connect(this.vocalFilterNode);
			this.vocalFilterNode.connect(this.vocalWetGainNode);

			// Re-converge dry and wet paths into the spatial node
			this.vocalDryGainNode.connect(this.spatialNode);
			this.vocalWetGainNode.connect(this.spatialNode);

			// --- WIDENER INTEGRATION ---
			// We'll create a parallel 'wet' widening path
			this.spatialNode.connect(this.widenerSplitter);
			this.widenerSplitter.connect(this.widenerDelay, 0); // Left to delay (only delaying one for Haas)
			this.widenerDelay.connect(this.widenerMerger, 0, 1); // Delayed Left to Right output
			this.widenerSplitter.connect(this.widenerMerger, 0, 0); // Dry Left to Left output

			this.widenerMerger.connect(this.widenerGain);

			// Main path (Direct)
			this.spatialNode.connect(this.trackGainNode);

			// Secondary Widened path (Mixed in based on setting)
			this.widenerGain.connect(this.trackGainNode);

			this.trackGainNode.connect(this.gainNode);
			this.gainNode.connect(this.adaptiveCompressor);
			this.adaptiveCompressor.connect(this.analyserNode);
			this.analyserNode.connect(this.ctx.destination);
		} catch (e) {
			console.error("Failed to initialize AudioContext api", e);
		} finally {
			this.isInitializing = false;
		}
	}

	public setCallbacks(
		onTimeUpdate: (cur: number, dur: number) => void,
		onEnded: () => void,
	) {
		this.onTimeUpdateCallback = onTimeUpdate;
		this.onEndedCallback = onEnded;
	}

	public play(track: Track) {
		this.initContext();
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume();
		}

		const wasPlaying = this.audio ? !this.audio.paused : false;
		this.stopCurrent();

		if (track.url.startsWith("synth://")) {
			this.playSynth(track);
		} else {
			this.playFile(track, wasPlaying);
		}
	}

	public setTrackGain(gain: number) {
		if (this.ctx && this.trackGainNode) {
			this.trackGainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
		}
	}

	private playFile(track: Track, shouldFadeIn = false) {
		this.isSynthPlaying = false;
		this.audio = new Audio();
		this.audio.playbackRate = this._playbackRate;
		this.audio.src = track.url;
		this.audio.crossOrigin = "anonymous";

		// Connect audio element source to Web Audio graph
		if (this.ctx && this.bassBoostNode) {
			try {
				this.source = this.ctx.createMediaElementSource(this.audio);
				this.source.connect(this.bassBoostNode);
			} catch (e) {
				console.warn("Audio Context creation issue or already connected", e);
			}
		}

		if (
			shouldFadeIn &&
			this._crossfadeDuration > 0 &&
			this.ctx &&
			this.trackGainNode
		) {
			const time = this.ctx.currentTime;
			this.trackGainNode.gain.cancelScheduledValues(time);
			this.trackGainNode.gain.setValueAtTime(0.0001, time);
			this.trackGainNode.gain.exponentialRampToValueAtTime(
				1.0,
				time + this._crossfadeDuration,
			);
		} else if (this.trackGainNode) {
			this.setTrackGain(track.gainAdjustment || 1.0);
		}

		this.audio.addEventListener("timeupdate", () => {
			if (this.audio && this.onTimeUpdateCallback) {
				this.onTimeUpdateCallback(
					this.audio.currentTime,
					this.audio.duration || track.duration,
				);
			}
		});

		this.audio.addEventListener("ended", () => {
			if (this.onEndedCallback) {
				this.onEndedCallback();
			}
		});

		this.audio.play().catch((e) => console.error("Audio play failed", e));
	}

	// Real-time Music Synthesizer based on mood
	private playSynth(track: Track, resumeTime?: number) {
		this.isSynthPlaying = true;
		this.currentSynthTrack = track;

		// To support background play for synthesizers, we play a silent looping audio file
		this.audio = new Audio();
		this.audio.playbackRate = this._playbackRate;
		this.audio.src =
			"data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=";
		this.audio.loop = true;
		this.audio.volume = 0.01;
		this.audio.play().catch((e) => console.warn("Silent audio play failed", e));

		// Adjust tempo based on mood
		if (track.mood === "Energy") this.synthTempo = 125;
		else if (track.mood === "Happy") this.synthTempo = 110;
		else if (track.mood === "Focus") this.synthTempo = 85;
		else if (track.mood === "Sad") this.synthTempo = 70;
		else this.synthTempo = 95; // Chill

		if (resumeTime !== undefined) {
			this.synthSimulatedCurrentTime = resumeTime;
			this.trackStartTime = Date.now() - resumeTime * 1000;
			this.synthBeatsCount = Math.floor(
				(resumeTime / 60) * this.synthTempo * 2,
			);
		} else {
			this.trackStartTime = Date.now();
			this.synthSimulatedCurrentTime = 0;
			this.synthBeatsCount = 0;
		}

		const intervalMs =
			((60 / this.synthTempo) * 1000 * 0.5) / this._playbackRate; // Eighth notes, scaled by playback rate

		// Periodically update progress callback
		const updateProgress = () => {
			if (!this.isSynthPlaying) return;
			const elapsed = this.synthSimulatedCurrentTime;
			if (this.onTimeUpdateCallback) {
				this.onTimeUpdateCallback(elapsed % track.duration, track.duration);
			}
			if (elapsed >= track.duration) {
				if (this.onEndedCallback) {
					this.onEndedCallback();
				}
			}
		};

		// Beautiful harmonic progression frequencies in root/chords
		// Scales matching moods
		const chords: Record<string, number[][]> = {
			Happy: [
				[261.63, 329.63, 392.0], // C major (C4, E4, G4)
				[349.23, 440.0, 523.25], // F major (F4, A4, C5)
				[392.0, 493.88, 587.33], // G major (G4, B4, D5)
				[440.0, 554.37, 659.25], // A major
			],
			Chill: [
				[293.66, 349.23, 440.0, 523.25], // Dm7 (D4, F4, A4, C5)
				[329.63, 392.0, 493.88, 587.33], // Em7 (E4, G4, B4, D5)
				[349.23, 440.0, 523.25, 659.25], // Fmaj7
				[293.66, 349.23, 440.0, 523.25], // Dm7
			],
			Focus: [
				[220.0, 261.63, 329.63], // Am (A3, C4, E4)
				[293.66, 349.23, 440.0], // Dm (D4, F4, A4)
				[329.63, 392.0, 493.88], // Em (E4, G4, B4)
				[220.0, 261.63, 329.63], // Am
			],
			Sad: [
				[220.0, 261.63, 329.63], // Am (A3, C4, E4)
				[174.61, 220.0, 261.63], // F (F3, A3, C4)
				[261.63, 329.63, 392.0], // C (C4, E4, G4)
				[196.0, 246.94, 293.66], // G (G3, B3, D4)
			],
			Energy: [
				[146.83, 220.0], // D5 base
				[164.81, 246.94], // E5 base
				[174.61, 261.63], // F5 base
				[196.0, 293.66], // G5 base
			],
		};

		const playStep = () => {
			if (!this.ctx || !this.isSynthPlaying || this.ctx.state === "suspended")
				return;
			const t = this.ctx.currentTime;

			const moodKey = track.mood;
			const pool = chords[moodKey] || chords.Chill;

			// Select chord index based on 8-beat loops
			const chordIdx = Math.floor(this.synthBeatsCount / 16) % pool.length;
			const currentChord = pool[chordIdx];

			// Play soft Ambient Chords on Beat 0 and 16
			if (this.synthBeatsCount % 8 === 0) {
				currentChord.forEach((freq) => {
					this.triggerNote(freq, t, 1.5, "triangle", 0.08); // Chord pad
				});
			}

			// Add a melodic arpeggio or rhythm depending on mood
			if (track.mood === "Happy" && this.synthBeatsCount % 2 === 0) {
				const note =
					currentChord[this.synthBeatsCount % currentChord.length] * 2; // Arp octave up
				this.triggerNote(note, t, 0.3, "sine", 0.04);
			} else if (track.mood === "Chill" && this.synthBeatsCount % 4 === 2) {
				const note =
					currentChord[Math.floor(Math.random() * currentChord.length)] * 2;
				this.triggerNote(note, t, 0.6, "sine", 0.03);
			} else if (track.mood === "Focus") {
				// Drone pulse
				if (this.synthBeatsCount % 8 === 4) {
					const rootFreq = currentChord[0] * 0.5; // low bass drone note
					this.triggerNote(rootFreq, t, 2.0, "sine", 0.15);
				}
			} else if (track.mood === "Sad" && this.synthBeatsCount % 8 === 2) {
				const note =
					currentChord[this.synthBeatsCount % currentChord.length] * 1.5;
				this.triggerNote(note, t, 1.2, "triangle", 0.025);
			} else if (track.mood === "Energy" && this.synthBeatsCount % 1 === 0) {
				// High energy rapid fire synth pattern
				const noteSeq = [1, 1.2, 1.5, 1.8, 1.5, 1.2, 2.0, 1.2];
				const multiplier = noteSeq[this.synthBeatsCount % noteSeq.length];
				const note = currentChord[0] * multiplier * 2;
				this.triggerNote(note, t, 0.15, "sawtooth", 0.02);

				// Sim Kick Drum beat
				if (this.synthBeatsCount % 4 === 0) {
					this.triggerKickdrum(t);
				}
			}

			// Tick simulated current time based on sixteenth beat step
			this.synthSimulatedCurrentTime += (60 / this.synthTempo) * 0.5;
			this.synthBeatsCount++;
			updateProgress();
		};

		// Tie playStep function so playback velocity tuning can dynamically re-schedule the interval
		this.synthStepFunction = playStep;

		// Tick instantly first, then schedule
		playStep();
		this.synthInterval = setInterval(playStep, intervalMs);
	}

	private triggerNote(
		freq: number,
		startTime: number,
		duration: number,
		type: OscillatorType,
		maxGain: number,
	) {
		if (!this.ctx || !this.bassBoostNode) return;

		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = type;
			osc.frequency.setValueAtTime(freq, startTime);

			// Delicate acoustic envelope (Attack, Decay, Sustain, Release)
			gain.gain.setValueAtTime(0, startTime);
			gain.gain.linearRampToValueAtTime(maxGain, startTime + 0.08); // attack
			gain.gain.setValueAtTime(maxGain, startTime + duration - 0.1);
			gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // release

			osc.connect(gain);
			// Route through filters to ensure Bass Boost & Equalizer still modify synthesized music perfectly!
			gain.connect(this.bassBoostNode);

			osc.start(startTime);
			osc.stop(startTime + duration);

			const item = { osc, gain };
			this.activeOscillators.push(item);

			setTimeout(
				() => {
					this.activeOscillators = this.activeOscillators.filter(
						(i) => i !== item,
					);
				},
				duration * 1000 + 500,
			);
		} catch (_e) {
			// safe bypass
		}
	}

	// Pure mathematical synthesis of classic kickdrum
	private triggerKickdrum(time: number) {
		if (!this.ctx || !this.bassBoostNode) return;
		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.connect(gain);
			gain.connect(this.bassBoostNode);

			osc.frequency.setValueAtTime(120, time);
			osc.frequency.exponentialRampToValueAtTime(0.1, time + 0.2); // sweep downwards

			gain.gain.setValueAtTime(0.2, time);
			gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

			osc.start(time);
			osc.stop(time + 0.25);
		} catch (_e) {
			// safe bypass
		}
	}

	public pause() {
		if (this.isSynthPlaying) {
			this.cancelSynthPlayback();
		}
		if (this.audio) {
			this.audio.pause();
		}
	}

	public resume() {
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume();
		}

		if (this.currentSynthTrack && !this.isSynthPlaying) {
			this.playSynth(this.currentSynthTrack, this.synthSimulatedCurrentTime);
		} else if (this.audio) {
			this.audio.play().catch((e) => console.error("Audio resume failed", e));
		}
	}

	public seek(seconds: number) {
		if (this.isSynthPlaying) {
			// Simulated seek for synthesizers
			if (this.currentSynthTrack) {
				this.synthSimulatedCurrentTime = seconds;
				this.trackStartTime = Date.now() - seconds * 1000;
				this.synthBeatsCount = Math.floor((seconds / 60) * this.synthTempo * 2);
			}
		} else if (this.audio) {
			this.audio.currentTime = seconds;
		}
	}

	private stopCurrent(immediate = false) {
		this.cancelSynthPlayback();

		if (
			this.audio &&
			!immediate &&
			this._crossfadeDuration > 0 &&
			!this.isSynthPlaying &&
			this.ctx &&
			this.trackGainNode
		) {
			const time = this.ctx.currentTime;
			const fadeOutObj = this.audio;
			const fadeOutSource = this.source;

			this.trackGainNode.gain.cancelScheduledValues(time);
			this.trackGainNode.gain.setValueAtTime(
				this.trackGainNode.gain.value,
				time,
			);
			this.trackGainNode.gain.exponentialRampToValueAtTime(
				0.0001,
				time + this._crossfadeDuration,
			);

			setTimeout(
				() => {
					if (fadeOutObj) {
						fadeOutObj.pause();
						fadeOutObj.src = "";
					}
					try {
						if (fadeOutSource) fadeOutSource.disconnect();
					} catch (_e) {}
				},
				this._crossfadeDuration * 1000 + 100,
			);
		} else {
			// Ensure gain is reset for next track
			if (this.trackGainNode) {
				this.trackGainNode.gain.cancelScheduledValues(0);
				this.trackGainNode.gain.setValueAtTime(1, 0);
			}

			if (this.audio) {
				this.audio.pause();
				this.audio.src = "";
				this.audio = null;
			}
			if (this.source) {
				try {
					this.source.disconnect();
				} catch (_e) {}
				this.source = null;
			}
		}
	}

	public fadeOutAndStop(duration: number = 30) {
		if (
			!this.ctx ||
			!this.trackGainNode ||
			(!this.audio && !this.isSynthPlaying)
		)
			return;

		const time = this.ctx.currentTime;
		this.trackGainNode.gain.cancelScheduledValues(time);
		this.trackGainNode.gain.setValueAtTime(this.trackGainNode.gain.value, time);
		this.trackGainNode.gain.exponentialRampToValueAtTime(
			0.0001,
			time + duration,
		);

		setTimeout(
			() => {
				this.pause();
				// Reset gain after stop so future plays work
				if (this.trackGainNode && this.ctx) {
					this.trackGainNode.gain.setValueAtTime(1, this.ctx.currentTime);
				}
			},
			duration * 1000 + 500,
		);
	}

	private cancelSynthPlayback() {
		this.isSynthPlaying = false;
		if (this.synthInterval) {
			clearInterval(this.synthInterval);
			this.synthInterval = null;
		}
		// Fade out active oscillators instantly
		this.activeOscillators.forEach((item) => {
			try {
				item.gain.gain.cancelScheduledValues(0);
				item.gain.gain.exponentialRampToValueAtTime(0.0001, 0.05);
				item.osc.stop(0.1);
			} catch (_e) {
				// safe bypass
			}
		});
		this.activeOscillators = [];
	}

	// Setters for Settings Config
	public setVolume(volume: number) {
		this._volume = volume;
		if (this.gainNode) {
			this.gainNode.gain.setValueAtTime(
				volume,
				this.ctx ? this.ctx.currentTime : 0,
			);
		}
		this.updateAdaptiveProfile();
	}

	public setAdaptiveAudio(enabled: boolean) {
		this._isAdaptiveAudioEnabled = enabled;
		this.updateAdaptiveProfile();
	}

	private updateAdaptiveProfile() {
		if (!this.adaptiveCompressor || !this.ctx) return;

		if (!this._isAdaptiveAudioEnabled) {
			// Passive Bypass
			this.adaptiveCompressor.ratio.setTargetAtTime(
				1,
				this.ctx.currentTime,
				0.1,
			);
			return;
		}

		// Low volume -> more compression ratio & lower threshold to boost details (simulating Fletcher-Munson dynamic curve)
		if (this._volume < 0.4) {
			this.adaptiveCompressor.threshold.setTargetAtTime(
				-45,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.ratio.setTargetAtTime(
				3.8,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.knee.setTargetAtTime(
				14,
				this.ctx.currentTime,
				0.3,
			);
		} else if (this._volume < 0.7) {
			// Medium Volume -> gentle warmth
			this.adaptiveCompressor.threshold.setTargetAtTime(
				-32,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.ratio.setTargetAtTime(
				2.2,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.knee.setTargetAtTime(
				18,
				this.ctx.currentTime,
				0.3,
			);
		} else {
			// High volume -> very light peak leveling to prevent distortion
			this.adaptiveCompressor.threshold.setTargetAtTime(
				-20,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.ratio.setTargetAtTime(
				1.5,
				this.ctx.currentTime,
				0.3,
			);
			this.adaptiveCompressor.knee.setTargetAtTime(
				24,
				this.ctx.currentTime,
				0.3,
			);
		}
	}

	public setBassBoost(percent: number) {
		this._bassPercent = percent;
		if (this.bassBoostNode) {
			const dBBoost = (percent / 100) * 15; // scales up to +15dB boost
			this.bassBoostNode.gain.setValueAtTime(
				dBBoost,
				this.ctx ? this.ctx.currentTime : 0,
			);
		}
	}

	public setEQBand(index: number, dbValue: number) {
		if (index >= 0 && index < this._eqGains.length) {
			this._eqGains[index] = dbValue;
			if (this.eqFilters[index]) {
				this.eqFilters[index].gain.setValueAtTime(
					dbValue,
					this.ctx ? this.ctx.currentTime : 0,
				);
			}
		}
	}

	public setEQPreset(presetGains: number[]) {
		presetGains.forEach((gain, valIdx) => {
			this.setEQBand(valIdx, gain);
		});
	}

	public setSpatialOptimization(enabled: boolean) {
		this._isSpatialEnabled = enabled;
		if (this.ctx && this.gainNode && this.widenerGain) {
			const time = this.ctx.currentTime;
			if (enabled) {
				// Widener active: Reduce main path slightly and boost widened path
				this.widenerGain.gain.setTargetAtTime(0.7, time, 0.2); // 0.7 mix
				this.spatialNode?.pan.setTargetAtTime(0.05, time, 0.2); // slight offset helper
			} else {
				this.widenerGain.gain.setTargetAtTime(0, time, 0.2);
				this.spatialNode?.pan.setTargetAtTime(0, time, 0.2);
			}
		}
	}

	private updateVocalMixer() {
		if (
			!this.vocalDryGainNode ||
			!this.vocalWetGainNode ||
			!this.vocalFilterNode
		)
			return;
		const time = this.ctx ? this.ctx.currentTime : 0;

		if (this._isVocalOnly) {
			// Premium Vocal Isolate Profile: Advanced bandpass logic for core frequency preservation
			this.vocalFilterNode.frequency.setTargetAtTime(1500, time, 0.1);
			this.vocalFilterNode.Q.setTargetAtTime(0.35, time, 0.1); // Slightly wider coverage

			const suppressionFactor = this._vocalSuppressionLevel / 100;
			const dryVal = Math.max(0.01, 1.0 - suppressionFactor);

			this.vocalDryGainNode.gain.setTargetAtTime(dryVal, time, 0.1);
			this.vocalWetGainNode.gain.setTargetAtTime(1.3, time, 0.1); // Slight gain makeup for filtered signal
		} else {
			this.vocalDryGainNode.gain.setTargetAtTime(1.0, time, 0.1);
			this.vocalWetGainNode.gain.setTargetAtTime(0.0, time, 0.1);
		}
	}

	public setVocalOnly(enabled: boolean) {
		this._isVocalOnly = enabled;
		this.updateVocalMixer();
	}

	public setVocalSuppressionLevel(level: number) {
		this._vocalSuppressionLevel = level;
		this.updateVocalMixer();
	}

	public setCrossfadeDuration(duration: number) {
		this._crossfadeDuration = duration;
	}

	public setPlaybackSpeed(speed: number) {
		this._playbackRate = speed;
		if (this.audio) {
			try {
				this.audio.playbackRate = speed;
			} catch (e) {
				console.warn("HTML5 Audio set playbackRate failed", e);
			}
		}
		if (this.isSynthPlaying && this.synthStepFunction) {
			if (this.synthInterval) {
				clearInterval(this.synthInterval);
			}
			const intervalMs = ((60 / this.synthTempo) * 1000 * 0.5) / speed;
			this.synthInterval = setInterval(this.synthStepFunction, intervalMs);
		}
	}

	public setSkipSilence(enabled: boolean) {
		this._isSkipSilenceEnabled = enabled;
		if (enabled) {
			this.startSilenceCheck();
		} else {
			this.stopSilenceCheck();
		}
	}

	private startSilenceCheck() {
		this.stopSilenceCheck();
		this.silenceDurationMs = 0;
		this.silenceCheckInterval = setInterval(() => {
			if (!this._isSkipSilenceEnabled || !this.analyserNode) return;

			// Only monitor volume when playing and either audio or synthesizers are running
			const isActuallyPlaying =
				this.isSynthPlaying || (this.audio && !this.audio.paused);
			if (!isActuallyPlaying) {
				this.silenceDurationMs = 0;
				return;
			}

			// Check average amplitude
			const bufferLength = this.analyserNode.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);
			this.analyserNode.getByteFrequencyData(dataArray);

			let total = 0;
			for (let i = 0; i < bufferLength; i++) {
				total += dataArray[i];
			}
			const avgVolume = total / bufferLength;

			// Silence threshold represents deep silence gaps (< 1.8 average sound value)
			if (avgVolume < 1.8) {
				this.silenceDurationMs += 150;
				// If there is silence of more than 500ms, skip forward by 2.5 seconds
				if (this.silenceDurationMs >= 500) {
					this.silenceDurationMs = 0;

					if (this.isSynthPlaying && this.currentSynthTrack) {
						// Advancing beatsCount to skip silence pocket manually
						const currentSec = (Date.now() - this.trackStartTime) / 1000;
						const newSec = Math.min(
							currentSec + 2.5,
							this.currentSynthTrack.duration - 0.5,
						);
						this.seek(newSec);
					} else if (this.audio) {
						const currentSec = this.audio.currentTime;
						const duration = this.audio.duration || 180;
						const newSec = Math.min(currentSec + 2.5, duration - 0.5);
						if (newSec < duration - 1) {
							this.audio.currentTime = newSec;
							console.log("Skipped silence pocket automatically to", newSec);
						}
					}
				}
			} else {
				this.silenceDurationMs = 0;
			}
		}, 150);
	}

	private stopSilenceCheck() {
		if (this.silenceCheckInterval) {
			clearInterval(this.silenceCheckInterval);
			this.silenceCheckInterval = null;
		}
		this.silenceDurationMs = 0;
	}

	public cleanup() {
		this.stopCurrent();
		if (this.ctx) {
			this.ctx.close();
			this.ctx = null;
		}
	}
}

export const audioEngine = new AudioEngine();
export default audioEngine;

// Ensure we clean up system audio streams + synth intervals during dev hot reloading
// @ts-expect-error
if (import.meta.hot) {
	// @ts-expect-error
	import.meta.hot.dispose(() => {
		audioEngine.cleanup();
	});
}
