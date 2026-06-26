'use client';

import { useRef, useState } from 'react';

/**
 * Real file picker (camera/gallery on mobile) with image preview.
 * For v1 the bytes aren't yet sent to storage (Cloudinary wiring pending) — the
 * component captures + previews the file and reports a local object URL via onPicked,
 * so the UX is real now and only the upload transport swaps in later.
 */
export function FileUpload({
  label,
  accept = 'image/*',
  capture,
  onPicked,
  uploaded,
}: {
  label: string;
  accept?: string;
  capture?: 'user' | 'environment';
  onPicked: (file: File, previewUrl: string) => void;
  uploaded?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState<string>('');

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(file.type.startsWith('image/') ? url : null);
    setName(file.name);
    onPicked(file, url);
  }

  return (
    <div className="rounded-base border p-3 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="rounded-base border px-3 py-1 text-sm hover:border-primary dark:border-gray-600"
        >
          {uploaded || name ? 'Replace' : 'Choose file'}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        {...(capture ? { capture } : {})}
        onChange={pick}
        className="hidden"
      />
      {preview && (
        <img src={preview} alt={`${label} preview`} className="mt-2 h-28 w-full rounded-base object-cover" />
      )}
      {name && <p className="mt-1 text-xs text-success">{name} ready</p>}
    </div>
  );
}
