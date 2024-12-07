import { render, screen, fireEvent, act } from '@testing-library/react';
import { CardContainer } from './CardContainer';
import { CardContent } from '../../types';

const mockContent: CardContent = {
  text: 'Test content',
  images: [],
  formatting: {
    alignment: 'left',
    fontSize: 16,
    fontFamily: 'Arial',
    color: '#000000'
  }
};

describe('CardContainer', () => {
  const defaultProps = {
    side: 'front' as const,
    content: mockContent,
    onFlip: jest.fn(),
    onContentChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('renders with correct dimensions', () => {
      render(<CardContainer {...defaultProps} />);
      const container = screen.getByRole('button', { name: /flip to back side/i }).parentElement?.parentElement;
      expect(container).toHaveStyle({
        width: '148.5mm',
        height: '105mm'
      });
    });

    it('displays initial content correctly', () => {
      render(<CardContainer {...defaultProps} />);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Flip functionality', () => {
    it('triggers flip animation and calls onFlip', async () => {
      render(<CardContainer {...defaultProps} />);
      const flipButton = screen.getByRole('button', { name: /flip to back side/i });

      fireEvent.click(flipButton);
      expect(flipButton.parentElement).toHaveClass('flipping');

      // Wait for animation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      expect(defaultProps.onFlip).toHaveBeenCalled();
    });
  });

  describe('Image handling', () => {
    it('handles image drop correctly', async () => {
      render(<CardContainer {...defaultProps} />);
      const content = screen.getByText('Test content').parentElement as HTMLElement;

      const file = new File([''], 'test.png', { type: 'image/png' });
      const dataTransfer = {
        files: [file],
        types: ['Files']
      };

      fireEvent.dragOver(content, { dataTransfer });
      expect(content).toHaveClass('draggingOver');

      fireEvent.dragLeave(content);
      expect(content).not.toHaveClass('draggingOver');

      // Mock URL.createObjectURL
      const mockUrl = 'blob:test';
      global.URL.createObjectURL = jest.fn(() => mockUrl);

      // Mock image loading
      const originalImage = global.Image;
      global.Image = class {
        onload: (() => void) | null = null;
        src: string = '';
        width: number = 100;
        height: number = 100;
        constructor() {
          setTimeout(() => this.onload?.(), 0);
          return this;
        }
      } as any;

      await act(async () => {
        fireEvent.drop(content, { dataTransfer });
      });

      expect(defaultProps.onContentChange).toHaveBeenCalledWith(expect.objectContaining({
        images: expect.arrayContaining([
          expect.objectContaining({
            url: mockUrl,
            dimensions: { width: 100, height: 100 }
          })
        ])
      }));

      // Cleanup
      global.Image = originalImage;
    });
  });

  describe('Overflow detection', () => {
    it('shows warning when content overflows', () => {
      // Mock ResizeObserver
      const mockResizeObserver = jest.fn(callback => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      }));
      global.ResizeObserver = mockResizeObserver;

      const { container } = render(
        <CardContainer
          {...defaultProps}
          content={{
            ...mockContent,
            text: 'a'.repeat(1000) // Long text to trigger overflow
          }}
        />
      );

      // Trigger overflow detection
      const callback = mockResizeObserver.mock.calls[0][0];
      act(() => {
        callback([
          {
            target: container.querySelector(`.${defaultProps.side}`)
          }
        ]);
      });

      expect(screen.getByText(/content exceeds card boundaries/i)).toBeInTheDocument();
    });
  });
});
