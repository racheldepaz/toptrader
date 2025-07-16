// src/lib/snaptrade.ts
// SnapTrade API integration for Robinhood connection

const SNAPTRADE_BASE_URL = 'https://api.snaptrade.com/api/v1';

interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

interface ConnectionPortalResponse {
  redirectURI: string;
  sessionId: string;
}

interface BrokerageAccount {
  id: string;
  name: string;
  number: string;
  institutionName: string;
  balance: {
    total: number;
    currency: string;
  };
}

interface AccountPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  unrealizedPL: number;
}

interface AccountActivity {
  id: string;
  type: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  currency: string;
  tradeDate: string;
  description: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class SnapTradeAPI {
  private clientId: string;
  private consumerKey: string;

  constructor() {
    this.clientId = process.env.SNAPTRADE_CLIENT_ID!;
    this.consumerKey = process.env.SNAPTRADE_CONSUMER_KEY!;
    
    if (!this.clientId || !this.consumerKey) {
      throw new Error('SnapTrade credentials not found in environment variables');
    }
  }

  // Helper method to make authenticated requests
  private async makeRequest<T>(endpoint: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}): Promise<T> {
    const url = `${SNAPTRADE_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'clientId': this.clientId,
      'Signature': this.consumerKey, // In production, this should be properly signed
      ...options.headers
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SnapTrade API Error: ${response.status} - ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error('SnapTrade API request failed:', error);
      throw error;
    }
  }

  // 1. Register a new SnapTrade user
  async registerUser(userId: string): Promise<SnapTradeUser> {
    return await this.makeRequest<SnapTradeUser>('/snapTrade/registerUser', {
      method: 'POST',
      body: { userId }
    });
  }

  // 2. Generate connection portal URL for brokerage linking
  async generateConnectionPortal(
    userId: string, 
    userSecret: string, 
    returnToUrl?: string
  ): Promise<ConnectionPortalResponse> {
    return await this.makeRequest<ConnectionPortalResponse>('/snapTrade/encryptedJWT', {
      method: 'POST',
      headers: {
        'SnapTrade-User-Id': userId,
        'SnapTrade-User-Secret': userSecret
      },
      body: {
        userId,
        userSecret,
        ...(returnToUrl && { returnToURL: returnToUrl })
      }
    });
  }

  // 3. List user's connected accounts
  async listUserAccounts(userId: string, userSecret: string): Promise<BrokerageAccount[]> {
    return await this.makeRequest<BrokerageAccount[]>('/accounts', {
      headers: {
        'SnapTrade-User-Id': userId,
        'SnapTrade-User-Secret': userSecret
      }
    });
  }

  // 4. Get account details
  async getAccountDetails(
    accountId: string, 
    userId: string, 
    userSecret: string
  ): Promise<BrokerageAccount> {
    return await this.makeRequest<BrokerageAccount>(`/accounts/${accountId}`, {
      headers: {
        'SnapTrade-User-Id': userId,
        'SnapTrade-User-Secret': userSecret
      }
    });
  }

  // 5. Get account positions (holdings)
  async getAccountPositions(
    accountId: string, 
    userId: string, 
    userSecret: string
  ): Promise<AccountPosition[]> {
    return await this.makeRequest<AccountPosition[]>(`/accounts/${accountId}/positions`, {
      headers: {
        'SnapTrade-User-Id': userId,
        'SnapTrade-User-Secret': userSecret
      }
    });
  }

  // 6. Get account activities (transactions)
  async getAccountActivities(
    accountId: string, 
    userId: string, 
    userSecret: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AccountActivity[]> {
    let endpoint = `/accounts/${accountId}/activities`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest<AccountActivity[]>(endpoint, {
      headers: {
        'SnapTrade-User-Id': userId,
        'SnapTrade-User-Secret': userSecret
      }
    });
  }

  // 7. Delete a SnapTrade user
  async deleteUser(userId: string): Promise<{ message: string }> {
    return await this.makeRequest<{ message: string }>(`/snapTrade/deleteUser/${userId}`, {
      method: 'DELETE'
    });
  }

  // Helper: Check API status
  async checkApiStatus(): Promise<{ status: string; version: string }> {
    return await this.makeRequest<{ status: string; version: string }>('/');
  }
}

export default SnapTradeAPI;
export type {
  SnapTradeUser,
  ConnectionPortalResponse,
  BrokerageAccount,
  AccountPosition,
  AccountActivity
};