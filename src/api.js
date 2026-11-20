// REST-API des Backends. Standard: http://localhost:3000 (für Tests über VITE_API_BASE überschreibbar).
export const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const NETWORK_ERROR =
  'Der Server ist nicht erreichbar. Bitte überprüfe deine Verbindung und versuche es später erneut.';
const GENERIC_ERROR = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.';

/**
 * Zentraler Zugriff auf die REST-API. Session-Cookies werden immer mitgesendet.
 */
export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError((data && data.message) || GENERIC_ERROR, response.status);
  }
  return data;
}

/** Wandelt einen Asset-Pfad des Backends (/assets/...) in eine vollständige URL um. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return API_BASE + path;
}

export const LOGO_URL = assetUrl('/assets/logo.svg');
