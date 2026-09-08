import { NextResponse } from "next/server";
import { env } from "../../lib/env";

const TIMEOUT_MS = 5000;
const UNREACHABLE = { error: "Couldn't reach the server — is the backend running?" };

async function fetchBackend(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${env.backendUrl}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  let res: Response;
  try {
    res = await fetchBackend("/mentors");
  } catch {
    // Network failure, connection refused, or the 5s timeout - the backend
    // never answered at all.
    return NextResponse.json(UNREACHABLE, { status: 502 });
  }
  // The backend answered - even an error status means it's running. Forward
  // its response rather than claiming it's unreachable.
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // The client sent an unparseable body - our fault to report, not the
    // backend's; never contacted it.
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetchBackend("/mentors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(UNREACHABLE, { status: 502 });
  }
  return NextResponse.json(await res.json(), { status: res.status });
}
