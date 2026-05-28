import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

// Native plugins basic initialization on app load
if (Capacitor.isNativePlatform()) {
	StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
	SplashScreen.hide().catch(console.error);
	Haptics.impact({ style: ImpactStyle.Light }).catch(console.error);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</StrictMode>,
);
