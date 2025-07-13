// src/lib/url.ts
export const getSiteUrl = (): string => {
  console.log('🌐 getSiteUrl: Detecting site URL...');
  
  // First try environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('🌐 getSiteUrl: Using env variable:', process.env.NEXT_PUBLIC_SITE_URL);
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Then try to detect from window (client-side)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('🌐 getSiteUrl: Using window.location.origin:', origin);
    return origin;
  }
  
  // Fallback for server-side rendering
  console.log('🌐 getSiteUrl: Using fallback localhost');
  return 'http://localhost:3000';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getSiteUrl();
  return `${baseUrl}/api${endpoint}`;
};