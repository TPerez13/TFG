import type { AchievementId } from "@muchasvidas/shared";
import { ACHIEVEMENT_DEFINITIONS } from "@muchasvidas/shared";
import bcrypt from "bcryptjs";
import { pool } from "../db";
import { syncAchievementCatalog } from "../model/achievementModel";
import { createNutritionEntryForUser } from "../model/nutritionModel";
import { getAchievementsForUser } from "../service/achievementService";
import { getDefaultNotificationSettings } from "../service/notificationSettingsService";

type SeedUserDefinition = {
  correo: string;
  nombre: string;
  preferencias: Record<string, unknown>;
};

type InsertedSeedUser = SeedUserDefinition & {
  id: number;
};

type SeedMealType = "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK";

type FoodKey = keyof typeof FOOD_BY_NAME;

type SeedAchievementSummary = {
  correo: string;
  nombre: string;
  unlockedIds: AchievementId[];
};

const SEED_PASSWORD = "seed123";
const SEED_EMAILS = [
  "alba.seed@muchasvidas.com",
  "bruno.seed@muchasvidas.com",
  "carla.seed@muchasvidas.com",
  "diego.seed@muchasvidas.com",
  "elena.seed@muchasvidas.com",
] as const;

const FOOD_BY_NAME = {
  tostadas: "Tostadas con aguacate",
  sandwich: "Sandwich integral de pavo",
  salmon: "Salmon al horno",
  lentejas: "Lentejas guisadas",
  avena: "Avena con frutas",
} as const;

const isoAtDaysAgo = (daysAgo: number, hour: number, minute = 0): string => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const buildPreferences = (
  input: {
    theme: "system" | "light" | "dark";
    language: "es" | "en";
    avatarId: string;
    privacy: {
      analyticsEnabled: boolean;
      personalizationEnabled: boolean;
      lockScreenContent: boolean;
    };
    goals: {
      agua: { value: number; unit: string };
      comidas: { value: number; unit: string };
      ejercicio: { value: number; unit: string };
      sueno: { value: number; unit: string };
      meditacion: { value: number; unit: string };
    };
    notifications: ReturnType<typeof getDefaultNotificationSettings>;
    quietHours: {
      desde: string;
      hasta: string;
    };
  }
): Record<string, unknown> => ({
  tema: input.theme,
  idioma: input.language,
  perfil: {
    avatarId: input.avatarId,
  },
  privacidad: input.privacy,
  goals: input.goals,
  quiet_hours: input.quietHours,
  notificaciones: input.notifications,
});

