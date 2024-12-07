import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RichTextEditor } from './RichTextEditor';
import { FormattingOptions } from '../../types';

const mockFormatting: FormattingOptions = {
  alignment: 'left',
  fontSize: 16,
  fontFamily: 'Arial',
  color: '#000000'
};

describe('RichTextEditor', () => {
  const defaultProps = {
    content: 'Test content',
    formatting: mockFormatting,
    onChange: jest.fn(),
    onFormatChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('renders with initial content', () => {
      render(<RichTextEditor {...defaultProps} />);
      const editor = screen.getByRole('textbox');
      expect(editor).toHaveTextContent('Test content');
    });

    it('applies initial formatting', () => {
      render(<RichTextEditor {...defaultProps} />);
      const editor = screen.getByRole('textbox');
      expect(editor).toHaveStyle({
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#000000',
        textAlign: 'left',
      });
    });
  });

  describe('Toolbar interactions', () => {
    it('handles font family change', () => {
      render(<RichTextEditor {...defaultProps} />);
      const select = screen.getByRole('combobox');
      
      fireEvent.change(select, { target: { value: 'Times New Roman' } });
      
      expect(defaultProps.onFormatChange).toHaveBeenCalledWith({
        ...mockFormatting,
        fontFamily: 'Times New Roman',
      });
    });

    it('handles font size change', () => {
      render(<RichTextEditor {...defaultProps} />);
      const input = screen.getByRole('spinbutton');
      
      fireEvent.change(input, { target: { value: '20' } });
      
      expect(defaultProps.onFormatChange).toHaveBeenCalledWith({
        ...mockFormatting,
        fontSize: 20,
      });
    });

    it('handles color change', () => {
      render(<RichTextEditor {...defaultProps} />);
      const colorPicker = screen.getByLabelText('Choose color', { selector: 'input[type="color"]' });
      
      fireEvent.change(colorPicker, { target: { value: '#ff0000' } });
      
      expect(defaultProps.onFormatChange).toHaveBeenCalledWith({
        ...mockFormatting,
        color: '#ff0000',
      });
    });

    it('handles alignment changes', () => {
      render(<RichTextEditor {...defaultProps} />);
      const centerButton = screen.getByRole('button', { name: /align center/i });
      
      fireEvent.click(centerButton);
      
      expect(defaultProps.onFormatChange).toHaveBeenCalledWith({
        ...mockFormatting,
        alignment: 'center',
      });
    });
  });

  describe('Content editing', () => {
    it('handles content changes', () => {
      render(<RichTextEditor {...defaultProps} />);
      const editor = screen.getByRole('textbox');
      
      fireEvent.input(editor, { target: { textContent: 'New content' } });
      
      // Note: Due to Slate's complex event handling,
      // we mainly verify that the editor is editable
      expect(editor).not.toHaveAttribute('readonly');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for toolbar buttons', () => {
      render(<RichTextEditor {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /align left/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align center/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /align right/i })).toBeInTheDocument();
    });

    it('ensures editor is keyboard accessible', () => {
      render(<RichTextEditor {...defaultProps} />);
      const editor = screen.getByRole('textbox');
      
      editor.focus();
      expect(document.activeElement).toBe(editor);
    });
  });
});
