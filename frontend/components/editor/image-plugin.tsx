'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useCallback } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { $createImageNode, ImagePayload } from './image-node';
import { imagesApi } from '@/lib/api/images';

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand('INSERT_IMAGE_COMMAND');

export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { altText, src } = payload;
        const imageNode = $createImageNode({ altText, src });
        
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insert image at current selection
          const focusNode = selection.focus.getNode();
          const focusOffset = selection.focus.offset;
          
          // If we're at the end of a paragraph, insert after
          if (focusNode.getTextContent().length === focusOffset) {
            const paragraph = $createParagraphNode();
            paragraph.append(imageNode);
            focusNode.getTopLevelElementOrThrow().insertAfter(paragraph);
          } else {
            // Insert at cursor position
            selection.insertNodes([imageNode]);
          }
        } else {
          // No selection, append to end
          const paragraph = $createParagraphNode();
          paragraph.append(imageNode);
          editor.getEditorState().read(() => {
            const root = editor.getRootElement();
            if (root) {
              editor.update(() => {
                const selection = $getSelection();
                if (selection) {
                  selection.insertNodes([paragraph]);
                }
              });
            }
          });
        }
        
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

interface ImageUploadButtonProps {
  disabled?: boolean;
}

export function useImageUpload() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    try {
      // Upload the image
      const response = await imagesApi.uploadContentImage(file);
      
      // Insert the image into the editor
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: file.name.replace(/\.[^/.]+$/, ''), // Use filename without extension as alt text
        src: response.url,
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    handleFileSelect,
    openFilePicker,
  };
}