const seedUsers: SeedUserDefinition[] = [
  {
    correo: SEED_EMAILS[0],
    nombre: "Alba",
    preferencias: buildPreferences({
      theme: "system",
      language: "es",
      avatarId: "sprout",
      privacy: {
        analyticsEnabled: true,
        personalizationEnabled: true,
        lockScreenContent: false,
      },
      goals: {
        agua: { value: 2000, unit: "ml" },
        comidas: { value: 4, unit: "platos" },
        ejercicio: { value: 45, unit: "min" },
        sueno: { value: 8, unit: "h" },
        meditacion: { value: 10, unit: "min" },
      },
      notifications: {
        ...getDefaultNotificationSettings(),
        habits: {
          ...getDefaultNotificationSettings().habits,
          hidratacion: { enabled: true, time: "09:00", lastCompletedDate: null },
          meditacion: { enabled: false, time: "20:30", lastCompletedDate: null },
        },
      },
      quietHours: {
        desde: "23:00",
        hasta: "07:00",
      },
    }),
  },
  {
    correo: SEED_EMAILS[1],
    nombre: "Bruno Impulso",
    preferencias: buildPreferences({
      theme: "light",
      language: "es",
      avatarId: "runner",
      privacy: {
        analyticsEnabled: true,
        personalizationEnabled: false,
        lockScreenContent: false,
      },
      goals: {
        agua: { value: 2200, unit: "ml" },
        comidas: { value: 4, unit: "platos" },
        ejercicio: { value: 30, unit: "min" },
        sueno: { value: 8, unit: "h" },
        meditacion: { value: 10, unit: "min" },
      },
      notifications: {
        ...getDefaultNotificationSettings(),
        habits: {
          ...getDefaultNotificationSettings().habits,
          ejercicio: { enabled: true, time: "19:15", lastCompletedDate: null },
        },
      },
      quietHours: {
        desde: "22:30",
        hasta: "06:30",
      },
    }),
  },
  {
    correo: SEED_EMAILS[2],
    nombre: "Carla Semana Perfecta",
    preferencias: buildPreferences({
      theme: "dark",
      language: "en",
      avatarId: "focus",
      privacy: {
        analyticsEnabled: false,
        personalizationEnabled: false,
        lockScreenContent: true,
      },
      goals: {
        agua: { value: 500, unit: "ml" },
        comidas: { value: 1, unit: "platos" },
        ejercicio: { value: 10, unit: "min" },
        sueno: { value: 7, unit: "h" },
        meditacion: { value: 5, unit: "min" },
      },
      notifications: {
        ...getDefaultNotificationSettings(),
        global: {
          ...getDefaultNotificationSettings().global,
          quietHoursEnabled: true,
          quietFrom: "21:30",
          quietTo: "06:45",
        },
        habits: {
          ...getDefaultNotificationSettings().habits,
          sueno: { enabled: true, time: "21:45", lastCompletedDate: null },
          meditacion: { enabled: true, time: "06:50", lastCompletedDate: null },
        },
      },
      quietHours: {
        desde: "21:30",
        hasta: "06:45",
      },
    }),
  },
  {
    correo: SEED_EMAILS[3],
    nombre: "Diego Constancia",
    preferencias: buildPreferences({
      theme: "light",
      language: "es",
      avatarId: "spark",
      privacy: {
        analyticsEnabled: true,
        personalizationEnabled: true,
        lockScreenContent: true,
      },
      goals: {
        agua: { value: 600, unit: "ml" },
        comidas: { value: 1, unit: "platos" },
        ejercicio: { value: 15, unit: "min" },
        sueno: { value: 7, unit: "h" },
        meditacion: { value: 5, unit: "min" },
      },
      notifications: {
        ...getDefaultNotificationSettings(),
        global: {
          ...getDefaultNotificationSettings().global,
          summaryTime: "07:30",
        },
        habits: {
          ...getDefaultNotificationSettings().habits,
          hidratacion: { enabled: true, time: "09:00", lastCompletedDate: null },
          nutricion: { enabled: true, time: "14:00", lastCompletedDate: null },
          ejercicio: { enabled: true, time: "18:00", lastCompletedDate: null },
          meditacion: { enabled: true, time: "20:00", lastCompletedDate: null },
        },
      },
      quietHours: {
        desde: "23:30",
        hasta: "07:00",
      },
    }),
  },
  {
    correo: SEED_EMAILS[4],
    nombre: "Elena Leyenda",
    preferencias: buildPreferences({
      theme: "system",
      language: "es",
      avatarId: "strong",
      privacy: {
        analyticsEnabled: false,
        personalizationEnabled: true,
        lockScreenContent: false,
      },
      goals: {
        agua: { value: 1000, unit: "ml" },
        comidas: { value: 4, unit: "platos" },
        ejercicio: { value: 20, unit: "min" },
        sueno: { value: 8, unit: "h" },
        meditacion: { value: 10, unit: "min" },
      },
      notifications: {
        ...getDefaultNotificationSettings(),
        global: {
          ...getDefaultNotificationSettings().global,
          enabled: false,
        },
      },
      quietHours: {
        desde: "00:00",
        hasta: "07:30",
      },
    }),
  },
];

async function fetchFoodIdsByName(): Promise<Record<string, number>> {
  const result = await pool.query<{ id_alimento: number; nombre: string }>(
    `SELECT id_alimento, nombre
       FROM alimento
      WHERE nombre = ANY($1::text[])`,
    [Object.values(FOOD_BY_NAME)]
  );

  return result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.nombre] = row.id_alimento;
    return acc;
  }, {});
}

async function recreateSeedUsers(): Promise<InsertedSeedUser[]> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  await pool.query("DELETE FROM usuario WHERE correo = ANY($1::text[])", [[...SEED_EMAILS]]);

  const inserted: InsertedSeedUser[] = [];
  for (const user of seedUsers) {
    const result = await pool.query<{ id_usuario: number }>(
      `INSERT INTO usuario (correo, nombre, hash_clave, preferencias)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id_usuario`,
      [user.correo, user.nombre, passwordHash, JSON.stringify(user.preferencias)]
    );

    inserted.push({
      ...user,
      id: result.rows[0].id_usuario,
    });
  }

  return inserted;
}

