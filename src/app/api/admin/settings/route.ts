import { audit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle, readJson } from "@/lib/server/http";
import { getSettings, saveSettings } from "@/lib/server/settings";
import type { Settings } from "@/lib/types";

export async function GET() {
  return handle(async () => {
    await requireStaff();
    return Response.json({ settings: getSettings() });
  });
}

/** PUT { autoApproveDonors?, autoApproveRequests?, announcement? }: admins only. */
export async function PUT(request: Request) {
  return handle(async () => {
    const admin = await requireStaff("admin");
    const body = await readJson(request);
    const patch: Partial<Settings> = {};
    if (typeof body.autoApproveDonors === "boolean") patch.autoApproveDonors = body.autoApproveDonors;
    if (typeof body.autoApproveRequests === "boolean") patch.autoApproveRequests = body.autoApproveRequests;
    if (typeof body.announcement === "string") patch.announcement = body.announcement.trim().slice(0, 300);
    saveSettings(patch);
    audit(admin, "settings.update", "settings", "-", JSON.stringify(patch));
    return Response.json({ settings: getSettings() });
  });
}
