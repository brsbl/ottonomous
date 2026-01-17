/**
 * Preview component - Renders Markdown content with GFM support,
 * syntax highlighting for code blocks, and custom styling.
 * Supports [[wiki-style]] links rendered as clickable spans.
 */

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

// Import highlight.js styles for syntax highlighting
import 'highlight.js/styles/github-dark.css';

interface PreviewProps {
  /** The Markdown content to render */
  content: string;
  /** Optional callback when a wiki link is clicked */
  onWikiLinkClick?: (linkText: string) => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Parse wiki-style links [[text]] from content and convert to special markers
 * that can be processed during rendering
 */
function preprocessWikiLinks(content: string): string {
  // Convert [[wiki link]] to a special inline code marker that we can detect
  // We use a special prefix to identify wiki links: `__wiki__:linktext`
  return content.replace(/\[\[([^\]]+)\]\]/g, '`__wiki__:$1`');
}

/**
 * Preview component that renders Markdown with full GFM support
 */
export function Preview({ content, onWikiLinkClick, className = '' }: PreviewProps) {
  // Preprocess content to handle wiki links
  const processedContent = useMemo(() => preprocessWikiLinks(content), [content]);

  // Custom components for react-markdown
  const components: Components = useMemo(
    () => ({
      // Headings with custom styling
      h1: ({ children, ...props }) => (
        <h1
          className="text-3xl font-bold text-gray-900 dark:text-white mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700"
          {...props}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          className="text-2xl font-semibold text-gray-900 dark:text-white mt-5 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2"
          {...props}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }) => (
        <h4
          className="text-lg font-medium text-gray-900 dark:text-white mt-3 mb-2"
          {...props}
        >
          {children}
        </h4>
      ),
      h5: ({ children, ...props }) => (
        <h5
          className="text-base font-medium text-gray-900 dark:text-white mt-3 mb-1"
          {...props}
        >
          {children}
        </h5>
      ),
      h6: ({ children, ...props }) => (
        <h6
          className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-3 mb-1"
          {...props}
        >
          {children}
        </h6>
      ),

      // Paragraphs
      p: ({ children, ...props }) => (
        <p className="text-gray-700 dark:text-gray-300 my-3 leading-relaxed" {...props}>
          {children}
        </p>
      ),

      // Links
      a: ({ href, children, ...props }) => (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),

      // Lists
      ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside my-3 ml-4 space-y-1 text-gray-700 dark:text-gray-300" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside my-3 ml-4 space-y-1 text-gray-700 dark:text-gray-300" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="leading-relaxed" {...props}>
          {children}
        </li>
      ),

      // Task list items (GFM)
      input: ({ checked, ...props }) => (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          {...props}
        />
      ),

      // Blockquotes
      blockquote: ({ children, ...props }) => (
        <blockquote
          className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-1 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-r"
          {...props}
        >
          {children}
        </blockquote>
      ),

      // Code blocks and inline code
      code: ({ className: codeClassName, children, ...props }) => {
        const match = /language-(\w+)/.exec(codeClassName || '');
        const isInlineCode = !match && !codeClassName;

        // Check if this is a wiki link marker
        const childText = String(children).replace(/\n$/, '');
        if (childText.startsWith('__wiki__:')) {
          const linkText = childText.slice('__wiki__:'.length);
          return (
            <span
              onClick={() => onWikiLinkClick?.(linkText)}
              className="inline-flex items-center px-2 py-0.5 mx-0.5 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onWikiLinkClick?.(linkText);
                }
              }}
              title={`Link to: ${linkText}`}
            >
              <svg
                className="w-3.5 h-3.5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {linkText}
            </span>
          );
        }

        // Inline code
        if (isInlineCode) {
          return (
            <code
              className="px-1.5 py-0.5 mx-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Code block - rehype-highlight handles syntax highlighting
        return (
          <code className={`${codeClassName || ''} text-sm`} {...props}>
            {children}
          </code>
        );
      },

      // Pre (code block container)
      pre: ({ children, ...props }) => (
        <pre
          className="my-4 p-4 overflow-x-auto rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100"
          {...props}
        >
          {children}
        </pre>
      ),

      // Tables (GFM)
      table: ({ children, ...props }) => (
        <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => (
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }) => (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props}>
          {children}
        </td>
      ),

      // Horizontal rule
      hr: ({ ...props }) => (
        <hr className="my-6 border-t border-gray-200 dark:border-gray-700" {...props} />
      ),

      // Images
      img: ({ src, alt, ...props }) => (
        <img
          src={src}
          alt={alt || ''}
          className="max-w-full h-auto my-4 rounded-lg shadow-md"
          loading="lazy"
          {...props}
        />
      ),

      // Strikethrough (GFM)
      del: ({ children, ...props }) => (
        <del className="text-gray-500 dark:text-gray-500 line-through" {...props}>
          {children}
        </del>
      ),

      // Strong/Bold
      strong: ({ children, ...props }) => (
        <strong className="font-semibold text-gray-900 dark:text-white" {...props}>
          {children}
        </strong>
      ),

      // Emphasis/Italic
      em: ({ children, ...props }) => (
        <em className="italic text-gray-700 dark:text-gray-300" {...props}>
          {children}
        </em>
      ),
    }),
    [onWikiLinkClick]
  );

  return (
    <div
      className={`prose prose-gray dark:prose-invert max-w-none ${className}`}
      data-testid="markdown-preview"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

export default Preview;
