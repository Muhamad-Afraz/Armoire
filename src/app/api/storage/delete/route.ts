import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: "Blob storage is not configured." }, { status: 501 });
    }

    const body = (await request.json()) as { url?: string | string[] };
    const urls = Array.isArray(body.url) ? body.url : body.url ? [body.url] : [];
    const valid = urls.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u));
    if (!valid.length) {
      return NextResponse.json({ ok: false, error: "A valid blob URL is required." }, { status: 400 });
    }

    await del(valid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
