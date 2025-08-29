/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig
