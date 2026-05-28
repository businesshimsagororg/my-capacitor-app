import type { ActiveTab, Playlist, Track, UserSettings } from "../types";

export interface MusicState {
	tracks: Track[];
	playlists: Playlist[];
	currentTrack: Track | null;
	queue: Track[];
	history: Track[]; // Track history for back/recent
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	activeTab: ActiveTab;
	isPlayerExpanded: boolean;
	isSideMenuOpen: boolean;
	settings: UserSettings;
	sleepTimerSeconds: number | null;
	searchQuery: string;
	searchHistory: string[];
	isInitializing: boolean;
}

export type MusicAction =
	| { type: "SET_TRACKS"; payload: Track[] }
	| { type: "SET_PLAYLISTS"; payload: Playlist[] }
	| { type: "SET_CURRENT_TRACK"; payload: Track | null }
	| { type: "SET_QUEUE"; payload: Track[] }
	| { type: "ADD_TO_HISTORY"; payload: Track }
	| { type: "SET_IS_PLAYING"; payload: boolean }
	| { type: "SET_CURRENT_TIME"; payload: number }
	| { type: "SET_DURATION"; payload: number }
	| { type: "SET_ACTIVE_TAB"; payload: MusicState["activeTab"] }
	| { type: "SET_PLAYER_EXPANDED"; payload: boolean }
	| { type: "SET_SIDE_MENU_OPEN"; payload: boolean }
	| { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
	| { type: "SET_SLEEP_TIMER"; payload: number | null }
	| { type: "SET_SEARCH_QUERY"; payload: string }
	| { type: "ADD_TO_SEARCH_HISTORY"; payload: string }
	| { type: "CLEAR_SEARCH_HISTORY" }
	| { type: "SET_INITIALIZING"; payload: boolean }
	| { type: "UPDATE_TRACK"; payload: Track };

export const musicReducer = (
	state: MusicState,
	action: MusicAction,
): MusicState => {
	switch (action.type) {
		case "SET_TRACKS":
			return { ...state, tracks: action.payload };
		case "SET_PLAYLISTS":
			return { ...state, playlists: action.payload };
		case "SET_CURRENT_TRACK":
			return { ...state, currentTrack: action.payload };
		case "SET_QUEUE":
			return { ...state, queue: action.payload };
		case "ADD_TO_HISTORY": {
			const newHistory = [
				action.payload,
				...state.history.filter((t) => t.id !== action.payload.id),
			].slice(0, 20);
			return { ...state, history: newHistory };
		}
		case "SET_IS_PLAYING":
			return { ...state, isPlaying: action.payload };
		case "SET_CURRENT_TIME":
			return { ...state, currentTime: action.payload };
		case "SET_DURATION":
			return { ...state, duration: action.payload };
		case "SET_ACTIVE_TAB":
			return { ...state, activeTab: action.payload };
		case "SET_PLAYER_EXPANDED":
			return { ...state, isPlayerExpanded: action.payload };
		case "SET_SIDE_MENU_OPEN":
			return { ...state, isSideMenuOpen: action.payload };
		case "UPDATE_SETTINGS":
			return { ...state, settings: { ...state.settings, ...action.payload } };
		case "SET_SLEEP_TIMER":
			return { ...state, sleepTimerSeconds: action.payload };
		case "SET_SEARCH_QUERY":
			return { ...state, searchQuery: action.payload };
		case "ADD_TO_SEARCH_HISTORY": {
			const query = action.payload.trim();
			if (!query) return state;
			const newHistory = [
				query,
				...state.searchHistory.filter((q) => q !== query),
			].slice(0, 10);
			return { ...state, searchHistory: newHistory };
		}
		case "CLEAR_SEARCH_HISTORY":
			return { ...state, searchHistory: [] };
		case "SET_INITIALIZING":
			return { ...state, isInitializing: action.payload };
		case "UPDATE_TRACK":
			return {
				...state,
				tracks: state.tracks.map((t) =>
					t.id === action.payload.id ? action.payload : t,
				),
				currentTrack:
					state.currentTrack?.id === action.payload.id
						? action.payload
						: state.currentTrack,
				queue: state.queue.map((t) =>
					t.id === action.payload.id ? action.payload : t,
				),
			};
		default:
			return state;
	}
};
