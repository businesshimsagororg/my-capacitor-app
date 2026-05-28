import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';

/**
 * Attempts to authenticate the user using Face ID / Touch ID.
 * Returns a promise that resolves to true if authentication succeeded.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    // Check if biometric authentication is available on the device
    const checkResult = await BiometricAuth.checkBiometry();
    if (!checkResult.isAvailable) {
      console.warn('Biometric not available:', checkResult.reason);
      return false;
    }
    // Request authentication
    await BiometricAuth.authenticate({
      reason: 'Unlock private folder',
      title: 'Authenticate',
      subtitle: 'Use Face ID or Touch ID',
    });
    return true;
  } catch (e) {
    console.warn('Biometric authentication failed', e);
    return false;
  }
}
