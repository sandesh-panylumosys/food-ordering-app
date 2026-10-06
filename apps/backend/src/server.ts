import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(
    `🍽  Ember & Oak API listening on http://0.0.0.0:${env.PORT}/api (${env.NODE_ENV})` +
      `\n   payments: ${env.paymentsMock ? 'MOCK (local dev only — no real charges)' : env.razorpayEnabled ? 'Razorpay ✓' : 'not configured'}` +
      ` · uploads: ${env.cloudinaryEnabled ? 'Cloudinary ✓' : 'not configured'}`,
  );
});

function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`${signal} received, closing server…`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
