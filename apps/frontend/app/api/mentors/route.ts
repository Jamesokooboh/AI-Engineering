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
  try {
    const res = await fetchBackend("/mentors");
    if (!res.ok) {
      return NextResponse.json(UNREACHABLE, { status: 502 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(UNREACHABLE, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetchBackend("/mentors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json(UNREACHABLE, { status: 502 });
  }
}
