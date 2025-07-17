// app/test/snaptrade/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

interface DatabaseUser {
  id: string;
  username: string;
  display_name: string;
  snaptrade_user_id: string | null;
  snaptrade_user_secret: string | null;
  snaptrade_created_at: string | null;
}

export default function SnapTradeTestPage() {
  const [customUserId, setCustomUserId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [snapTradeUser, setSnapTradeUser] = useState<SnapTradeUser | null>(null);
  const [connectionUrl, setConnectionUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUsers, setExistingUsers] = useState<DatabaseUser[]>([]);
  const [updatedUser, setUpdatedUser] = useState<DatabaseUser | null>(null);

  // Load existing users from database
  useEffect(() => {
    loadExistingUsers();
  }, []);

  const loadExistingUsers = async () => {
    try {
      const response = await fetch('/api/snaptrade/get-users');
      const data = await response.json();
      
      if (response.ok) {
        setExistingUsers(data.users || []);
      } else {
        console.error('Failed to load users:', data.error);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Test API Status
  const testApiStatus = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/snaptrade/status');
      const data = await response.json();
      
      if (response.ok) {
        alert(`SnapTrade API is live! Server time: ${data.timestamp}`);
      } else {
        setError(`API Status Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to check API status');
    } finally {
      setLoading(false);
    }
  };

  // Register a new SnapTrade user
  const registerUser = async () => {
    if (!customUserId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: customUserId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnapTradeUser(data);
        alert('User registered successfully!');
      } else {
        setError(`Registration Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  // Assign SnapTrade credentials to existing database user
  const assignToExistingUser = async () => {
    if (!selectedUserId) {
      setError('Please select a user from the dropdown');
      return;
    }

    if (!snapTradeUser) {
      setError('Please register a SnapTrade user first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/assign-to-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appUserId: selectedUserId,
          snapTradeUserId: snapTradeUser.userId,
          snapTradeUserSecret: snapTradeUser.userSecret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUpdatedUser(data.user);
        await loadExistingUsers(); // Refresh the user list
        alert('SnapTrade credentials assigned successfully!');
      } else {
        setError(`Assignment Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to assign credentials to user');
    } finally {
      setLoading(false);
    }
  };

  // Generate connection portal URL
  const generateConnectionUrl = async () => {
    if (!snapTradeUser) {
      setError('Please register a user first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/connection-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: snapTradeUser.userId,
          userSecret: snapTradeUser.userSecret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnectionUrl(data.redirectURI);
      } else {
        setError(`Connection URL Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to generate connection URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SnapTrade Integration Test - Existing Schema
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Test API Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 1: Test API Connection</h2>
            <button
              onClick={testApiStatus}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Status'}
            </button>
          </div>

          {/* Display existing users */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Existing Users in Database</h2>
            <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
              {existingUsers.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Display Name</th>
                      <th className="text-left p-2">SnapTrade Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingUsers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.display_name || 'N/A'}</td>
                        <td className="p-2">
                          {user.snaptrade_user_id ? (
                            <span className="text-green-600 text-xs">
                              ✓ Connected ({user.snaptrade_user_id.substring(0, 10)}...)
                            </span>
                          ) : (
                            <span className="text-red-600 text-xs">✗ Not connected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No users found in database</p>
              )}
            </div>
          </div>

          {/* Step 2: Register SnapTrade User */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Step 2: Register New SnapTrade User</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Enter unique SnapTrade User ID (e.g., user_12345_snap)"
                value={customUserId}
                onChange={(e) => setCustomUserId(e.target.value)}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={registerUser}
                disabled={loading || !customUserId.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register SnapTrade User'}
              </button>
            </div>
            
            {snapTradeUser && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <h3 className="font-semibold text-green-800 mb-2">SnapTrade User Created!</h3>
                <p><strong>User ID:</strong> {snapTradeUser.userId}</p>
                <p><strong>User Secret:</strong> {snapTradeUser.userSecret.substring(0, 20)}...</p>
              </div>
            )}
          </div>

          {/* Step 3: Assign to Existing User */}
          {snapTradeUser && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Step 3: Assign to Existing Database User</h2>
              <div className="flex gap-4 mb-4">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a user to assign SnapTrade credentials...</option>
                  {existingUsers
                    .filter(user => !user.snaptrade_user_id) // Only show users without SnapTrade
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.display_name || 'No display name'})
                      </option>
                    ))}
                </select>
                <button
                  onClick={assignToExistingUser}
                  disabled={loading || !selectedUserId}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Credentials'}
                </button>
              </div>

              {updatedUser && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-md">
                  <h3 className="font-semibold text-purple-800 mb-2">User Updated Successfully!</h3>
                  <p><strong>Username:</strong> {updatedUser.username}</p>
                  <p><strong>SnapTrade User ID:</strong> {updatedUser.snaptrade_user_id}</p>
                  <p><strong>Assigned At:</strong> {new Date(updatedUser.snaptrade_created_at!).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Generate Connection Portal */}
          {snapTradeUser && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Step 4: Generate Brokerage Connection</h2>
              <button
                onClick={generateConnectionUrl}
                disabled={loading}
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 mb-4"
              >
                {loading ? 'Generating...' : 'Generate Connection URL'}
              </button>

              {connectionUrl && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <h3 className="font-semibold text-blue-800 mb-2">Connection Portal Ready!</h3>
                  <p className="mb-3">Open this URL to connect a brokerage account:</p>
                  <a
                    href={connectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
                  >
                    Open Connection Portal
                  </a>
                  <p className="mt-3 text-sm text-gray-600">
                    For testing, you can create an Alpaca Paper Trading account and select "Alpaca Paper" in the portal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 bg-gray-50 p-6 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Testing Workflow:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Test API connection to ensure SnapTrade is working</li>
              <li>Register a new SnapTrade user with a unique ID</li>
              <li>Select an existing database user and assign the SnapTrade credentials</li>
              <li>Generate a connection portal URL to test brokerage linking</li>
              <li>Verify the user table updates with SnapTrade data</li>
            </ol>
            
            <h3 className="text-lg font-semibold mb-3 mt-6">Next Steps for Production:</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Integrate this into your onboarding flow at step 4 (brokerage connection)</li>
              <li>Generate unique SnapTrade user IDs for new users automatically</li>
              <li>Handle the connection success callback to update the database</li>
              <li>Add error handling and user feedback mechanisms</li>
              <li>Test with real brokerage accounts in sandbox mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
