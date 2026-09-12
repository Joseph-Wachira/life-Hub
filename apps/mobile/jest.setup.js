// Loaded before the test framework — src/lib/env.ts throws at import time if
// this is missing, matching the web app's fail-fast env.ts philosophy.
process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000/api/mobile/v1";
