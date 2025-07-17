// app/api/snaptrade/utils.ts
import crypto from 'crypto';

export interface SnapTradeConfig {
  clientId: string;
  consumerKey: string;
  baseUrl: string;
}

export const snapTradeConfig: SnapTradeConfig = {
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
  baseUrl: 'https://api.snaptrade.com',
};

export function generateSignature(
  method: string,
  path: string,
  body: any = null,
  timestamp: number,
  clientId: string
): string {
  // Build query string exactly as SnapTrade expects
  const queryString = `clientId=${clientId}&timestamp=${timestamp}`;
  
  // Create signature object - this must match SnapTrade's expected format exactly
  const sigObject = {
    content: body || {},
    path: path,
    query: queryString
  };

  // Convert to JSON string with no spaces (critical for SnapTrade)
  const sigContent = JSON.stringify(sigObject);
  
  console.log('Signature generation:', {
    sigObject,
    sigContent,
    consumerKey: snapTradeConfig.consumerKey.substring(0, 10) + '...'
  });

  const hmac = crypto.createHmac('sha256', snapTradeConfig.consumerKey);
  return hmac.update(sigContent).digest('base64');
}

export async function makeSnapTradeRequest(
  method: string,
  path: string,
  queryParams: Record<string, any> = {},
  body: any = null
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const clientId = snapTradeConfig.clientId;
  
  // Generate signature
  const signature = generateSignature(method, path, body, timestamp, clientId);
  
  // Build query string with clientId and timestamp only
  const query = new URLSearchParams();
  query.append('clientId', clientId);
  query.append('timestamp', timestamp.toString());
  
  // Add other query params (for GET requests mainly)
  Object.keys(queryParams).forEach(key => {
    if (key !== 'clientId' && key !== 'timestamp' && queryParams[key] !== undefined) {
      query.append(key, queryParams[key].toString());
    }
  });

  const url = `${snapTradeConfig.baseUrl}${path}?${query.toString()}`;
  
  console.log('SnapTrade Request Details:', {
    method,
    path,
    url,
    body: body ? JSON.stringify(body) : null,
    timestamp,
    clientId,
    signature: signature.substring(0, 20) + '...',
    consumerKey: snapTradeConfig.consumerKey ? 'Present' : 'Missing'
  });
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Signature': signature, // Send signature in header instead of query param
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SnapTrade API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
      requestUrl: url,
      requestMethod: method,
      requestBody: body ? JSON.stringify(body) : null,
      headers: options.headers
    });
    throw new Error(`SnapTrade API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}
