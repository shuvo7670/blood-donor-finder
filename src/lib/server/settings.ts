import type { Settings } from "@/lib/types";
import { all, run } from "./sqlite";

const DEFAULTS: Settings = { autoApproveDonors: false, autoApproveRequests: false, announcement: "" };

export function getSettings(): Settings {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    autoApproveDonors: map.autoApproveDonors === undefined ? DEFAULTS.autoApproveDonors : map.autoApproveDonors === "1",
    autoApproveRequests: map.autoApproveRequests === undefined ? DEFAULTS.autoApproveRequests : map.autoApproveRequests === "1",
    announcement: map.announcement ?? DEFAULTS.announcement,
  };
}

export function saveSettings(patch: Partial<Settings>) {
  for (const [key, value] of Object.entries(patch)) {
    const stored = typeof value === "boolean" ? (value ? "1" : "0") : String(value);
    run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, stored]);
  }
}
