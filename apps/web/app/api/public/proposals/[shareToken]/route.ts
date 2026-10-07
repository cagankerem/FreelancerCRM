import { NextResponse } from "next/server";
import { publicProposal } from "@/lib/server/share";

export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const data = await publicProposal(shareToken);
  return data
    ? NextResponse.json(data, { headers })
    : NextResponse.json({ error: "not_found" }, { status: 404, headers });
}
