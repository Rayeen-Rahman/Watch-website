/**
 * Shared API utilities
 * ─────────────────────────────────────────────────────────
 * Import { API, resolveImg } from '../../utils/api'   (adjust depth as needed)
 *
 * Why a fallback?
 *   If VITE_API_URL is undefined (env file missing / not restarted),
 *   every fetch / image URL becomes the literal string "undefined/..."
 *   which silently 404s and shows placeholder images site-wide.
 */

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Resolve a stored image path to a fully-qualified URL.
 *
 * Stored paths from the upload endpoint look like:
 *   /uploads/products/1777584620862-109774287.png
 *
 * External / CDN URLs are returned unchanged.
 *
 * @param {string|undefined} url  Raw value from product.images[n]
 * @returns {string}
 */
export const resolveImg = (url) => {
  if (!url) return '';
  // Normalise Windows backslashes that may appear on the dev machine
  const normalised = url.replace(/\\/g, '/');
  return normalised.startsWith('/uploads') ? `${API}${normalised}` : normalised;
};
