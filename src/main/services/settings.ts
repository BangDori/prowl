import Store from 'electron-store';
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/types';

interface StoreSchema {
  settings: AppSettings;
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
  },
});

export function getSettings(): AppSettings {
  return store.get('settings');
}

export function setSettings(settings: AppSettings): void {
  store.set('settings', settings);
}

export function getPatterns(): string[] {
  return getSettings().patterns;
}
