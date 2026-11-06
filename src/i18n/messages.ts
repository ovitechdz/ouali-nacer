import type ar from './locales/ar.json';

/** Every translatable key is derived from the Arabic catalogue and type-checked. */
export type MessageKey = keyof typeof ar;
