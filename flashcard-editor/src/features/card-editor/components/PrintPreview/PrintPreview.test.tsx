import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrintPreview } from './PrintPreview';
import { CardData } from '../../types';

describe('PrintPreview', () => {
  const mockOnPrint = jest.fn();
  
  const mockCard: CardData = {
    id: 'test-card',
    front: {
      text: 'Front content',
      images: [
        {
          id: 'img1',
          url: 'test-image-1.jpg',
          dimensions: { width: 100, height: 100 }
        }
      ],
      formatting: {
        alignment: 'center',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000'
      }
    },
    back: {
      text: 'Back content',
      images: [],
      formatting: {
        alignment: 'left',
        fontSize: 14,
        fontFamily: 'Times New Roman',
        color: '#333333'
      }
    },
    metadata: {
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
      tags: ['test', 'example']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both front and back of the card', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    expect(screen.getByText('Front content')).toBeInTheDocument();
    expect(screen.getByText('Back content')).toBeInTheDocument();
  });

  it('applies correct formatting styles', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    const frontContent = screen.getByText('Front content').parentElement;
    expect(frontContent).toHaveStyle({
      textAlign: 'center',
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#000000'
    });

    const backContent = screen.getByText('Back content').parentElement;
    expect(backContent).toHaveStyle({
      textAlign: 'left',
      fontSize: '14px',
      fontFamily: 'Times New Roman',
      color: '#333333'
    });
  });

  it('renders images correctly', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', 'test-image-1.jpg');
  });

  it('calls onPrint when print button is clicked', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    const printButton = screen.getByText('Print Card');
    fireEvent.click(printButton);
    
    expect(mockOnPrint).toHaveBeenCalledTimes(1);
  });

  it('displays metadata correctly', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    expect(screen.getByText('Created: 1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('Last updated: 1/2/2023')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
  });

  it('prevents default event on print button click', () => {
    render(<PrintPreview card={mockCard} onPrint={mockOnPrint} />);
    
    const printButton = screen.getByText('Print Card');
    const mockEvent = { preventDefault: jest.fn() };
    
    fireEvent.click(printButton, mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
});
