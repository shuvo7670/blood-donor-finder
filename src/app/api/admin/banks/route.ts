import { createBank, listBanks } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { handle, HttpError, readJson } from "@/lib/server/http";
import { validateBank } from "@/lib/validate";

export async function GET() {
  return handle(async () => {
    await requireStaff();
    return Response.json({ banks: listBanks({ includeInactive: true }) });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const staff = await requireStaff();
    const parsed = validateBank(await readJson(request));
    if (!parsed.ok) throw new HttpError(422, "Invalid blood bank", parsed.errors);
    const bank = createBank(parsed.value);
    audit(staff, "bank.create", "bank", bank.id, bank.name);
    return Response.json({ bank }, { status: 201 });
  });
}
