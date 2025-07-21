// src/app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

interface BrokerageAccount {
  id: string;
  name: string;
  number: string;
  institutionName: string;
  balance?: {
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

interface TestStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  loading: boolean;
  data?: any;
  error?: string;
}

export default function SnapTradeTestPage() {
  const { user } = useSupabaseAuth();
  const [snapTradeUser, setSnapTradeUser] = useState<SnapTradeUser | null>(null);
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [positions, setPositions] = useState<AccountPosition[]>([]);
  const [optionPositions, setOptionPositions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 1,
      title: "Initialize SnapTrade Client",
      description: "Test API connection and verify credentials",
      completed: false,
      loading: false
    },
    {
      id: 2,
      title: "Create SnapTrade User",
      description: "Register a new user on SnapTrade platform",
      completed: false,
      loading: false
    },
    {
      id: 3,
      title: "Connect Brokerage Account",
      description: "Generate connection portal URL for account linking",
      completed: false,
      loading: false
    },
    {
      id: 4,
      title: "List Connected Accounts",
      description: "Retrieve all connected brokerage accounts",
      completed: false,
      loading: false
    },
    {
      id: 5,
      title: "Get Account Details",
      description: "Fetch detailed information for selected account",
      completed: false,
      loading: false
    },
    {
      id: 6,
      title: "Get Account Positions",
      description: "Retrieve stock/ETF/crypto positions",
      completed: false,
      loading: false
    },
    {
      id: 7,
      title: "Get Option Positions",
      description: "Retrieve options positions separately",
      completed: false,
      loading: false
    },
    {
      id: 8,
      title: "Delete User (Optional)",
      description: "Clean up test user and associated data",
      completed: false,
      loading: false
    }
  ]);

  const updateStep = (stepId: number, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const resetAllSteps = () => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: false,
      loading: false,
      error: undefined,
      data: undefined
    })));
    setSnapTradeUser(null);
    setConnectionUrl('');
    setAccounts([]);
    setSelectedAccount('');
    setAccountDetails(null);
    setPositions([]);
    setOptionPositions([]);
    setAllUsers([]);
  };


  // Step 1: Initialize Client & Test API
  const testApiConnection = async () => {
    updateStep(1, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/status');
      const data = await response.json();

      if (response.ok) {
        updateStep(1, { 
          loading: false, 
          completed: true, 
          data: data 
        });
      } else {
        updateStep(1, { 
          loading: false, 
          error: data.error || 'API connection failed' 
        });
      }
    } catch (error) {
      updateStep(1, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // List all SnapTrade users
  const listAllUsers = async () => {
    try {
      const response = await fetch('/api/snaptrade/list-users');
      const data = await response.json();
      
      if (response.ok) {
        setAllUsers(data.users || []);
        console.log('All SnapTrade users:', data);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Step 2: Create SnapTrade User
  const createSnapTradeUser = async () => {
    if (!user) {
      updateStep(2, { error: 'Please log in first' });
      return;
    }

    updateStep(2, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          appUserId: user.id  // Include app user ID for database update
        })
      });

      const data = await response.json();

      if (response.ok && data.userId && data.userSecret) {
        const newUser = {
          userId: data.userId,
          userSecret: data.userSecret
        };
        setSnapTradeUser(newUser);
        updateStep(2, { 
          loading: false, 
          completed: true, 
          data: { ...data, userSecret: '[HIDDEN]' } // Hide secret in UI
        });
    } else {
        console.error('User creation failed:', data);
        let errorMessage = data.error || 'Failed to create user';
        
        // Add helpful suggestions based on error type
        if (data.details) {
          errorMessage += `\n\nSuggestions:\n${data.details.suggestions?.join('\n') || 'No suggestions available'}`;
        }
        
        updateStep(2, { 
          loading: false, 
          error: errorMessage,
          data: data.details || null
        });
      }
    } catch (error) {
      updateStep(2, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 3: Connect Brokerage Account
  const generateConnectionUrl = async () => {
    if (!snapTradeUser) {
      updateStep(3, { error: 'Please create a SnapTrade user first' });
      return;
    }

    updateStep(3, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/connection-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
          returnToUrl: `${window.location.origin}/test?step=4`
        })
      });

      const data = await response.json();

      if (response.ok && data.redirectURI) {
        setConnectionUrl(data.redirectURI);
        updateStep(3, { 
          loading: false, 
          completed: true, 
          data: { redirectURI: data.redirectURI }
        });
      } else {
        updateStep(3, { 
          loading: false, 
          error: data.error || 'Failed to generate connection URL' 
        });
      }
    } catch (error) {
      updateStep(3, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 4: List Connected Accounts
  const listConnectedAccounts = async () => {
    if (!snapTradeUser) {
      updateStep(4, { error: 'Please create a SnapTrade user first' });
      return;
    }

    updateStep(4, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret
        })
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setAccounts(data);
        updateStep(4, { 
          loading: false, 
          completed: true, 
          data: data 
        });
        
        // Auto-select first account if available
        if (data.length > 0) {
          setSelectedAccount(data[0].id);
        }
      } else {
        updateStep(4, { 
          loading: false, 
          error: data.error || 'Failed to fetch accounts' 
        });
      }
    } catch (error) {
      updateStep(4, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 5: Get Account Details
  const getAccountDetails = async () => {
    if (!snapTradeUser || !selectedAccount) {
      updateStep(5, { error: 'Please select an account first' });
      return;
    }

    updateStep(5, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/account-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
          accountId: selectedAccount
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAccountDetails(data);
        updateStep(5, { 
          loading: false, 
          completed: true, 
          data: data 
        });
      } else {
        updateStep(5, { 
          loading: false, 
          error: data.error || 'Failed to fetch account details' 
        });
      }
    } catch (error) {
      updateStep(5, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 6: Get Account Positions
  const getAccountPositions = async () => {
    if (!snapTradeUser || !selectedAccount) {
      updateStep(6, { error: 'Please select an account first' });
      return;
    }

    updateStep(6, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/account-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
          accountId: selectedAccount
        })
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setPositions(data);
        updateStep(6, { 
          loading: false, 
          completed: true, 
          data: data 
        });
      } else {
        updateStep(6, { 
          loading: false, 
          error: data.error || 'Failed to fetch positions' 
        });
      }
    } catch (error) {
      updateStep(6, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 7: Get Option Positions
  const getOptionPositions = async () => {
    if (!snapTradeUser || !selectedAccount) {
      updateStep(7, { error: 'Please select an account first' });
      return;
    }

    updateStep(7, { loading: true, error: undefined });

    try {
      const response = await fetch('/api/snaptrade/option-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
          accountId: selectedAccount
        })
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setOptionPositions(data);
        updateStep(7, { 
          loading: false, 
          completed: true, 
          data: data 
        });
      } else {
        updateStep(7, { 
          loading: false, 
          error: data.error || 'Failed to fetch option positions' 
        });
      }
    } catch (error) {
      updateStep(7, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Step 8: Delete User
  const deleteSnapTradeUser = async () => {
    updateStep(8, { loading: true, error: undefined });

    try {
      // Try to get the user ID from current snapTradeUser or from database
      let userIdToDelete = snapTradeUser?.userId;
      
      // If no current snapTradeUser, try to get from database
      if (!userIdToDelete && user) {
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('snaptrade_user_id')
          .eq('id', user.id)
          .single();
          
        if (!fetchError && userData?.snaptrade_user_id) {
          userIdToDelete = userData.snaptrade_user_id;
        }
      }

      // If still no user ID, allow manual input
      if (!userIdToDelete) {
        prompt('Enter SnapTrade User ID to delete (or leave empty to just clear database):');
      }

      const confirmDelete = window.confirm(
        userIdToDelete 
          ? `Are you sure you want to delete SnapTrade user "${userIdToDelete}"? This will permanently remove all associated data from both SnapTrade and your database.`
          : 'No SnapTrade User ID found. Do you want to clear any SnapTrade data from your database?'
      );

      if (!confirmDelete) {
        updateStep(8, { loading: false });
        return;
      }

      const response = await fetch('/api/snaptrade/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdToDelete || 'unknown', // Send something even if empty
          deleteFromDatabase: true,
          appUserId: user?.id,
          forceDelete: true // Add flag to force deletion
        })
      });

      const data = await response.json();

      if (response.ok || response.status === 404) { // Consider 404 as success (user already deleted)
        updateStep(8, { 
          loading: false, 
          completed: true, 
          data: { 
            ...data, 
            message: userIdToDelete 
              ? `SnapTrade user ${userIdToDelete} deleted successfully` 
              : 'Database cleaned up successfully'
          }
        });
        
        // Reset all data regardless of API success
        setSnapTradeUser(null);
        setConnectionUrl('');
        setAccounts([]);
        setSelectedAccount('');
        setAccountDetails(null);
        setPositions([]);
        setOptionPositions([]);
        
        // Reset other steps completion status
        setSteps(prev => prev.map(s => 
          s.id === 8 ? s : { ...s, completed: false, data: undefined, error: undefined }
        ));
      } else {
        updateStep(8, { 
          loading: false, 
          error: data.error || 'Failed to delete user',
          data: data
        });
      }
    } catch (error) {
      updateStep(8, { 
        loading: false, 
        error: 'Network error: ' + (error as Error).message 
      });
    }
  };

  // Check for connection completion on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('step') === '4') {
      // User returned from connection portal
      setTimeout(() => {
        if (snapTradeUser) {
          listConnectedAccounts();
        }
      }, 1000);
    }
  }, [snapTradeUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            SnapTrade Integration Test
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to test the SnapTrade integration
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  SnapTrade Integration Test
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Following the SnapTrade Getting Started Guide
                </p>
              </div>
              <button
                onClick={resetAllSteps}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm mr-2"
              >
                Reset All Steps
              </button>
              <button
                onClick={listAllUsers}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 text-sm"
              >
                List All Users
              </button>
            </div>
          </div>

          {/* Current User Info */}
          <div className="px-6 py-4 bg-blue-50 border-b">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-blue-900">Logged in as:</span>
                <span className="text-blue-700 ml-2">{user.email}</span>
              </div>
              {snapTradeUser && (
                <div className="text-sm">
                  <span className="font-medium text-blue-900">SnapTrade User ID:</span>
                  <span className="text-blue-700 ml-2">{snapTradeUser.userId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="p-6">
            {/* All Users Display */}
            {allUsers.length > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-800 mb-3">
                  All SnapTrade Users in Database ({allUsers.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allUsers.map((user, index) => (
                    <div key={index} className="bg-white p-3 rounded border text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-gray-600">
                            SnapTrade ID: {user.snapTradeUserId}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: <span className={`font-medium ${
                              user.snapTradeStatus === 'active' ? 'text-green-600' : 
                              user.snapTradeStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {user.snapTradeStatus}
                            </span>
                            {user.error && ` - ${user.error}`}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const confirmDelete = window.confirm(`Delete SnapTrade user ${user.snapTradeUserId}?`);
                            if (confirmDelete) {
                              fetch('/api/snaptrade/delete-user', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: user.snapTradeUserId,
                                  deleteFromDatabase: true,
                                  appUserId: user.appUserId,
                                  forceDelete: true
                                })
                              }).then(() => listAllUsers()); // Refresh list
                            }
                          }}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.completed 
                            ? 'bg-green-100 text-green-800' 
                            : step.loading 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {step.completed ? '✓' : step.loading ? '⋯' : step.id}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4 ml-11">
                        {step.description}
                      </p>

                      {/* Step-specific content */}
                      {step.id === 3 && connectionUrl && (
                        <div className="ml-11 mb-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <p className="text-sm text-yellow-800 mb-2">
                              <strong>Connection URL Generated!</strong> Click the button below to connect your brokerage account:
                            </p>
                            <a
                              href={connectionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700"
                            >
                              Connect Brokerage Account
                              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}

                      {step.id === 4 && accounts.length > 0 && (
                        <div className="ml-11 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Connected Accounts:</h4>
                          <div className="space-y-2">
                            {accounts.map((account) => (
                              <div 
                                key={account.id}
                                className={`p-3 border rounded-md cursor-pointer ${
                                  selectedAccount === account.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedAccount(account.id)}
                              >
                                <div className="text-sm font-medium">{account.institutionName}</div>
                                <div className="text-xs text-gray-600">
                                  {account.name} - {account.number}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.id === 6 && positions.length > 0 && (
                        <div className="ml-11 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Positions ({positions.length}):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {positions.slice(0, 10).map((position, index) => (
                              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                                <div className="font-medium">{position.symbol}</div>
                                <div className="text-xs text-gray-600">
                                  Qty: {position.quantity} | Value: ${position.marketValue?.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error Display */}
                      {step.error && (
                        <div className="ml-11 mb-4">
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-700">{step.error}</p>
                          </div>
                        </div>
                      )}

                      {/* Success Data Display */}
                      {step.completed && step.data && (
                        <div className="ml-11 mb-4">
                          <details className="bg-green-50 border border-green-200 rounded-md p-3">
                            <summary className="text-sm font-medium text-green-800 cursor-pointer">
                              View Response Data
                            </summary>
                            <pre className="mt-2 text-xs text-green-700 overflow-auto max-h-32">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="ml-4">
                      {step.id === 1 && (
                        <button
                          onClick={testApiConnection}
                          disabled={step.loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Testing...' : 'Test API'}
                        </button>
                      )}

                      {step.id === 2 && (
                        <button
                          onClick={createSnapTradeUser}
                          disabled={step.loading || step.completed}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Creating...' : step.completed ? 'Created' : 'Create User'}
                        </button>
                      )}

                      {step.id === 3 && (
                        <button
                          onClick={generateConnectionUrl}
                          disabled={step.loading || !snapTradeUser}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Generating...' : 'Generate URL'}
                        </button>
                      )}

                      {step.id === 4 && (
                        <button
                          onClick={listConnectedAccounts}
                          disabled={step.loading || !snapTradeUser}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Loading...' : 'List Accounts'}
                        </button>
                      )}

                      {step.id === 5 && (
                        <button
                          onClick={getAccountDetails}
                          disabled={step.loading || !selectedAccount}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Loading...' : 'Get Details'}
                        </button>
                      )}

                      {step.id === 6 && (
                        <button
                          onClick={getAccountPositions}
                          disabled={step.loading || !selectedAccount}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Loading...' : 'Get Positions'}
                        </button>
                      )}

                      {step.id === 7 && (
                        <button
                          onClick={getOptionPositions}
                          disabled={step.loading || !selectedAccount}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Loading...' : 'Get Options'}
                        </button>
                      )}

                      {step.id === 8 && (
                        <button
                          onClick={deleteSnapTradeUser}
                          disabled={step.loading}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          {step.loading ? 'Deleting...' : 'Delete User'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}