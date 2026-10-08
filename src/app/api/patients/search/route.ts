import { getUser } from "@/lib/session";
import { searchPatients } from "@/lib/data";

export async function GET(request: Request) {
  if (!(await getUser())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(await searchPatients(q));
}
