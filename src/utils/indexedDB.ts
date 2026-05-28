import type { Playlist, Track, UserSettings } from "../types";

const DB_NAME = "ZMusicOfflineDB";
const DB_VERSION = 2;

// Secure hashing for PIN storage
export async function hashPIN(pin: string | null): Promise<string | null> {
	if (!pin) return null;
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(`${pin}zmusic_salt_2024`);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	} catch (_e) {
		console.error("Secure hashing not available. PIN will not be stored.");
		return null;
	}
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function initDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			console.error("Failed to open IndexedDB database");
			dbPromise = null; // allow retry
			reject(request.error);
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (_event) => {
			const db = request.result;

			// Track metadata store
			if (!db.objectStoreNames.contains("tracks")) {
				db.createObjectStore("tracks", { keyPath: "id" });
			}

			// Track Blobs store (stores raw audio data as Blob)
			if (!db.objectStoreNames.contains("audio_blobs")) {
				db.createObjectStore("audio_blobs");
			}

			// Playlists store
			if (!db.objectStoreNames.contains("playlists")) {
				db.createObjectStore("playlists", { keyPath: "id" });
			}

			// Settings store
			if (!db.objectStoreNames.contains("settings")) {
				db.createObjectStore("settings");
			}
		};
	});

	return dbPromise;
}

// ---------------- TRACKS & BLOBS ----------------

export async function saveOfflineTrack(
	track: Track,
	audioBlob: Blob,
): Promise<void> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(["tracks", "audio_blobs"], "readwrite");

		// Store track metadata (without raw transient/blob urls, we store the metadata structure)
		const trackToStore = { ...track, url: "" }; // we will recreate Blob URL on load
		const trackStore = tx.objectStore("tracks");
		trackStore.put(trackToStore);

		// Store raw audio blob associated with this track list ID
		const blobStore = tx.objectStore("audio_blobs");
		blobStore.put(audioBlob, track.id);

		tx.oncomplete = () => {
			resolve();
		};

		tx.onerror = () => {
			reject(tx.error);
		};
	});
}

export async function updateTrackMetadata(track: Track): Promise<void> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("tracks", "readwrite");
		const store = tx.objectStore("tracks");

		// Maintain state without modifying URL which is re-created on startup
		const cleanTrack = { ...track, url: "" };
		store.put(cleanTrack);

		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error);
		};
	});
}

export async function getOfflineTracks(): Promise<
	{ track: Track; blob: Blob }[]
> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(["tracks", "audio_blobs"], "readonly");
		const trackStore = tx.objectStore("tracks");
		const blobStore = tx.objectStore("audio_blobs");

		const trackRequest = trackStore.getAll();

		tx.onerror = () => reject(tx.error);

		trackRequest.onsuccess = () => {
			const tracks: Track[] = trackRequest.result || [];
			if (tracks.length === 0) {
				resolve([]);
				return;
			}

			const results: { track: Track; blob: Blob }[] = [];
			let loadedCount = 0;

			// Parallelize blob fetching to maximize performance
			tracks.forEach((track) => {
				const blobRequest = blobStore.get(track.id);

				blobRequest.onsuccess = () => {
					if (blobRequest.result) {
						results.push({ track, blob: blobRequest.result });
					}
					loadedCount++;
					if (loadedCount === tracks.length) {
						resolve(results);
					}
				};

				blobRequest.onerror = () => {
					console.warn(`Failed to retrieve blob for track ${track.id}`);
					loadedCount++;
					if (loadedCount === tracks.length) {
						resolve(results);
					}
				};
			});
		};
	});
}

export async function deleteOfflineTrack(id: string): Promise<void> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(["tracks", "audio_blobs"], "readwrite");
		tx.objectStore("tracks").delete(id);
		tx.objectStore("audio_blobs").delete(id);

		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error);
		};
	});
}

// ---------------- PLAYLISTS ----------------

export async function savePlaylistDB(playlist: Playlist): Promise<void> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("playlists", "readwrite");
		tx.objectStore("playlists").put(playlist);

		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error);
		};
	});
}

export async function getPlaylistsDB(): Promise<Playlist[]> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("playlists", "readonly");
		const request = tx.objectStore("playlists").getAll();

		request.onsuccess = () => {
			resolve(request.result || []);
		};
		request.onerror = () => {
			reject(request.error);
		};
	});
}

export async function deletePlaylistDB(id: string): Promise<void> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("playlists", "readwrite");
		tx.objectStore("playlists").delete(id);

		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error);
		};
	});
}

// ---------------- CONFIG / SETTINGS ----------------

export async function saveSettingsDB(settings: UserSettings): Promise<void> {
	const db = await initDB();
	// Security: Hash PIN before storage
	const hashedPin = await hashPIN(settings.privateFolderPin);

	const secureSettings = {
		...settings,
		privateFolderPin: hashedPin,
	};

	return new Promise((resolve, reject) => {
		const tx = db.transaction("settings", "readwrite");
		tx.objectStore("settings").put(secureSettings, "user_settings");
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function getSettingsDB(): Promise<UserSettings | null> {
	const db = await initDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("settings", "readonly");
		const request = tx.objectStore("settings").get("user_settings");

		request.onsuccess = () => {
			resolve((request.result as UserSettings) || null);
		};
		request.onerror = () => reject(request.error);
	});
}

export async function resetAppDB(): Promise<void> {
	dbPromise = null;
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(DB_NAME);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}
