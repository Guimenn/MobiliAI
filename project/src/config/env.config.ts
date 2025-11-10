export const envConfig = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/loja_tintas?schema=public',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_DATABASE: process.env.DB_DATABASE || 'loja_tintas',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // AbacatePay (PIX)
  ABACATEPAY_API_KEY: process.env.ABACATEPAY_API_KEY || '',
  ABACATEPAY_ENVIRONMENT: process.env.ABACATEPAY_ENVIRONMENT || 'sandbox',
  ABACATEPAY_BASE_URL: process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com',
  ABACATEPAY_DEV_MODE: process.env.ABACATEPAY_DEV_MODE === 'true',

  // App
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // EmailJS
  EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID || '',
  EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID || '',
  EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || '',
  EMAILJS_USER_ID: process.env.EMAILJS_USER_ID || '',

  // Hugging Face (para Trellis/ZeroGPU)
  HF_TOKEN: process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN || '',

  // Replicate
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || 'r8_WwmiM2PiqGiJsyW0oVQ5LJDDHZqLQid1AzXRU',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
};
