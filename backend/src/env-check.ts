/**
 * Runs at bootstrap — prints every env var the app needs and whether it is set.
 * Crashes the process if any REQUIRED var is missing so you know immediately.
 */

interface EnvVar {
  key: string;
  required: boolean;
  redact?: boolean;   // show only first/last chars
  hint?: string;
}

const ENV_VARS: EnvVar[] = [
  // Server
  { key: 'PORT',              required: false, hint: 'defaults to 3000' },
  { key: 'NODE_ENV',          required: false },
  { key: 'APP_URL',           required: false, hint: 'used for Stripe redirect URLs' },

  // Database
  { key: 'DB_HOST',           required: true },
  { key: 'DB_PORT',           required: false, hint: 'defaults to 5432' },
  { key: 'DB_USERNAME',       required: true },
  { key: 'DB_PASSWORD',       required: true,  redact: true },
  { key: 'DB_NAME',           required: true },

  // Auth
  { key: 'JWT_SECRET',        required: true,  redact: true },
  { key: 'JWT_EXPIRES_IN',    required: false, hint: 'defaults to 7d' },

  // CORS
  { key: 'CORS_ORIGIN',       required: false, hint: 'defaults to http://localhost:5173' },

  // Stripe
  { key: 'STRIPE_SECRET_KEY',      required: false, redact: true, hint: 'needed for payouts' },
  { key: 'STRIPE_PUBLISHABLE_KEY', required: false, redact: true },
  { key: 'STRIPE_WEBHOOK_SECRET',  required: false, redact: true },

  // Email
  { key: 'RESEND_API_KEY',    required: false, redact: true, hint: 'needed for email notifications' },
  { key: 'RESEND_FROM_EMAIL', required: false },

  // Admin
  { key: 'ADMIN_SECRET',      required: false, redact: true },
];

function display(key: string, value: string | undefined, redact: boolean): string {
  if (!value) return 'MISSING';
  if (!redact) return value;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 6)}...${value.slice(-4)} (len ${value.length})`;
}

export function checkEnv(): void {
  const missing: string[] = [];

  const lines: string[] = ['', '━━━ ENV CHECK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'];

  for (const { key, required, redact = false, hint } of ENV_VARS) {
    const value = process.env[key];
    const present = !!value && value.trim() !== '';
    const indicator = present ? '✔' : required ? '✘' : '–';
    const valueStr = display(key, value, redact);
    const hintStr = hint && !present ? `  (${hint})` : '';
    lines.push(`  ${indicator}  ${key.padEnd(25)} ${valueStr}${hintStr}`);
    if (required && !present) missing.push(key);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '');
  console.log(lines.join('\n'));

  if (missing.length > 0) {
    console.error(`\n✘ FATAL — missing required env vars: ${missing.join(', ')}`);
    console.error('  Add them to backend/.env and restart.\n');
    process.exit(1);
  }
}
