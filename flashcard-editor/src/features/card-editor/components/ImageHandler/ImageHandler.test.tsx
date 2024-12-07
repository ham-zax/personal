import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageHandler } from './ImageHandler';
import { ImageData } from '../../types';

// Define proper type for the Image mock
type ImageMock = {
  width?: number;
  height?: number;
  onload?: () => void;
  onerror?: () => void;
  src?: string;
};

describe('ImageHandler', () => {
  const mockOnImageAdd = jest.fn();
  const mockOnImageRemove = jest.fn();
  const defaultProps = {
    images: [],
    onImageAdd: mockOnImageAdd,
    onImageRemove: mockOnImageRemove,
    maxImages: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any created object URLs
    URL.createObjectURL = jest.fn(() => 'mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  it('renders correctly with empty state', () => {
    render(<ImageHandler {...defaultProps} />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument();
    expect(screen.getByText('0 of 5 images used')).toBeInTheDocument();
  });

  it('renders existing images', () => {
    const images: ImageData[] = [
      {
        id: '1',
        url: 'test-url-1',
        dimensions: { width: 100, height: 100 },
      },
      {
        id: '2',
        url: 'test-url-2',
        dimensions: { width: 100, height: 100 },
      },
    ];

    render(<ImageHandler {...defaultProps} images={images} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 of 5 images used')).toBeInTheDocument();
  });

  it('handles drag and drop events', async () => {
    render(<ImageHandler {...defaultProps} />);

    const dropZone = screen.getByRole('button');

    // Mock drag events
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('dragging');

    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('dragging');
  });

  it('handles file selection through click', async () => {
    render(<ImageHandler {...defaultProps} />);

    const input = screen.getByLabelText('Choose images to upload');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    // Mock the image loading process
    const mockImage = {} as ImageMock;
    global.Image = jest.fn().mockImplementation(() => mockImage) as unknown as typeof Image;

    // Trigger the load event after a short delay
    setTimeout(() => {
      mockImage.width = 200;
      mockImage.height = 200;
      mockImage.onload?.();
    }, 100);

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnImageAdd).toHaveBeenCalledWith(expect.objectContaining({
        dimensions: { width: 200, height: 200 },
      }));
    });
  });

  it('handles image removal', () => {
    const images: ImageData[] = [{
      id: 'test-id',
      url: 'test-url',
      dimensions: { width: 100, height: 100 },
    }];

    render(<ImageHandler {...defaultProps} images={images} />);

    const removeButton = screen.getByLabelText('Remove image test-id');
    fireEvent.click(removeButton);

    expect(mockOnImageRemove).toHaveBeenCalledWith('test-id');
  });

  it('shows error when too many images are added', async () => {
    const images: ImageData[] = Array(5).fill(null).map((_, i) => ({
      id: `${i}`,
      url: `test-url-${i}`,
      dimensions: { width: 100, height: 100 },
    }));

    render(<ImageHandler {...defaultProps} images={images} />);

    const input = screen.getByLabelText('Choose images to upload');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/you can only add up to 5 images/i);
    });
  });

  it('shows error for invalid file type', async () => {
    render(<ImageHandler {...defaultProps} />);

    const dropZone = screen.getByRole('button');

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = {
      files: [file],
    };

    fireEvent.drop(dropZone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/please drop image files only/i);
    });
  });

  it('handles keyboard navigation', () => {
    render(<ImageHandler {...defaultProps} />);

    const dropZone = screen.getByRole('button');

    // Test keyboard interaction
    fireEvent.keyPress(dropZone, { key: 'Enter', code: 'Enter' });

    expect(screen.getByLabelText('Choose images to upload')).toBeInTheDocument();
  });

  it('shows processing state while handling images', async () => {
    render(<ImageHandler {...defaultProps} />);

    const input = screen.getByLabelText('Choose images to upload');
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    // Mock the image loading process
    const mockImage = {} as ImageMock;
    global.Image = jest.fn().mockImplementation(() => mockImage) as unknown as typeof Image;

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    expect(screen.getByText(/processing images/i)).toBeInTheDocument();

    // Simulate image load
    setTimeout(() => {
      mockImage.width = 200;
      mockImage.height = 200;
      mockImage.onload?.();
    }, 100);

    await waitFor(() => {
      expect(screen.queryByText(/processing images/i)).not.toBeInTheDocument();
    });
  });
});
