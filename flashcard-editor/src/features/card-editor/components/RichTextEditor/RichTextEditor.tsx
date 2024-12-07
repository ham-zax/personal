import { FC, useCallback, useMemo } from 'react';
import {
  createEditor,
  Descendant,
  Element as SlateElement,
  Text,
  BaseEditor
} from 'slate';
import {
  Slate,
  Editable,
  withReact,
  ReactEditor
} from 'slate-react';
import { FormattingOptions } from '../../types';
import styles from './RichTextEditor.module.scss';

export interface RichTextEditorProps {
  content: string;
  formatting: FormattingOptions;
  onChange: (content: string) => void;
  onFormatChange: (formatting: FormattingOptions) => void;
}

// Custom types for Slate
type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

export const RichTextEditor: FC<RichTextEditorProps> = ({
  content,
  formatting,
  onChange,
  onFormatChange,
}) => {
  const editor = useMemo(() => withReact(createEditor()), []);

  // Convert plain text to Slate value
  const initialValue: Descendant[] = useMemo(
    () => [
      {
        type: 'paragraph' as const,
        children: [{ text: content }],
      },
    ],
    [content]
  );

  const handleChange = useCallback(
    (value: Descendant[]) => {
      // Convert Slate value back to plain text
      const plainText = value
        .map((n) => {
          if (SlateElement.isElement(n)) {
            return n.children.map((child) => Text.isText(child) ? child.text : '').join('');
          }
          return '';
        })
        .join('\n');
      onChange(plainText);
    },
    [onChange]
  );

  const handleFormatChange = useCallback(
    (property: keyof FormattingOptions, value: string | number) => {
      onFormatChange({
        ...formatting,
        [property]: value,
      });
    },
    [formatting, onFormatChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <select
          value={formatting.fontFamily}
          onChange={(e) => handleFormatChange('fontFamily', e.target.value)}
          className={styles.select}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>

        <input
          type="number"
          value={formatting.fontSize}
          onChange={(e) => handleFormatChange('fontSize', parseInt(e.target.value, 10))}
          min={8}
          max={72}
          className={styles.numberInput}
        />

        <input
          type="color"
          value={formatting.color}
          onChange={(e) => handleFormatChange('color', e.target.value)}
          className={styles.colorPicker}
        />

        <div className={styles.alignmentButtons}>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => handleFormatChange('alignment', align)}
              className={`${styles.alignButton} ${formatting.alignment === align ? styles.active : ''
                }`}
              aria-label={`Align ${align}`}
            >
              <span className={`${styles.icon} ${styles[`align${align}`]}`} />
            </button>
          ))}
        </div>
      </div>

      <Slate
        editor={editor}
        initialValue={initialValue}
        onChange={handleChange}
      >
        <Editable
          className={styles.editor}
          style={{
            fontFamily: formatting.fontFamily,
            fontSize: `${formatting.fontSize}px`,
            color: formatting.color,
            textAlign: formatting.alignment,
          }}
          placeholder="Enter your text here..."
        />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
