// Simple singleton store for pending notification actions.
// Set before navigating; consume once on screen focus.
let _pendingType: string | null = null;

export const notificationStore = {
  set:     (type: string)       => { _pendingType = type; },
  consume: (): string | null    => { const v = _pendingType; _pendingType = null; return v; },
  peek:    (): string | null    => _pendingType,
};
