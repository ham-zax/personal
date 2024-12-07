import { FC, useState, DragEvent, useCallback } from 'react';
import styles from './CardContainer.module.scss';
import { CardContent } from '../../types';
import { useOverflowDetection } from '../../hooks/useOverflowDetection';

export interface CardContainerProps {
  side: 'front' | 'back';
  content: CardContent;
  onFlip: () => void;
  onContentChange: (content: CardContent) => void;
}

export const CardContainer: FC<CardContainerProps> = ({
  side,
  content,
  onFlip,
  onContentChange,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contentRef, isOverflowing] = useOverflowDetection([content]);

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      onFlip();
      setIsFlipping(false);
    }, 300);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    // Process each dropped image
    const newImages = await Promise.all(
      files.map(async (file) => {
        const url = URL.createObjectURL(file);
        return new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height,
            });
          };
          img.src = url;
        }).then((dimensions) => ({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          dimensions,
        }));
      })
    );

    // Update content with new images
    onContentChange({
      ...content,
      images: [...content.images, ...newImages],
    });
  }, [content, onContentChange]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.card} ${isFlipping ? styles.flipping : ''}`}
        data-side={side}
      >
        <div
          ref={contentRef}
          className={`${styles.content} ${isDraggingOver ? styles.draggingOver : ''} ${isOverflowing ? styles.overflowing : ''
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Text content */}
          <div
            className={styles.text}
            style={{
              textAlign: content.formatting.alignment,
              fontSize: `${content.formatting.fontSize}px`,
              fontFamily: content.formatting.fontFamily,
              color: content.formatting.color,
            }}
          >
            {content.text}
          </div>

          {/* Images */}
          <div className={styles.images}>
            {content.images.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt=""
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            ))}
          </div>

          {/* Overflow warning */}
          {isOverflowing && (
            <div className={styles.overflowWarning}>
              Content exceeds card boundaries
            </div>
          )}
        </div>

        <button
          className={styles.flipButton}
          onClick={handleFlip}
          aria-label={`Flip to ${side === 'front' ? 'back' : 'front'} side`}
        >
          Flip
        </button>
      </div>
    </div>
  );
};

export default CardContainer;
