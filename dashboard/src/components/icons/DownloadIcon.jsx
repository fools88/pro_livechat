import React from 'react';

// Themeable download icon — uses currentColor for background so it can be styled via CSS
export default function DownloadIcon({ className = '', title = 'Download' }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      <title>{title}</title>
      {/* Icon only: draw arrow using currentColor; button background provides the visible rounded square */}
      <path d="M14 8v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 12.5L14 16l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
