import { z } from 'zod';

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  /** Comma-separated list of browser origins allowed to call the API (admin panel). */
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  /** Number of reverse proxies in front of the app (Render/Railway/Fly = 1). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: optional,
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  /**
   * `razorpay` (default) or `mock`. Mock simulates the payment gateway for local
   * development without a Razorpay account; it is rejected in production.
   */
  PAYMENT_PROVIDER: z.enum(['razorpay', 'mock']).default('razorpay'),
  RAZORPAY_KEY_ID: optional,
  RAZORPAY_KEY_SECRET: optional,
  RAZORPAY_WEBHOOK_SECRET: optional,

  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  CLOUDINARY_FOLDER: z.string().default('ember-oak'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n\nSee .env.example.\n`);
  process.exit(1);
}

const raw = parsed.data;

if (raw.NODE_ENV === 'production') {
  if (raw.PAYMENT_PROVIDER === 'mock') {
    // eslint-disable-next-line no-console
    console.error('\n❌ PAYMENT_PROVIDER=mock is for local development only. Use razorpay in production.\n');
    process.exit(1);
  }
  const required = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ] as const;
  const missing = required.filter((k) => !raw[k]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`\n❌ Missing production environment variables: ${missing.join(', ')}\n`);
    process.exit(1);
  }
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  razorpayEnabled: Boolean(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET),
  paymentsMock: raw.PAYMENT_PROVIDER === 'mock',
  cloudinaryEnabled: Boolean(
    raw.CLOUDINARY_CLOUD_NAME && raw.CLOUDINARY_API_KEY && raw.CLOUDINARY_API_SECRET,
  ),
};
