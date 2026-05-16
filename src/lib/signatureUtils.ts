export function trimSignatureCanvas(originalCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    console.error("Could not get canvas context");
    return originalCanvas;
  }

  const width = originalCanvas.width;
  const height = originalCanvas.height;
  const pixels = ctx.getImageData(0, 0, width, height);
  const l = pixels.data.length;
  
  const bound = {
    top: null as number | null,
    left: null as number | null,
    right: null as number | null,
    bottom: null as number | null
  };
  
  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null) bound.left = x;
      else if (x < bound.left) bound.left = x;
      if (bound.right === null) bound.right = x;
      else if (bound.right < x) bound.right = x;
      if (bound.bottom === null || bound.bottom < y) bound.bottom = y;
    }
  }

  if (bound.top === null) return originalCanvas; // Empty canvas

  const tHeight = (bound.bottom ?? 0) - (bound.top ?? 0) + 1;
  const tWidth = (bound.right ?? 0) - (bound.left ?? 0) + 1;

  const trimmedData = ctx.getImageData(bound.left ?? 0, bound.top ?? 0, tWidth, tHeight);

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = tWidth;
  resultCanvas.height = tHeight;
  const resultCtx = resultCanvas.getContext('2d');
  if (resultCtx) {
    resultCtx.putImageData(trimmedData, 0, 0);
  }

  return resultCanvas;
}
