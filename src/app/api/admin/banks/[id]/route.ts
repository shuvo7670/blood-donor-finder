import type { NextRequest } from "next/server";
import { deleteBank, findBank, updateBank } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle, HttpError, readJson } from "@/lib/server/http";
import { validateBank } from "@/lib/validate";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/banks/[id]">) {
  return handle(async () => {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    if (!findBank(id)) throw new HttpError(404, "Blood bank not found");
    const parsed = validateBank(await readJson(request));
    if (!parsed.ok) throw new HttpError(422, "Invalid blood bank", parsed.errors);
    updateBank(id, parsed.value);
    audit(staff, "bank.update", "bank", id, parsed.value.name);
    return Response.json({ bank: findBank(id) });
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/banks/[id]">) {
  return handle(async () => {
    const staff = await requireStaff("admin");
    const { id } = await ctx.params;
    const bank = findBank(id);
    if (!bank) throw new HttpError(404, "Blood bank not found");
    deleteBank(id);
    audit(staff, "bank.delete", "bank", id, bank.name);
    return Response.json({ ok: true });
  });
}
