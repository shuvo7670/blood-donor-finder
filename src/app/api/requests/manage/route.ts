import type { NextRequest } from "next/server";
import { clientIp, handle, HttpError, rateLimit, readJson } from "@/lib/server/http";
import { findRequestWithToken, listResponses, setRequestStatus } from "@/lib/server/requests";

/** GET /api/requests/manage?id=&token= : the requester's own view, with donor responses. */
export async function GET(request: NextRequest) {
  return handle(() => {
    rateLimit(`manage:${clientIp(request)}`, 60, 60 * 1000);
    const sp = request.nextUrl.searchParams;
    const found = findRequestWithToken(sp.get("id") ?? "", sp.get("token") ?? "");
    if (!found) throw new HttpError(404, "লিংকটি সঠিক নয় বা অনুরোধটি মুছে ফেলা হয়েছে।");
    return Response.json({ request: found, responses: listResponses(found.id) });
  });
}

/** PATCH { id, token, status: "fulfilled" | "closed" | "open" } */
export async function PATCH(request: NextRequest) {
  return handle(async () => {
    rateLimit(`manage:${clientIp(request)}`, 60, 60 * 1000);
    const body = await readJson(request);
    const found = findRequestWithToken(String(body.id ?? ""), String(body.token ?? ""));
    if (!found) throw new HttpError(404, "লিংকটি সঠিক নয়।");

    const status = body.status;
    if (status !== "fulfilled" && status !== "closed" && status !== "open") throw new HttpError(400, "Invalid status");
    // The requester can only move between their own states; moderation decisions stay put.
    if (found.status === "pending" || found.status === "rejected") {
      throw new HttpError(409, "অনুমোদনের আগে অবস্থা পরিবর্তন করা যাবে না।");
    }
    setRequestStatus(found.id, status);
    return Response.json({ request: { ...found, status } });
  });
}
