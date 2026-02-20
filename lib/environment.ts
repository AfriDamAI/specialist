/**
 * Environment Configuration
 * This file handles the logic for pointing the frontend to the correct backend endpoint.
 * Following Rule #6: Explicitly pointing to the Google Cloud Run Production Backend.
 */

export const getApiUrl = (): string => {
  // 1. Check if Vercel has a dynamic environment variable set
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (publicApiUrl) {
    return publicApiUrl.endsWith('/') ? publicApiUrl.slice(0, -1) : publicApiUrl;
  }

  // 2. Fallback: The New Google Cloud Production Backend
  // We include the /api suffix to match our NestJS backend routes.
  return "https://afridam-backend-prod-107032494605.us-central1.run.app/api";
};

export const API_BASE_URL = getApiUrl();