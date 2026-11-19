import { ImageIcon, Upload } from 'lucide-react';
import ProductGalleryUploader from '@/components/admin/ProductGalleryUploader';

interface ProductImageSectionProps {
  imageFile: File | null;
  imagePreview: string | null;
  imageUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlChange: (url: string) => void;
  initialGallery: any[];
  onGalleryChange: (change: any) => void;
  inputClass: string;
  inputStyle: React.CSSProperties;
}

export function ProductImageSection({
  imageFile,
  imagePreview,
  imageUrl,
  onFileChange,
  onUrlChange,
  initialGallery,
  onGalleryChange,
  inputClass,
  inputStyle,
}: ProductImageSectionProps) {
  return (
    <div
      className="p-5 rounded-2xl border"
      style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Product Image
        </h2>
      </div>

      <label
        className="text-xs uppercase tracking-wider font-semibold mb-1.5 block"
        style={{ color: 'var(--brand-text-muted)' }}
      >
        Upload from your computer
      </label>
      <div className="flex items-center gap-3">
        <label
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
          style={{
            background: 'var(--brand-bg-alt)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-brown)',
          }}
        >
          <Upload size={15} /> Choose image
          <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </label>
        {imageFile && (
          <span className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
            {imageFile.name}
          </span>
        )}
      </div>

      {(imagePreview || imageUrl) && (
        <div
          className="mt-3 w-32 h-32 rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <img
            src={imagePreview || imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="my-4 border-t" style={{ borderColor: 'var(--brand-border)' }} />

      <label
        className="text-xs uppercase tracking-wider font-semibold mb-1.5 block"
        style={{ color: 'var(--brand-text-muted)' }}
      >
        …or paste an image URL (Cloudinary/CDN)
      </label>
      <input
        value={imageUrl || ''}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://res.cloudinary.com/…"
        className={inputClass}
        style={inputStyle}
        disabled={!!imageFile}
      />

      <div className="my-4 border-t" style={{ borderColor: 'var(--brand-border)' }} />

      <ProductGalleryUploader initialImages={initialGallery} onChange={onGalleryChange} />
    </div>
  );
}
