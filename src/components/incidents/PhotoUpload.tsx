'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validateImageFile, MAX_FILE_SIZE_MB } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PhotoUploadProps {
  onUploadComplete: (result: { public_id: string; secure_url: string }) => void;
  onUploadError?: (error: string) => void;
  onClear?: () => void;
}

export function PhotoUpload({ onUploadComplete, onUploadError, onClear }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setValidationError(null);
    const err = validateImageFile(selected);
    if (err) {
      setValidationError(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setUploadedUrl(null);
  };

  const handleClear = () => {
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setUploadedUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) onClear();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setValidationError(null);
    setUploadProgress(10);

    try {
      // Step 1: Request signed upload params from our secure server endpoint
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'reliefnet/incidents' }),
      });

      if (!signRes.ok) {
        const errorData = await signRes.json().catch(() => ({}));
        if (signRes.status === 503) {
          // Cloudinary not configured in environment
          throw new Error(
            errorData.error ||
              'Cloudinary API keys are not set in environment (.env.local).'
          );
        }
        throw new Error(errorData.error || 'Failed to authenticate upload request.');
      }

      const signData = await signRes.json();
      setUploadProgress(30);

      // Step 2: Upload directly to Cloudinary using signed payload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const cloudUploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudUploadRes.ok) {
        const cloudErr = await cloudUploadRes.json().catch(() => ({}));
        throw new Error(cloudErr.error?.message || 'Failed uploading image to Cloudinary.');
      }

      setUploadProgress(90);
      const cloudData = await cloudUploadRes.json();

      setUploadedUrl(cloudData.secure_url);
      setUploadProgress(100);
      onUploadComplete({
        public_id: cloudData.public_id,
        secure_url: cloudData.secure_url,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setValidationError(msg);
      if (onUploadError) onUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Photographic Evidence (Optional)
        </label>
        <span className="text-xs text-slate-500">Max {MAX_FILE_SIZE_MB}MB • JPG, PNG, WebP</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        id="incident-photo-input"
      />

      {!previewUrl ? (
        <label
          htmlFor="incident-photo-input"
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-xl bg-slate-900/40 cursor-pointer transition-colors group"
        >
          <div className="p-3 rounded-full bg-slate-800 text-slate-400 group-hover:text-orange-400 transition-colors mb-2">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-300 group-hover:text-white">
            Click to upload incident photo
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Optimized & stored securely via Cloudinary
          </p>
        </label>
      ) : (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Incident preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                  {file?.name || 'Selected image'}
                </p>
                <p className="text-xs text-slate-400">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Remove photo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {uploadedUrl ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-2.5">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Image securely uploaded to Cloudinary CDN</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Uploading ({uploadProgress}%)...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload to Cloudinary
                  </>
                )}
              </Button>
              <span className="text-xs text-slate-500">
                Upload image before final submission
              </span>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
