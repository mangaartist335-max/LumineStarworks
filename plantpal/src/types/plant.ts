export interface Plant {
  id: number;
  name: string;
  watering_interval_days: number;
  photo_uri: string | null;
  created_at: string;
  /** Local calendar date, YYYY-MM-DD. */
  last_watered_date: string;
}

export interface WateringLogEntry {
  id: number;
  plant_id: number;
  /** Local calendar date, YYYY-MM-DD. */
  watered_date: string;
  created_at: string;
}

export type PlantStatus = "overdue" | "dueToday" | "watered";

export interface PlantInput {
  name: string;
  wateringIntervalDays: number;
  photoUri: string | null;
}
