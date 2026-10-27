"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { AS_OF_COOKIE, parseAsOfInput } from "@/lib/time";

/** Travel to another archive moment. The current page re-renders in place. */
export async function setAsOf(formData: FormData) {
  const preset = formData.get("asof");
  const date = formData.get("date");
  const time = formData.get("time");
  let raw: string | null = null;
  if (typeof preset === "string" && preset) raw = preset;
  else if (typeof date === "string" && date) raw = typeof time === "string" && time ? `${date}T${time}` : `${date}T12:00`;
  const parsed = parseAsOfInput(raw);
  if (!parsed) return;
  const jar = await cookies();
  jar.set(AS_OF_COOKIE, parsed, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  refresh();
}
