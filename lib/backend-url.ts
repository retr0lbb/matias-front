/**
 * The NestJS API (port 3000; the frontend runs on 3001). Override with
 * BACKEND_URL when it runs elsewhere. Server-side only.
 */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
