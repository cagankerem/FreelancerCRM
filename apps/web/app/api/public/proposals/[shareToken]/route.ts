import { publicProposal } from "@/lib/server/share";
import { apiResult } from "@/lib/server/api-result";
import { SafeError } from "@/lib/server/observability";

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
  return apiResult(
    "proposal.public",
    async () => {
      const { shareToken } = await params;
      const data = await publicProposal(shareToken);
      if (!data) throw new SafeError("NOT_FOUND");
      return data;
    },
    headers,
  );
}
