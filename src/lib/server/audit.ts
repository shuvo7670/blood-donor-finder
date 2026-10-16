import type { AuditEntry, Staff } from "@/lib/types";
import { all, insert, nowIso } from "./sqlite";

export function audit(actor: Pick<Staff, "id" | "name">, action: string, targetType: string, targetId: string, detail = "") {
  insert("audit", { actorId: actor.id, actorName: actor.name, action, targetType, targetId, detail, createdAt: nowIso() });
}

export function listAudit(limit = 200, targetType?: string): AuditEntry[] {
  return targetType
    ? all<AuditEntry>("SELECT * FROM audit WHERE targetType = ? ORDER BY id DESC LIMIT ?", [targetType, limit])
    : all<AuditEntry>("SELECT * FROM audit ORDER BY id DESC LIMIT ?", [limit]);
}
