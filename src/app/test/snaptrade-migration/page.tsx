// app/test/snaptrade-migration/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface DatabaseUser {
  id: string;
  username: string;
  display_name: string;
  snaptrade_user_id: string | null;
  snaptrade_user_secret: string | null;
  snaptrade_created_at: string | null;
  created_at: string;
}

interface MigrationResult {
  userId: string;
  username: string;
  status: 'success' | 'error' | 'skipped';
  snapTradeUserId?: string;
  error?: string;
}

export default function SnapTradeMigrationTestPage() {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [usersWithoutSnapTrade, setUsersWithoutSnapTrade] = useState<DatabaseUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    withSnapTrade: 0,
    withoutSnapTrade: 0,
    successfulMigrations: 0,
    failedMigrations: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    updateStats();
  }, [users, migrationResults]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snaptrade/get-users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        const withoutSnapTrade = (data.users || []).filter(
          (user: DatabaseUser) => !user.snaptrade_user_id
        );
        setUsersWithoutSnapTrade(withoutSnapTrade);
      } else {
        setError(`Failed to load users: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const total = users.length;
    const withSnapTrade = users.filter(u => u.snaptrade_user_id).length;
    const withoutSnapTrade = users.filter(u => !u.snaptrade_user_id).length;
    const successfulMigrations = migrationResults.filter(r => r.status === 'success').length;
    const failedMigrations = migrationResults.filter(r => r.status === 'error').length;

    setStats({
      total,
      withSnapTrade,
      withoutSnapTrade,
      successfulMigrations,
      failedMigrations
    });
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === usersWithoutSnapTrade.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersWithoutSnapTrade.map(u => u.id));
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const migrateUser = async (user: DatabaseUser): Promise<MigrationResult> => {
    try {
      // Generate unique SnapTrade user ID
      const snapTradeUserId = `migrate_${user.username}_${Date.now()}`;

      // Step 1: Register with SnapTrade
      const registerResponse = await fetch('/api/snaptrade/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: snapTradeUserId })
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(`SnapTrade registration failed: ${errorData.error}`);
      }

      const snapTradeUser = await registerResponse.json();

      // Step 2: Assign to database user
      const assignResponse = await fetch('/api/snaptrade/assign-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appUserId: user.id,
          snapTradeUserId: snapTradeUser.userId,
          snapTradeUserSecret: snapTradeUser.userSecret
        })
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(`Database assignment failed: ${errorData.error}`);
      }

      return {
        userId: user.id,
        username: user.username,
        status: 'success',
        snapTradeUserId: snapTradeUser.userId
      };

    } catch (error) {
      return {
        userId: user.id,
        username: user.username,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runMigration = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user to migrate');
      return;
    }

    setMigrating(true);
    setError('');
    setMigrationResults([]);

    const usersToMigrate = usersWithoutSnapTrade.filter(u => selectedUsers.includes(u.id));
    const results: MigrationResult[] = [];

    // Migrate users one by one (to avoid rate limits)
    for (const user of usersToMigrate) {
      console.log(`Migrating user: ${user.username}`);
      const result = await migrateUser(user);
      results.push(result);
      setMigrationResults([...results]); // Update UI as we go
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Reload users to see updated status
    await loadUsers();
    setMigrating(false);
    setSelectedUsers([]);
  };

  const testSingleUser = async (user: DatabaseUser) => {
    setMigrating(true);
    setError('');

    const result = await migrateUser(user);
    setMigrationResults([result]);
    await loadUsers();
    setMigrating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SnapTrade User Migration Tool
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.withSnapTrade}</div>
              <div className="text-sm text-green-800">With SnapTrade</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.withoutSnapTrade}</div>
              <div className="text-sm text-orange-800">Need Migration</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.successfulMigrations}</div>
              <div className="text-sm text-purple-800">Migrated Successfully</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedMigrations}</div>
              <div className="text-sm text-red-800">Migration Failed</div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mb-6">
            <button
              onClick={loadUsers}
              disabled={loading || migrating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Users'}
            </button>
          </div>

          {/* Users Without SnapTrade */}
          {usersWithoutSnapTrade.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Users Requiring Migration ({usersWithoutSnapTrade.length})</h2>
                <div className="space-x-2">
                  <button
                    onClick={selectAllUsers}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    {selectedUsers.length === usersWithoutSnapTrade.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={runMigration}
                    disabled={migrating || selectedUsers.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {migrating ? `Migrating... (${migrationResults.length}/${selectedUsers.length})` : `Migrate Selected (${selectedUsers.length})`}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr className="border-b">
                      <th className="text-left p-3">Select</th>
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Display Name</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutSnapTrade.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-medium">{user.username}</td>
                        <td className="p-3">{user.display_name || 'N/A'}</td>
                        <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => testSingleUser(user)}
                            disabled={migrating}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            Test Migrate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Migration Results */}
          {migrationResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
              <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr className="border-b">
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">SnapTrade User ID</th>
                      <th className="text-left p-3">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {migrationResults.map((result, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-medium">{result.username}</td>
                        <td className="p-3">
                          {result.status === 'success' ? (
                            <span className="text-green-600 font-medium">✓ Success</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Failed</span>
                          )}
                        </td>
                        <td className="p-3">
                          {result.snapTradeUserId ? (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {result.snapTradeUserId.substring(0, 20)}...
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="p-3">
                          {result.error && (
                            <span className="text-red-600 text-xs">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Users Overview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Users Overview</h2>
            <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr className="border-b">
                    <th className="text-left p-3">Username</th>
                    <th className="text-left p-3">Display Name</th>
                    <th className="text-left p-3">SnapTrade Status</th>
                    <th className="text-left p-3">Connected At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-3 font-medium">{user.username}</td>
                      <td className="p-3">{user.display_name || 'N/A'}</td>
                      <td className="p-3">
                        {user.snaptrade_user_id ? (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Connected ({user.snaptrade_user_id.substring(0, 15)}...)
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs font-medium">✗ Not connected</span>
                        )}
                      </td>
                      <td className="p-3">
                        {user.snaptrade_created_at ? (
                          new Date(user.snaptrade_created_at).toLocaleDateString()
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 p-6 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Migration Process:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>This tool identifies users without SnapTrade credentials</li>
              <li>For each selected user, it creates a new SnapTrade user account</li>
              <li>It then assigns the SnapTrade credentials to your database user</li>
              <li>Users can then connect their brokerage accounts in your app</li>
              <li>Use "Test Migrate" for individual users, or select multiple for batch migration</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}