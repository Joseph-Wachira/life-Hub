const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy apps/mobile/.env.example to apps/mobile/.env and point it at your Next.js dev server's /api/mobile/v1."
  );
}

export const env = {
  apiUrl,
};
