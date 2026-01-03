'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS, $convertToMarkdownString, $convertFromMarkdownString, TextMatchTransformer } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalEditor, $getRoot, $createParagraphNode, LexicalNode } from 'lexical';
import { ToolbarPlugin } from './toolbar-plugin';
import { ImageNode, $createImageNode, $isImageNode } from './image-node';
import { ImagePlugin } from './image-plugin';
import { cn } from '@/lib/utils';

// Custom markdown transformer for images
const IMAGE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node: LexicalNode) => {
    if (!$isImageNode(node)) {
      return null;
    }
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText: altText || '',
      src,
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

// Combine default transformers with image transformer
const CUSTOM_TRANSFORMERS = [...TRANSFORMERS, IMAGE_TRANSFORMER];

export interface RichTextEditorRef {
  getContent: () => string;
}

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const theme = {
  paragraph: 'mb-2 leading-relaxed',
  heading: {
    h1: 'text-3xl font-bold mb-4 mt-6',
    h2: 'text-2xl font-bold mb-3 mt-5',
    h3: 'text-xl font-bold mb-2 mt-4',
  },
  list: {
    ul: 'list-disc ml-6 mb-4',
    ol: 'list-decimal ml-6 mb-4',
    listitem: 'mb-1',
    nested: {
      listitem: 'list-none',
    },
  },
  quote: 'border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2 rounded-r',
  code: 'bg-muted px-1.5 py-0.5 rounded font-mono text-sm text-primary',
  link: 'text-primary underline hover:text-primary/80 cursor-pointer',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1.5 py-0.5 rounded font-mono text-sm',
  },
  image: 'editor-image-wrapper',
};

function InitialContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (content && !initializedRef.current) {
      initializedRef.current = true;
      editor.update(() => {
        // Clear existing content first
        const root = $getRoot();
        root.clear();
        
        // Parse markdown content with image support
        // Handle images by converting markdown image syntax to ImageNodes
        const lines = content.split('\n');
        
        let processedContent = '';
        for (const line of lines) {
          // Check if line contains only an image
          const trimmedLine = line.trim();
          const imageOnlyMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          
          if (imageOnlyMatch) {
            // Process any content before this image
            if (processedContent.trim()) {
              $convertFromMarkdownString(processedContent, CUSTOM_TRANSFORMERS);
              processedContent = '';
            }
            // Create image node directly
            const [, altText, src] = imageOnlyMatch;
            const imageNode = $createImageNode({ altText: altText || '', src });
            const paragraph = $createParagraphNode();
            paragraph.append(imageNode);
            root.append(paragraph);
          } else {
            processedContent += line + '\n';
          }
        }
        
        // Process remaining content
        if (processedContent.trim()) {
          $convertFromMarkdownString(processedContent, CUSTOM_TRANSFORMERS);
        }
      });
    }
  }, [editor, content]);

  return null;
}

// Plugin to expose editor instance via ref
function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);

  return null;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      initialContent,
      placeholder = 'Start writing your amazing content...',
      disabled = false,
      className,
    },
    ref
  ) {
    const editorRef = useRef<LexicalEditor | null>(null);

    // Expose getContent method via ref
    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!editorRef.current) return '';
        
        let markdown = '';
        editorRef.current.getEditorState().read(() => {
          markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
        });
        return markdown;
      },
    }));

    const initialConfig = {
      namespace: 'BlogEditor',
      theme,
      onError: (error: Error) => {
        console.error('Lexical error:', error);
      },
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        CodeHighlightNode,
        ImageNode,
      ],
      editable: !disabled,
    };

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className={cn(
          'relative rounded-lg border bg-background overflow-hidden',
          disabled && 'opacity-60',
          className
        )}>
          <ToolbarPlugin disabled={disabled} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    'min-h-[350px] p-4 outline-none focus:outline-none',
                    disabled && 'cursor-not-allowed'
                  )}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <ImagePlugin />
          <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
          <InitialContentPlugin content={initialContent} />
          <EditorRefPlugin editorRef={editorRef} />
        </div>
      </LexicalComposer>
    );
  }
);
