import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAchievementShareContent,
  selectTopUnlockedAchievement,
  type AchievementItem,
} from '@muchasvidas/shared';

const createAchievement = (
  overrides: Partial<AchievementItem> & Pick<AchievementItem, 'id' | 'title'>,
): AchievementItem => ({
  id: overrides.id,
  title: overrides.title,
  description: overrides.description ?? '',
  icon: overrides.icon ?? 'medal-outline',
  points: overrides.points ?? 10,
  difficulty: overrides.difficulty ?? 10,
  sharePriority: overrides.sharePriority ?? 10,
  unlocked: overrides.unlocked ?? false,
  unlockedAt: overrides.unlockedAt ?? null,
  progress: overrides.progress ?? {
    current: 0,
    target: 1,
  },
});

describe('achievement sharing helpers', () => {
  it('selects the highest-priority unlocked achievement for the selected month', () => {
    const achievements: AchievementItem[] = [
      createAchievement({
        id: 'STREAK_3',
        title: 'Racha de 3 dias',
        difficulty: 25,
        sharePriority: 20,
        unlocked: true,
        unlockedAt: '2026-03-04T12:00:00.000Z',
        progress: { current: 3, target: 3 },
      }),
      createAchievement({
        id: 'MONTH_70',
        title: 'Mes consistente',
        difficulty: 80,
        sharePriority: 80,
        unlocked: true,
        unlockedAt: '2026-03-29T12:00:00.000Z',
        progress: { current: 70, target: 70 },
      }),
      createAchievement({
        id: 'HABIT_MASTER',
        title: 'Maestro del habito',
        difficulty: 100,
        sharePriority: 100,
        unlocked: true,
        unlockedAt: '2026-02-20T12:00:00.000Z',
        progress: { current: 30, target: 30 },
      }),
    ];

    const selected = selectTopUnlockedAchievement(achievements, new Date('2026-03-01T12:00:00.000Z'));

    assert.equal(selected?.id, 'MONTH_70');
  });

  it('builds a month-specific share message from the central definition', () => {
    const content = buildAchievementShareContent(
      createAchievement({
        id: 'HABIT_MASTER',
        title: 'Maestro del habito',
        points: 100,
        difficulty: 100,
        sharePriority: 100,
        unlocked: true,
        unlockedAt: '2026-03-18T18:00:00.000Z',
        progress: { current: 30, target: 30 },
      }),
      {
        monthLabel: 'Marzo 2026',
        contextTitle: 'Logro del mes',
      },
    );

    assert.equal(content.title, 'Logro del mes');
    assert.match(content.message, /Logro destacado de Marzo 2026/);
    assert.match(content.message, /Maestro del habito/);
    assert.match(content.message, /Dificultad: 100\/100\./);
    assert.match(content.message, /Puntos: 100\./);
  });
});
