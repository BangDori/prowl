import Store from 'electron-store';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  JobCustomization,
  JobCustomizations,
} from '../../shared/types';

interface StoreSchema {
  settings: AppSettings;
  jobCustomizations: JobCustomizations;
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    jobCustomizations: {},
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

// 작업 커스터마이징 관련 함수들
export function getAllJobCustomizations(): JobCustomizations {
  return store.get('jobCustomizations');
}

export function getJobCustomization(jobId: string): JobCustomization | null {
  const customizations = store.get('jobCustomizations');
  return customizations[jobId] || null;
}

export function setJobCustomization(
  jobId: string,
  customization: JobCustomization
): void {
  const customizations = store.get('jobCustomizations');
  customizations[jobId] = customization;
  store.set('jobCustomizations', customizations);
}

export function deleteJobCustomization(jobId: string): void {
  const customizations = store.get('jobCustomizations');
  delete customizations[jobId];
  store.set('jobCustomizations', customizations);
}
