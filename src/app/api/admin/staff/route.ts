import { createStaff, findStaffRow, listStaff } from "@/lib/server/admin";
import { audit } from "@/lib/server/audit";
import { requireStaff } from "@/lib/server/auth";
import { hashSecret } from "@/lib/server/crypto";
import { handle, HttpError, readJson } from "@/lib/server/http";

export async function GET() {
  return handle(async () => {
    await requireStaff("admin");
    return Response.json({ staff: listStaff() });
  });
}

/** POST { name, username, role, password }: the new member must change the password on first login. */
export async function POST(request: Request) {
  return handle(async () => {
    const admin = await requireStaff("admin");
    const body = await readJson(request);
    const name = String(body.name ?? "").trim().slice(0, 60);
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "moderator";

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "নাম লিখুন।";
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) errors.username = "৩–৩০ অক্ষর: ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, _ বা .";
    else if (findStaffRow({ username })) errors.username = "এই ইউজারনেম আগেই আছে।";
    if (password.length < 8) errors.password = "কমপক্ষে ৮ অক্ষর।";
    if (Object.keys(errors).length) throw new HttpError(422, "Invalid staff", errors);

    const staff = createStaff({ name, username, role, passwordHash: hashSecret(password) });
    audit(admin, "staff.create", "staff", staff.id, `${name} (${role})`);
    return Response.json({ staff }, { status: 201 });
  });
}
