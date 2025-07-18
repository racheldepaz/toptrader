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

interface DeleteResult {
  userId: string;
  username: string;
  status: 'success' | 'error';
  error?: string;
}

export default function SnapTradeMigrationTestPage() {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [usersWithoutSnapTrade, setUsersWithoutSnapTrade] = useState<DatabaseUser[]>([]);
  const [usersWithSnapTrade, setUsersWithSnapTrade] = useState<DatabaseUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedSnapTradeUsers, setSelectedSnapTradeUsers] = useState<string[]>([]);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [deleteResults, setDeleteResults] = useState<DeleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    withSnapTrade: 0,
    withoutSnapTrade: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    successfulDeletions: 0,
    failedDeletions: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    updateStats();
  }, [users, migrationResults, deleteResults]);

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
        const withSnapTrade = (data.users || []).filter(
          (user: DatabaseUser) => user.snaptrade_user_id
        );
        setUsersWithoutSnapTrade(withoutSnapTrade);
        setUsersWithSnapTrade(withSnapTrade);
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
    const successfulDeletions = deleteResults.filter(r => r.status === 'success').length;
    const failedDeletions = deleteResults.filter(r => r.status === 'error').length;

    setStats({
      total,
      withSnapTrade,
      withoutSnapTrade,
      successfulMigrations,
      failedMigrations,
      successfulDeletions,
      failedDeletions
    });
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === usersWithoutSnapTrade.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersWithoutSnapTrade.map(u => u.id));
    }
  };

  const selectAllSnapTradeUsers = () => {
    if (selectedSnapTradeUsers.length === usersWithSnapTrade.length) {
      setSelectedSnapTradeUsers([]);
    } else {
      setSelectedSnapTradeUsers(usersWithSnapTrade.map(u => u.id));
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const toggleSnapTradeUserSelection = (userId: string) => {
    if (selectedSnapTradeUsers.includes(userId)) {
      setSelectedSnapTradeUsers(selectedSnapTradeUsers.filter(id => id !== userId));
    } else {
      setSelectedSnapTradeUsers([...selectedSnapTradeUsers, userId]);
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

  const deleteSnapTradeUser = async (user: DatabaseUser): Promise<DeleteResult> => {
    try {
      if (!user.snaptrade_user_id) {
        throw new Error('User does not have SnapTrade credentials');
      }

      const deleteResponse = await fetch('/api/snaptrade/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.snaptrade_user_id,
          deleteFromDatabase: true,
          appUserId: user.id
        })
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(`SnapTrade deletion failed: ${errorData.error}`);
      }

      return {
        userId: user.id,
        username: user.username,
        status: 'success'
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

  const runDeletion = async () => {
    if (selectedSnapTradeUsers.length === 0) {
      setError('Please select at least one user to delete from SnapTrade');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSnapTradeUsers.length} user(s) from SnapTrade? This action is irreversible and will remove all their connections and data.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setDeleteResults([]);

    const usersToDelete = usersWithSnapTrade.filter(u => selectedSnapTradeUsers.includes(u.id));
    const results: DeleteResult[] = [];

    // Delete users one by one (to avoid rate limits)
    for (const user of usersToDelete) {
      console.log(`Deleting SnapTrade user: ${user.username}`);
      const result = await deleteSnapTradeUser(user);
      results.push(result);
      setDeleteResults([...results]); // Update UI as we go
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Reload users to see updated status
    await loadUsers();
    setDeleting(false);
    setSelectedSnapTradeUsers([]);
  };

  const testSingleUser = async (user: DatabaseUser) => {
    setMigrating(true);
    setError('');

    const result = await migrateUser(user);
    setMigrationResults([result]);
    await loadUsers();
    setMigrating(false);
  };

  const testSingleDeletion = async (user: DatabaseUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.username} from SnapTrade? This action is irreversible and will remove all their connections and data.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');

    const result = await deleteSnapTradeUser(user);
    setDeleteResults([result]);
    await loadUsers();
    setDeleting(false);
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
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
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
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.successfulDeletions}</div>
              <div className="text-sm text-indigo-800">Deleted Successfully</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.failedDeletions}</div>
              <div className="text-sm text-gray-800">Deletion Failed</div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mb-6">
            <button
              onClick={loadUsers}
              disabled={loading || migrating || deleting}
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

          {/* Users With SnapTrade */}
          {usersWithSnapTrade.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Users With SnapTrade ({usersWithSnapTrade.length})</h2>
                <div className="space-x-2">
                  <button
                    onClick={selectAllSnapTradeUsers}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    {selectedSnapTradeUsers.length === usersWithSnapTrade.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={runDeletion}
                    disabled={deleting || selectedSnapTradeUsers.length === 0}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? `Deleting... (${deleteResults.length}/${selectedSnapTradeUsers.length})` : `Delete Selected (${selectedSnapTradeUsers.length})`}
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
                      <th className="text-left p-3">SnapTrade Status</th>
                      <th className="text-left p-3">Connected Date</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithSnapTrade.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedSnapTradeUsers.includes(user.id)}
                            onChange={() => toggleSnapTradeUserSelection(user.id)}
                            className="rounded"
                          />
                        </td>
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
                        <td className="p-3">
                          <button
                            onClick={() => testSingleDeletion(user)}
                            disabled={deleting}
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                          >
                            Delete
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
              <h3 className="text-lg font-semibold mb-4">Migration Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {migrationResults.map((result, index) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded text-sm">
                    <span className="font-medium">{result.username}:</span>
                    {result.status === 'success' ? (
                      <span className="text-green-600 ml-2">✓ Successfully migrated</span>
                    ) : (
                      <span className="text-red-600 ml-2">✗ Failed: {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deletion Results */}
          {deleteResults.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Deletion Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {deleteResults.map((result, index) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded text-sm">
                    <span className="font-medium">{result.username}:</span>
                    {result.status === 'success' ? (
                      <span className="text-green-600 ml-2">✓ Successfully deleted from SnapTrade</span>
                    ) : (
                      <span className="text-red-600 ml-2">✗ Failed: {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
            
            <h3 className="text-lg font-semibold mb-3 mt-6">Deletion Process:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Select users with existing SnapTrade accounts that you want to remove</li>
              <li>Deletion will remove the user from SnapTrade and clear credentials from your database</li>
              <li>This action is irreversible and will delete all connections and account data</li>
              <li>Use "Delete" button for individual users, or select multiple for batch deletion</li>
            </ol>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Warning:</h4>
              <p className="text-yellow-700 text-sm">
                Deleting users from SnapTrade is permanent and irreversible. This will remove all their brokerage connections, 
                account data, transaction history, and any other data associated with their SnapTrade account. 
                Only proceed if you are certain you want to permanently remove this data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}