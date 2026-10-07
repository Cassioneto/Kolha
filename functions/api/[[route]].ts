import { createApp } from '../../shared/app.js';

// Cloudflare Pages Functions — apanha tudo em /api/*
const app = createApp();

export async function onRequest(context: { request: Request; env: Record<string, unknown> }) {
  return app.fetch(context.request, context.env as never, context as never);
}
