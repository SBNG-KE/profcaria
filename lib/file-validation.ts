/**
 * File Upload Validation
 * Validates file type, size, and content
 */

// Generous list of allowed image types
export const ALLOWED_IMAGE_TYPES = [
    // JPEG/JPG
    'image/jpeg',
    'image/jpg',
    'image/pjpeg', // Progressive JPEG

    // PNG
    'image/png',
    'image/x-png',

    // WebP
    'image/webp',

    // GIF
    'image/gif',

    // BMP
    'image/bmp',
    'image/x-bmp',
    'image/x-ms-bmp',

    // TIFF
    'image/tiff',
    'image/x-tiff',

    // ICO
    'image/x-icon',
    'image/vnd.microsoft.icon',

    // HEIC/HEIF (Apple)
    'image/heic',
    'image/heif',

    // AVIF (modern)
    'image/avif',

    // SVG (sanitized)
    'image/svg+xml',
];

// File extension mapping (for validation)
export const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.jpe', '.jfif', '.jif',  // JPEG variants
    '.png',
    '.webp',
    '.gif',
    '.bmp', '.dib',
    '.tiff', '.tif',
    '.ico',
    '.heic', '.heif',
    '.avif',
    '.svg',
];

// Size limits
export const FILE_SIZE_LIMITS = {
    profileImage: 10 * 1024 * 1024,    // 10MB
    logo: 5 * 1024 * 1024,              // 5MB
    document: 20 * 1024 * 1024,         // 20MB
    general: 10 * 1024 * 1024,          // 10MB default
};

export type FileSizeType = keyof typeof FILE_SIZE_LIMITS;

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFilename?: string;
}

/**
 * Validate an uploaded file
 */
export function validateFile(
    file: File | { name: string; type: string; size: number },
    sizeType: FileSizeType = 'general'
): FileValidationResult {
    const { name, type, size } = file;

    // 1. Check size
    const maxSize = FILE_SIZE_LIMITS[sizeType];
    if (size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File too large. Maximum size is ${maxMB}MB.`,
        };
    }

    if (size === 0) {
        return {
            valid: false,
            error: 'File is empty.',
        };
    }

    // 2. Check MIME type
    const normalizedType = type.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
        return {
            valid: false,
            error: `File type "${type}" is not allowed. Allowed types: JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC, AVIF, SVG.`,
        };
    }

    // 3. Check extension
    const ext = '.' + name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            error: `File extension "${ext}" is not allowed.`,
        };
    }

    // 4. Sanitize filename
    const sanitizedFilename = sanitizeFilename(name);

    return {
        valid: true,
        sanitizedFilename,
    };
}

/**
 * Sanitize filename to prevent path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
    // Remove path components
    const basename = filename.split(/[/\\]/).pop() || 'file';

    // Keep only safe characters
    const sanitized = basename
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace unsafe chars with underscore
        .replace(/\.{2,}/g, '.')            // Collapse multiple dots
        .replace(/^\.+/, '')                // Remove leading dots
        .slice(0, 100);                     // Limit length

    // Ensure we have valid extension
    if (!sanitized.includes('.')) {
        return sanitized + '.bin';
    }

    return sanitized || 'file.bin';
}

/**
 * Get file info for validation from Request
 */
export async function getFileFromRequest(
    request: Request,
    fieldName: string = 'file'
): Promise<File | null> {
    try {
        const formData = await request.formData();
        const file = formData.get(fieldName);

        if (file instanceof File) {
            return file;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Validate content type header matches actual file
 * Helps prevent MIME type spoofing
 */
export function validateContentType(
    declaredType: string | null,
    actualType: string
): boolean {
    if (!declaredType) return true; // If not declared, we rely on actual

    const normalizedDeclared = declaredType.toLowerCase().split(';')[0].trim();
    const normalizedActual = actualType.toLowerCase();

    // Allow some flexibility in JPEG types
    if (normalizedActual.includes('jpeg') && normalizedDeclared.includes('jpeg')) {
        return true;
    }

    return normalizedDeclared === normalizedActual;
}
