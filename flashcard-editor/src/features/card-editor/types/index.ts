export interface CardContent {
  text: string;
  images: ImageData[];
  formatting: FormattingOptions;
}

export interface ImageData {
  id: string;
  url: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface FormattingOptions {
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface CardMetadata {
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CardData {
  id: string;
  front: CardContent;
  back: CardContent;
  metadata: CardMetadata;
}
