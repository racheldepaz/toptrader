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
  queryString: string,
  requestData: any = {}
): string {
  // Create signature object exactly as SnapTrade expects
  const sigObject = {
    content: requestData,
    path: path,
    query: queryString
  };

  // Convert to JSON string - SnapTrade's docs show using JSON.stringify without options
  const sigContent = JSON.stringify(sigObject);
  
  console.log('Signature generation:', {
    method,
    path,
    queryString,
    requestData,
    sigObject,
    sigContent,
    consumerKey: snapTradeConfig.consumerKey.substring(0, 10) + '...'
  });

  // Use encodeURI on consumer key as shown in SnapTrade docs
  const encodedConsumerKey = encodeURI(snapTradeConfig.consumerKey);
  const hmac = crypto.createHmac('sha256', encodedConsumerKey);
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
  
  // Build query string with clientId and timestamp first
  const query = new URLSearchParams();
  query.append('clientId', clientId);
  query.append('timestamp', timestamp.toString());
  
  // Add other query params (userId, userSecret, etc.)
  Object.keys(queryParams).forEach(key => {
    if (key !== 'clientId' && key !== 'timestamp' && queryParams[key] !== undefined) {
      query.append(key, queryParams[key].toString());
    }
  });

  const queryString = query.toString();
  
  // For DELETE requests with authentication, the request data should be empty
  // but the userId and userSecret are in query params
  let requestData = {};
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestData = body;
  }
  
  // Generate signature
  const signature = generateSignature(method, path, queryString, requestData);
  
  const url = `${snapTradeConfig.baseUrl}${path}?${queryString}`;
  
  console.log('SnapTrade Request Details:', {
    method,
    path,
    url,
    body: body ? JSON.stringify(body) : null,
    requestData,
    timestamp,
    clientId,
    signature: signature.substring(0, 20) + '...',
    consumerKey: snapTradeConfig.consumerKey ? 'Present' : 'Missing'
  });
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Signature': signature,
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