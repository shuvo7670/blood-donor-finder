import { requireDonorId } from "@/lib/server/auth";
import { addDonation, findDonor, listDonations, toDetail } from "@/lib/server/donors";
import { handle, HttpError, readJson } from "@/lib/server/http";
import { validateDate } from "@/lib/validate";

/** POST /api/me/donations { date, place?, note? }: logs a donation; lastDonation follows. */
export async function POST(request: Request) {
  return handle(async () => {
    const id = await requireDonorId();
    const body = await readJson(request);
    const date = validateDate(body.date);
    if (!date) throw new HttpError(422, "Invalid date", { date: "সঠিক তারিখ দিন (ভবিষ্যতের নয়)।" });
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    addDonation(id, date, str(body.place, 100), str(body.note, 200));
    return Response.json({ donor: toDetail(findDonor(id)!), donations: listDonations(id) }, { status: 201 });
  });
}
