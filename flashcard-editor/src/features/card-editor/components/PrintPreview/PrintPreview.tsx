import React from 'react';
import { CardData } from '../../types';
import styles from './PrintPreview.module.scss';

interface PrintPreviewProps {
  card: CardData;
  onPrint: () => void;
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({ card, onPrint }) => {
  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    onPrint();
  };

  const renderCardSide = (content: CardData['front'] | CardData['back'], side: 'front' | 'back') => (
    <div className={`${styles.cardPreview} ${styles[side]}`}>
      <div
        className={styles.content}
        style={{
          textAlign: content.formatting.alignment,
          fontSize: `${content.formatting.fontSize}px`,
          fontFamily: content.formatting.fontFamily,
          color: content.formatting.color,
        }}
      >
        <div className={styles.text}>{content.text}</div>
        {content.images.length > 0 && (
          <div className={styles.images}>
            {content.images.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.previewArea}>
        <div className={styles.cardWrapper}>
          {renderCardSide(card.front, 'front')}
          {renderCardSide(card.back, 'back')}
        </div>
      </div>
      <div className={styles.controls}>
        <button
          className={styles.printButton}
          onClick={handlePrint}
        >
          Print Card
        </button>
        <div className={styles.metadata}>
          <p>Created: {new Date(card.metadata.createdAt).toLocaleDateString()}</p>
          <p>Last updated: {new Date(card.metadata.updatedAt).toLocaleDateString()}</p>
          {card.metadata.tags.length > 0 && (
            <div className={styles.tags}>
              {card.metadata.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
