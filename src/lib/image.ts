import type { Item } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/** Downscale/compress photos for faster AI analysis and to reduce localStorage usage. */
export async function resizeDataUrl(
  dataUrl: string,
  maxSize = 1280,
  quality = 0.85,
  forceMime?: "image/jpeg" | "image/png",
): Promise<string> {
  try {
    const image = await loadImage(dataUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return dataUrl;

    const sourceMime = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const mime = forceMime || sourceMime;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const shouldProcess = scale < 1 || (forceMime != null && forceMime !== sourceMime);
    if (!shouldProcess) return dataUrl;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(mime, quality);
  } catch {
    return dataUrl;
  }
}

/** Lightweight local stand-in for the AI cleanup step: makes near-white backdrops transparent. */
export async function cleanBackground(dataUrl: string): Promise<string> {
  try {
    const image = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    ctx.drawImage(image, 0, 0);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);

      if (brightness > 232 && spread < 30) {
        data[i + 3] = 0;
      } else if (brightness > 245 && spread < 50) {
        data[i + 3] = Math.max(0, data[i + 3] - 110);
      }
    }

    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let drawn = 0;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      ctx.fillText(line, x, y + drawn * lineHeight);
      drawn += 1;
      line = word;
      if (drawn >= maxLines) return;
    } else {
      line = trial;
    }
  }
  if (line && drawn < maxLines) ctx.fillText(line, x, y + drawn * lineHeight);
}

/** Builds the outfit's front picture so every item in the look appears in one image. */
export async function buildOutfitCover(
  items: Item[],
  lookNumber = 1,
  styleLabel = "Curated",
  stylistNote = "",
): Promise<string> {
  const width = 600;
  const height = 760;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#FAF0E6";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#4682B4";
  ctx.fillRect(0, 0, width, 66);
  ctx.fillStyle = "#FFF8DC";
  ctx.font = "700 21px Arial, sans-serif";
  ctx.fillText("ARMOIRE", 26, 42);
  ctx.textAlign = "right";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText(`LOOK ${String(lookNumber).padStart(2, "0")}  /  ${styleLabel.toUpperCase()}`, width - 26, 41);
  ctx.textAlign = "left";

  const count = Math.max(items.length, 1);
  const columns = count > 4 ? 3 : 2;
  const rows = Math.ceil(count / columns);
  const pad = 26;
  const gap = 14;
  const footerHeight = stylistNote ? 92 : 62;
  const cellW = (width - pad * 2 - gap * (columns - 1)) / columns;
  const cellH = (height - 66 - footerHeight - pad - gap * (rows - 1)) / rows;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const x = pad + (index % columns) * (cellW + gap);
    const y = 66 + pad + Math.floor(index / columns) * (cellH + gap);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeStyle = "#D8E4F0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);

    try {
      const image = await loadImage(item.image);
      const maxW = cellW - 20;
      const maxH = cellH - 44;
      const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
      const drawW = image.naturalWidth * scale;
      const drawH = image.naturalHeight * scale;
      ctx.drawImage(image, x + (cellW - drawW) / 2, y + 12 + (maxH - drawH) / 2, drawW, drawH);
    } catch {
      // Leave the white tile if an image can't be drawn.
    }

    ctx.fillStyle = "#26619C";
    ctx.font = "11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.category.toUpperCase().slice(0, 20), x + cellW / 2, y + cellH - 14);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "#FFF8DC";
  ctx.fillRect(0, height - footerHeight, width, footerHeight);
  ctx.fillStyle = "#4682B4";
  ctx.font = "700 14px Arial, sans-serif";
  ctx.fillText("CURATED BY AI", 26, height - footerHeight + 25);
  ctx.textAlign = "right";
  ctx.font = "11px Arial, sans-serif";
  ctx.fillText(`${count} PIECES IN THIS LOOK`, width - 26, height - footerHeight + 25);
  ctx.textAlign = "left";
  if (stylistNote) {
    ctx.fillStyle = "#46607a";
    ctx.font = "11px Arial, sans-serif";
    wrapText(ctx, stylistNote, 26, height - footerHeight + 47, width - 52, 15, 2);
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}
