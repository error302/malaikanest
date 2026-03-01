"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

interface ProductImageUploaderProps {
  onUpload: (files: File[]) => void;
  initialImages?: string[];
}

export default function ProductImageUploader({
  onUpload,
  initialImages = [],
}: ProductImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages] = useState<string[]>(initialImages);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);

      // Create preview URLs
      const newPreviews = acceptedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews((prev) => [...prev, ...newPreviews]);

      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 5,
  });

  const allImages = [...existingImages, ...previews];

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">
          <div
            className={`p-4 rounded-full mb-4 ${
              isDragActive
                ? "bg-amber-100 dark:bg-amber-900/40"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <UploadCloud
              className={`w-8 h-8 ${
                isDragActive
                  ? "text-amber-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />
          </div>

          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {isDragActive
              ? "Drop the images here..."
              : "Drag & drop product images here"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse (max 5 images)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Supports: PNG, JPG, JPEG, GIF, WebP
          </p>
        </div>
      </div>

      {/* Image Previews */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {allImages.map((src, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {src.startsWith("http") ? (
                <img
                  src={src}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              {index >= existingImages.length && (
                <button
                  onClick={() => removeFile(index - existingImages.length)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}

          {/* Add more placeholder */}
          {allImages.length < 5 && (
            <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
