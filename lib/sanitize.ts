/**
 * HTML Sanitization Helper
 * Uses isomorphic-dompurify for XSS protection
 * Works on both server and client
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for safe HTML (allows basic formatting)
 */
const SAFE_HTML_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr',
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 'class', 'style',
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this before rendering with dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return '';

    try {
        return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
    } catch (error) {
        console.error('[Sanitize] Error sanitizing HTML:', error);
        // On error, strip all HTML as fallback
        return stripAllHtml(dirty);
    }
}

/**
 * Strip all HTML tags (returns plain text)
 * Use when you don't want any HTML at all
 */
export function stripAllHtml(dirty: string | null | undefined): string {
    if (!dirty) return '';

    try {
        return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
    } catch (error) {
        // Fallback regex strip
        return dirty.replace(/<[^>]*>/g, '');
    }
}

/**
 * Sanitize for plain text display (escapes HTML entities)
 */
export function escapeHtml(text: string | null | undefined): string {
    if (!text) return '';

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsDangerousContent(text: string): boolean {
    if (!text) return false;

    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,  // onclick=, onerror=, etc.
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i,
    ];

    return dangerousPatterns.some(pattern => pattern.test(text));
}
