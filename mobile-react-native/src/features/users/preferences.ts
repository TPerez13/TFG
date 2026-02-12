import type { PrivacyPreferences } from '@muchasvidas/shared';

export type PreferencesMap = Record<string, unknown>;
export type PreferencesPatch = Partial<PreferencesMap>;

export const defaultPrivacyPreferences: PrivacyPreferences = {
  analyticsEnabled: true,
  personalizationEnabled: true,
  lockScreenContent: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const boolFrom = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

export const normalizePrivacyPreferences = (value: unknown): PrivacyPreferences => {
  if (!isRecord(value)) {
    return defaultPrivacyPreferences;
  }

  return {
    analyticsEnabled: boolFrom(
      value.analyticsEnabled ?? value.permitirAnalitica,
      defaultPrivacyPreferences.analyticsEnabled
    ),
    personalizationEnabled: boolFrom(
      value.personalizationEnabled ?? value.personalizacion,
      defaultPrivacyPreferences.personalizationEnabled
    ),
    lockScreenContent: boolFrom(
      value.lockScreenContent ?? value.mostrarContenidoEnPantallaBloqueada,
      defaultPrivacyPreferences.lockScreenContent
    ),
  };
};

export const hasCompletePrivacyPreferences = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const normalized = normalizePrivacyPreferences(value);

  return (
    typeof normalized.analyticsEnabled === 'boolean' &&
    typeof normalized.personalizationEnabled === 'boolean' &&
    typeof normalized.lockScreenContent === 'boolean'
  );
};

export const mergePreferences = (
  current: Record<string, unknown> | null | undefined,
  patch: PreferencesPatch
): PreferencesMap => {
  const base = isRecord(current) ? current : {};
  const next = isRecord(patch) ? patch : {};

  const basePrivacy = isRecord(base.privacidad) ? base.privacidad : {};
  const patchPrivacy = isRecord(next.privacidad) ? next.privacidad : {};

  return {
    ...base,
    ...next,
    privacidad: {
      ...basePrivacy,
      ...patchPrivacy,
    },
  };
};
