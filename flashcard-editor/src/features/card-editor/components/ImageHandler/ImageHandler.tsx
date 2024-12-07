import React, { useCallback, useState } from 'react';
import { ImageData } from '../../types';
import styles from './ImageHandler.module.scss';

interface ImageHandlerProps {
  images: ImageData[];
  onImageAdd: (image: ImageData) => void;
  onImageRemove: (imageId: string) => void;
  maxImages?: number;
}

export const ImageHandler: React.FC<ImageHandlerProps> = ({
  images,
  onImageAdd,
  onImageRemove,
  maxImages = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxDimension = 500;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Basic validation - ensure image isn't too small or too large
        resolve(img.width >= 100 && img.width <= 2000 && img.height >= 100 && img.height <= 2000);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const processImage = async (file: File): Promise<ImageData> => {
    const isValid = await validateImage(file);
    if (!isValid) {
      throw new Error('Invalid image dimensions. Image should be between 100x100 and 2000x2000 pixels.');
    }

    const compressedBlob = await compressImage(file);
    const url = URL.createObjectURL(compressedBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          dimensions: {
            width: img.width,
            height: img.height,
          },
        });
      };
      img.onerror = () => reject(new Error('Failed to process image'));
      img.src = url;
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) {
      setError('Please drop image files only');
      return;
    }

    if (images.length + files.length > maxImages) {
      setError(`You can only add up to ${maxImages} images`);
      return;
    }

    setIsProcessing(true);

    try {
      for (const file of files) {
        const processedImage = await processImage(file);
        onImageAdd(processedImage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [images.length, maxImages, onImageAdd]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`You can only add up to ${maxImages} images`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      for (const file of files) {
        const processedImage = await processImage(file);
        onImageAdd(processedImage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
      // Reset the input
      e.target.value = '';
    }
  }, [images.length, maxImages, onImageAdd]);

  return (
    <div className={styles.container} role="region" aria-label="Image upload area">
      <input
        type="file"
        id="file-input"
        className={styles.hiddenInput}
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        aria-label="Choose images to upload"
      />
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onClick={() => document.getElementById('file-input')?.click()}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file-input')?.click();
          }
        }}
        aria-label="Drag and drop zone for images"
      >
        {isProcessing ? (
          <p>Processing images...</p>
        ) : (
          <p>Drag and drop images here or click to select files</p>
        )}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div 
        className={styles.imagePreview}
        role="list"
        aria-label="Uploaded images"
      >
        {images.map((image) => (
          <div 
            key={image.id} 
            className={styles.imageContainer}
            role="listitem"
          >
            <img
              src={image.url}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            />
            <button
              className={styles.removeButton}
              onClick={() => onImageRemove(image.id)}
              aria-label={`Remove image ${image.id}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={styles.imageCount} aria-live="polite">
        {images.length} of {maxImages} images used
      </div>
    </div>
  );
};
