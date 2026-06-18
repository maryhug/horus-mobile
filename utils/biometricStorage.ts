import { getItem, setItem } from './storage';

// Stored ONLY on this device — never synced to server.
// Each device must configure biometric independently, even for the same account.
const KEY = 'horus_biometric_local';

export const getBiometricEnabled = (): Promise<boolean> =>
  getItem(KEY).then(v => v === 'true');

export const setBiometricEnabled = (enabled: boolean): Promise<void> =>
  setItem(KEY, enabled ? 'true' : 'false');
