let blobUploadsUnavailable = false;

export function isRemoteUrl(value: string | undefined | null): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function isDataUrl(value: string | undefined | null): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

export async function uploadDataUrl(dataUrl: string, pathname: string): Promise<string | null> {
  if (!isDataUrl(dataUrl)) return isRemoteUrl(dataUrl) ? dataUrl : null;
  if (blobUploadsUnavailable) return null;
  try {
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, pathname }),
    });
    const json = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
    if (response.ok && json.ok && typeof json.url === "string") {
      return json.url;
    }
    // If blob storage isn't configured, stop retrying on every image/load.
    if (response.status === 501 || (typeof json.error === "string" && json.error.toLowerCase().includes("not configured"))) {
      blobUploadsUnavailable = true;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteRemoteUrls(urls: string[]): Promise<void> {
  const valid = urls.filter((u) => isRemoteUrl(u));
  if (!valid.length) return;
  try {
    await fetch("/api/storage/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: valid }),
    });
  } catch {
    // best-effort cleanup
  }
}