async function insertHabitEntry(
  userId: number,
  typeId: number,
  value: number,
  unit: string,
  dateTimeIso: string,
  notes: string
): Promise<void> {
  await pool.query(
    `INSERT INTO registro_habito (
        id_usuario,
        id_tipo_habito,
        f_registro,
        valor,
        unidad,
        notas
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, typeId, dateTimeIso, value, unit, notes]
  );
}

async function insertNotification(
  userId: number,
  title: string,
  body: string,
  type: "SYSTEM" | "ACHIEVEMENT",
  createdAtIso: string
): Promise<void> {
  await pool.query(
    `INSERT INTO notificacion (
        id_usuario,
        titulo,
        cuerpo,
        tipo,
        leida,
        f_leida,
        f_programada,
        f_envio,
        estado,
        metadatos,
        deep_link,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $12)`,
    [
      userId,
      title,
      body,
      type,
      type === "SYSTEM",
      type === "SYSTEM" ? createdAtIso : null,
      createdAtIso,
      createdAtIso,
      "enviada",
      JSON.stringify({ seeded: true }),
      null,
      createdAtIso,
    ]
  );
}

async function addNutritionMeal(
  userId: number,
  mealType: SeedMealType,
  foodIds: Record<string, number>,
  foodKey: FoodKey,
  dateTimeIso: string
): Promise<void> {
  const foodName = FOOD_BY_NAME[foodKey];
  await createNutritionEntryForUser(userId, {
    tipoComida: mealType,
    alimentoId: foodIds[foodName],
    nombre: foodName,
    fRegistro: dateTimeIso,
  });
}

async function addHydration(
  userId: number,
  dayAgo: number,
  ml: number,
  hour: number,
  minute: number,
  notes: string
): Promise<void> {
  await insertHabitEntry(userId, 1, ml, "ml", isoAtDaysAgo(dayAgo, hour, minute), notes);
}

async function addExercise(
  userId: number,
  dayAgo: number,
  minutes: number,
  hour: number,
  minute: number,
  notes: string
): Promise<void> {
  await insertHabitEntry(userId, 3, minutes, "min", isoAtDaysAgo(dayAgo, hour, minute), notes);
}

async function addSleep(
  userId: number,
  dayAgo: number,
  hours: number,
  hour: number,
  minute: number,
  notes: string
): Promise<void> {
  await insertHabitEntry(userId, 4, hours, "h", isoAtDaysAgo(dayAgo, hour, minute), notes);
}

async function addMeditation(
  userId: number,
  dayAgo: number,
  minutes: number,
  hour: number,
  minute: number,
  notes: string
): Promise<void> {
  await insertHabitEntry(userId, 5, minutes, "min", isoAtDaysAgo(dayAgo, hour, minute), notes);
}

async function addPerfectDay(
  userId: number,
  foodIds: Record<string, number>,
  dayAgo: number,
  foodKey: FoodKey,
  variantLabel: string
): Promise<void> {
  await addHydration(userId, dayAgo, 700, 8, 0, `Hidratacion ${variantLabel}.`);
  await addNutritionMeal(
    userId,
    "ALMUERZO",
    foodIds,
    foodKey,
    isoAtDaysAgo(dayAgo, 14, 0)
  );
  await addExercise(userId, dayAgo, 18, 18, 30, `Ejercicio ${variantLabel}.`);
  await addSleep(userId, dayAgo, 7.5, 22, 15, `Descanso ${variantLabel}.`);
  await addMeditation(userId, dayAgo, 8, 21, 0, `Meditacion ${variantLabel}.`);
}

async function addStrongDayWithoutMeditation(
  userId: number,
  foodIds: Record<string, number>,
  dayAgo: number,
  foodKey: FoodKey,
  variantLabel: string
): Promise<void> {
  await addHydration(userId, dayAgo, 700, 8, 5, `Hidratacion ${variantLabel}.`);
  await addNutritionMeal(
    userId,
    "ALMUERZO",
    foodIds,
    foodKey,
    isoAtDaysAgo(dayAgo, 14, 5)
  );
  await addExercise(userId, dayAgo, 18, 18, 0, `Ejercicio ${variantLabel}.`);
  await addSleep(userId, dayAgo, 7.25, 22, 0, `Descanso ${variantLabel}.`);
}

async function addWaterExerciseDay(
  userId: number,
  dayAgo: number,
  variantLabel: string
): Promise<void> {
  await addHydration(userId, dayAgo, 1200, 8, 0, `Rutina de agua ${variantLabel}.`);
  await addExercise(userId, dayAgo, 25, 19, 0, `Rutina activa ${variantLabel}.`);
}

async function seedAlba(user: InsertedSeedUser): Promise<void> {
  await addHydration(user.id, 0, 300, 9, 0, "Primer vaso del dia.");
}

async function seedBruno(user: InsertedSeedUser): Promise<void> {
  const days = [4, 3, 2, 1, 0];
  for (const day of days) {
    await addExercise(user.id, day, 15, 18, 0, "Activacion ligera.");
    await addExercise(user.id, day, 20, 19, 10, "Bloque principal.");
  }
}

async function seedCarla(
  user: InsertedSeedUser,
  foodIds: Record<string, number>
): Promise<void> {
  const foodRotation: FoodKey[] = [
    "avena",
    "sandwich",
    "tostadas",
    "salmon",
    "lentejas",
    "sandwich",
    "avena",
  ];

  for (let index = 0; index < 7; index += 1) {
    await addPerfectDay(user.id, foodIds, 6 - index, foodRotation[index], `de la semana ${index + 1}`);
  }
}

async function seedDiego(
  user: InsertedSeedUser,
  foodIds: Record<string, number>
): Promise<void> {
  const foodRotation: FoodKey[] = ["sandwich", "tostadas", "lentejas", "salmon", "avena"];

  for (let day = 14; day >= 0; day -= 1) {
    const foodKey = foodRotation[day % foodRotation.length];

    if (day <= 5) {
      await addPerfectDay(user.id, foodIds, day, foodKey, `perfecto ${15 - day}`);
      continue;
    }

    await addStrongDayWithoutMeditation(user.id, foodIds, day, foodKey, `constante ${15 - day}`);
  }
}

async function seedElena(user: InsertedSeedUser): Promise<void> {
  for (let day = 59; day >= 0; day -= 1) {
    await addWaterExerciseDay(user.id, day, `de leyenda ${60 - day}`);
  }
}

async function finalizeAchievementsAndNotifications(
  users: InsertedSeedUser[]
): Promise<SeedAchievementSummary[]> {
  const summaries: SeedAchievementSummary[] = [];

  for (const user of users) {
    const achievements = await getAchievementsForUser(user.id);
    const unlockedIds = achievements.achievements
      .filter((item) => item.unlocked)
      .map((item) => item.id);
    const latestUnlocked = achievements.achievements
      .filter((item) => item.unlocked)
      .sort((left, right) => {
        const leftTime = left.unlockedAt ? new Date(left.unlockedAt).getTime() : 0;
        const rightTime = right.unlockedAt ? new Date(right.unlockedAt).getTime() : 0;
        return rightTime - leftTime;
      })[0];

    summaries.push({
      correo: user.correo,
      nombre: user.nombre,
      unlockedIds,
    });

    await insertNotification(
      user.id,
      "Datos demo cargados",
      "Este usuario fue generado por la semilla con habitos, preferencias y logros reales.",
      "SYSTEM",
      isoAtDaysAgo(0, 7, 0)
    );

    if (latestUnlocked) {
      await insertNotification(
        user.id,
        `Logro desbloqueado: ${latestUnlocked.title}`,
        latestUnlocked.description,
        "ACHIEVEMENT",
        isoAtDaysAgo(0, 7, 30)
      );
    }
  }

  return summaries;
}

async function main(): Promise<void> {
  console.log("Preparando datos de demostracion...");
  await syncAchievementCatalog(ACHIEVEMENT_DEFINITIONS);

  const users = await recreateSeedUsers();
  const foodIds = await fetchFoodIdsByName();

  await seedAlba(users[0]);
  await seedBruno(users[1]);
  await seedCarla(users[2], foodIds);
  await seedDiego(users[3], foodIds);
  await seedElena(users[4]);

  const summaries = await finalizeAchievementsAndNotifications(users);

  console.log("");
  console.log("Seed completado.");
  console.log(`Contrasena comun para los 5 usuarios: ${SEED_PASSWORD}`);
  summaries.forEach((summary) => {
    console.log(`- ${summary.nombre}: ${summary.correo}`);
    console.log(`  Logros: ${summary.unlockedIds.join(", ") || "(sin logros)"}`);
  });
}

main()
  .catch((error) => {
    console.error("Error ejecutando la seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
