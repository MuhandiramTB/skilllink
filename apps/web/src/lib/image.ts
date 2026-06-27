'use client';

/** Allowed image types for uploads (NIC, selfie, certificate, avatar). */
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB raw file limit

export class ImageError extends Error {}

/**
 * Validate a picked image (type + size), then downscale + JPEG-compress it to a
 * compact data URL that stores cleanly in the DB and renders with no network call.
 * Throws ImageError with a user-facing message on invalid input.
 *
 * @param maxDim longest-edge target in px (160 for avatars, ~1000 for documents
 *               so the admin can still read a NIC/certificate).
 */
export async function fileToDataUrl(file: File, maxDim = 1000): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new ImageError('Please upload a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_BYTES) {
    throw new ImageError('Image is too large (max 5 MB). Please choose a smaller file.');
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new ImageError('Could not process the image.')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new ImageError('That file is not a readable image.')); };
    img.src = objUrl;
  });
}
