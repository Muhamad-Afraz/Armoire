import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  try {
    return { contentType: match[1], buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

function extFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ ok: false, error: "Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing)." }, { status: 501 });
    }

    const body = (await request.json()) as { dataUrl?: string; pathname?: string };
    const parsed = body.dataUrl ? parseDataUrl(body.dataUrl) : null;
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "A valid image data URL is required." }, { status: 400 });
    }

    const safeBase = (body.pathname || "armoire/upload")
      .replace(/[^a-zA-Z0-9._/-]+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/+/, "");
    const ext = extFromContentType(parsed.contentType);
    const pathname = safeBase.includes(".") ? safeBase : `${safeBase}.${ext}`;

    const blob = await put(pathname, parsed.buffer, {
      access: "public",
      contentType: parsed.contentType,
      addRandomSuffix: true,
    });

    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
