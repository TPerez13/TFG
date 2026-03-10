export type AvatarPreset = {
  id: string;
  label: string;
  icon: string;
  ringColor: string;
  bgColor: string;
  iconColor: string;
};

export const DEFAULT_AVATAR_ID = 'sprout';

export const avatarPresets: AvatarPreset[] = [
  {
    id: 'sprout',
    label: 'Brote',
    icon: 'leaf',
    ringColor: '#22c55e',
    bgColor: '#d5f2df',
    iconColor: '#0f8a3c',
  },
  {
    id: 'runner',
    label: 'Runner',
    icon: 'walk',
    ringColor: '#0ea5e9',
    bgColor: '#d8effc',
    iconColor: '#0b6fa3',
  },
  {
    id: 'focus',
    label: 'Focus',
    icon: 'moon',
    ringColor: '#8b5cf6',
    bgColor: '#eadffe',
    iconColor: '#5b33b8',
  },
  {
    id: 'strong',
    label: 'Strong',
    icon: 'barbell',
    ringColor: '#f97316',
    bgColor: '#ffe6d5',
    iconColor: '#b74a00',
  },
  {
    id: 'spark',
    label: 'Spark',
    icon: 'sunny',
    ringColor: '#f59e0b',
    bgColor: '#fff0c9',
    iconColor: '#b86b00',
  },
  {
    id: 'classic',
    label: 'Default',
    icon: 'person',
    ringColor: '#34d399',
    bgColor: '#d7e0db',
    iconColor: '#7b8d85',
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const getAvatarPresetById = (avatarId: string | undefined | null): AvatarPreset => {
  const found = avatarPresets.find((preset) => preset.id === avatarId);
  return found ?? avatarPresets.find((preset) => preset.id === DEFAULT_AVATAR_ID) ?? avatarPresets[0];
};

export const getAvatarIdFromPreferences = (preferences: unknown): string => {
  if (!isRecord(preferences)) {
    return DEFAULT_AVATAR_ID;
  }

  const profile = isRecord(preferences.perfil)
    ? (preferences.perfil as Record<string, unknown>)
    : isRecord(preferences.profile)
      ? (preferences.profile as Record<string, unknown>)
      : null;

  const avatarId = profile?.avatarId;
  if (typeof avatarId !== 'string') {
    return DEFAULT_AVATAR_ID;
  }

  return getAvatarPresetById(avatarId).id;
};
