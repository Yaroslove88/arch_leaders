'use client';

import React from 'react';

export interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string;
  /** Custom text for the skip link */
  children?: React.ReactNode;
}

/**
 * Skip Link for accessibility
 * 
 * Allows keyboard users to skip navigation and go directly to main content.
 * Hidden by default, visible on focus.
 * 
 * Usage:
 * 1. Add <SkipLink /> at the very beginning of your layout
 * 2. Ensure target element has id="main-content" (or your custom targetId)
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Перейти к основному контенту',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only
        focus:not-sr-only
        focus:fixed
        focus:top-4
        focus:left-4
        focus:z-[100]
        focus:px-4
        focus:py-2
        focus:bg-strategic-blue
        focus:text-white
        focus:rounded-lg
        focus:shadow-floating
        focus:outline-none
        focus:ring-2
        focus:ring-white/50
        transition-all
      "
    >
      {children}
    </a>
  );
}

export default SkipLink;
