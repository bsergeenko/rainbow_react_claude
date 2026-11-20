import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend läuft unter localhost, damit Session-Cookies des Backends
// (http://localhost:3000, SameSite=Lax) mitgesendet werden.
export default defineConfig({
  plugins: [react()],
  server: { host: 'localhost', port: 5173 },
  preview: { host: 'localhost', port: 4173 },
});
