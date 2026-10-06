import { useId, useRef, useState, type DragEvent } from 'react';
import { errorMessage } from '../lib/api';
import { cx } from '../lib/cx';
import { isUploadsUnavailable, useUploadImage, validateImageFile, type UploadFolder } from '../lib/uploads';
import { Button } from './Button';
import { controlClass } from './Field';
import { IconImage, IconLink, IconTrash, IconUpload } from './Icons';
import { Spinner } from './Spinner';

export interface ImageValue {
  url: string;
  /** Cloudinary public id; null for pasted URLs. */
  publicId: string | null;
}

interface ImageUploadProps {
  label: string;
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  folder: UploadFolder;
  error?: string;
  aspect?: 'square' | 'wide';
}

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export function ImageUpload({ label, value, onChange, folder, error, aspect = 'square' }: ImageUploadProps) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [broken, setBroken] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setNotice(null);
    const invalid = validateImageFile(file);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    upload.mutate(
      { file, folder },
      {
        onSuccess: (res) => {
          setBroken(false);
          onChange({ url: res.url, publicId: res.publicId });
        },
        onError: (err) => {
          if (isUploadsUnavailable(err)) {
            setNotice(`${errorMessage(err)} You can paste an image URL instead.`);
            setShowUrl(true);
          } else {
            setLocalError(errorMessage(err, 'Image upload failed. Please try again.'));
          }
        },
      },
    );
  };

  const applyUrl = () => {
    const url = urlDraft.trim();
    if (!isHttpUrl(url)) {
      setLocalError('Enter a full image URL starting with https://');
      return;
    }
    setLocalError(null);
    setBroken(false);
    onChange({ url, publicId: null });
    setUrlDraft('');
    setShowUrl(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const shownError = localError ?? error;

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-[13px] font-semibold text-ink">
        {label}
      </span>

      <div className="flex flex-wrap items-start gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-cream text-muted',
            aspect === 'square' ? 'size-36' : 'h-32 w-56',
            dragging ? 'border-caramel bg-warm' : shownError ? 'border-red-400' : 'border-line',
          )}
        >
          {value && !broken ? (
            <img
              src={value.url}
              alt="Selected image preview"
              className="size-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 px-3 text-center text-xs">
              <IconImage size={24} />
              <span>{value && broken ? "Preview couldn't load" : 'Drop an image here'}</span>
            </div>
          )}
          {upload.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-ink">
              <Spinner label="Uploading image" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              tabIndex={-1}
              aria-labelledby={`${id}-label`}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<IconUpload size={15} />}
              loading={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {value ? 'Replace image' : 'Upload image'}
            </Button>
            <Button variant="ghost" size="sm" icon={<IconLink size={15} />} onClick={() => setShowUrl((v) => !v)}>
              Paste URL
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                icon={<IconTrash size={15} />}
                className="text-red-700 hover:bg-red-50"
                onClick={() => {
                  onChange(null);
                  setBroken(false);
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">JPEG, PNG, WebP or AVIF, up to 5 MB.</p>

          {showUrl && (
            <div className="flex gap-2">
              <label htmlFor={`${id}-url`} className="sr-only">
                Image URL
              </label>
              <input
                id={`${id}-url`}
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyUrl();
                  }
                }}
                className={controlClass(false, 'h-8 text-[13px]')}
              />
              <Button size="sm" variant="dark" onClick={applyUrl}>
                Use URL
              </Button>
            </div>
          )}

          {notice && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{notice}</p>}
          {shownError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {shownError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
