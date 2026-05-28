import React from "react";
import { useState } from "react";
import type { ThemeAccent } from "../types";
import { getAccentBgClass, getAccentTextClass } from "../utils/themeUtils";
import { authenticateWithBiometrics } from "../hooks/useBiometricAuth";

interface PinUnlockProps {
	onUnlock: (pin: string) => void;
	onCancel: () => void;
	accent: ThemeAccent;
}

export const PinUnlock: React.FC<PinUnlockProps> = ({
	onUnlock,
	onCancel,
	accent,
}) => {
	const [pin, setPin] = useState("");
	const accentBg = getAccentBgClass(accent);
	const _accentText = getAccentTextClass(accent);

  const handleBiometric = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      onUnlock('');
    }
  };

	return (
		<div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
			<div className="w-full max-w-sm rounded-[2rem] bg-[#141414] p-8 border border-neutral-800 shadow-2xl">
				<h3 className="text-lg font-black text-white mb-6 text-center">
					Enter PIN
				</h3>
				<input
						type="password"
						maxLength={4}
						value={pin}
						onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
						className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 text-center text-3xl font-mono text-white mb-6"
						placeholder="0000" />
					<div className="flex gap-3">
						<button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl bg-neutral-800 text-white font-bold">Cancel</button>
						<button type="button" onClick={handleBiometric} className={`flex-1 py-3 rounded-xl ${accentBg} text-white font-bold`}>Use Face ID</button>
						<button type="button" onClick={() => onUnlock(pin)} className={`flex-1 py-3 rounded-xl ${accentBg} text-white font-bold`}>Unlock</button>
					</div>
				</div>
			</div>

	);
};
