import { getDatabase } from "./database";
import { deletePhoto, persistPhoto } from "./photoStorage";
import { rescheduleReminders } from "./notificationService";
import { todayString } from "../utils/dateHelper";
import type { Plant, PlantInput, WateringLogEntry } from "../types/plant";

export async function getPlants(): Promise<Plant[]> {
  const db = await getDatabase();
  return db.getAllAsync<Plant>("SELECT * FROM plants ORDER BY name COLLATE NOCASE");
}

export async function getPlant(id: number): Promise<Plant | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Plant>("SELECT * FROM plants WHERE id = ?", id);
}

export async function getWateringLog(plantId: number, limit = 10): Promise<WateringLogEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<WateringLogEntry>(
    "SELECT * FROM watering_log WHERE plant_id = ? ORDER BY watered_date DESC, id DESC LIMIT ?",
    plantId,
    limit
  );
}

/** A new plant counts as freshly watered today. */
export async function addPlant(input: PlantInput): Promise<number> {
  const db = await getDatabase();
  const photoUri = await persistPhoto(input.photoUri);
  const now = new Date().toISOString();
  const today = todayString();

  let plantId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO plants (name, watering_interval_days, photo_uri, created_at, last_watered_date)
       VALUES (?, ?, ?, ?, ?)`,
      input.name.trim(),
      input.wateringIntervalDays,
      photoUri,
      now,
      today
    );
    plantId = result.lastInsertRowId;
    await db.runAsync(
      "INSERT INTO watering_log (plant_id, watered_date, created_at) VALUES (?, ?, ?)",
      plantId,
      today,
      now
    );
  });

  await refreshReminders();
  return plantId;
}

export async function updatePlant(id: number, input: PlantInput): Promise<void> {
  const db = await getDatabase();
  const existing = await getPlant(id);
  if (!existing) throw new Error("This plant no longer exists.");

  const photoUri = await persistPhoto(input.photoUri);
  await db.runAsync(
    "UPDATE plants SET name = ?, watering_interval_days = ?, photo_uri = ? WHERE id = ?",
    input.name.trim(),
    input.wateringIntervalDays,
    photoUri,
    id
  );
  if (existing.photo_uri && existing.photo_uri !== photoUri) {
    deletePhoto(existing.photo_uri);
  }

  await refreshReminders();
}

export async function deletePlant(id: number): Promise<void> {
  const db = await getDatabase();
  const existing = await getPlant(id);
  // watering_log rows go with it (ON DELETE CASCADE).
  await db.runAsync("DELETE FROM plants WHERE id = ?", id);
  deletePhoto(existing?.photo_uri ?? null);
  await refreshReminders();
}

/** Logs a watering for today and resets the plant's timer. */
export async function markWatered(id: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const today = todayString();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE plants SET last_watered_date = ? WHERE id = ?", today, id);
    await db.runAsync(
      "INSERT INTO watering_log (plant_id, watered_date, created_at) VALUES (?, ?, ?)",
      id,
      today,
      now
    );
  });
  await refreshReminders();
}

/** Rebuilds the upcoming morning reminders from the current plant list. */
export async function refreshReminders(): Promise<void> {
  try {
    await rescheduleReminders(await getPlants());
  } catch (error) {
    // Reminders are a nice-to-have; never let them break saving a plant.
    console.warn("[plantService] Couldn't schedule reminders", error);
  }
}
