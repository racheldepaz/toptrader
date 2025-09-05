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

interface Connection {
  id: string;
  name: string;
  type: string;
  // Add other properties as needed based on SnapTrade API response
}

interface ConnectionDeleteResult {
  authorizationId: string;
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
  
  // Connection management state
  const [selectedUserForConnections, setSelectedUserForConnections] = useState<DatabaseUser | null>(null);
  const [userConnections, setUserConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [deletingConnection, setDeletingConnection] = useState(false);
  const [connectionDeleteResults, setConnectionDeleteResults] = useState<ConnectionDeleteResult[]>([]);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  
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
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const successfulMigrations = migrationResults.filter(r => r.status === 'success').length;
    const failedMigrations = migrationResults.filter(r => r.status === 'error').length;
    const successfulDeletions = deleteResults.filter(r => r.status === 'success').length;
    const failedDeletions = deleteResults.filter(r => r.status === 'error').length;

    setStats({
      total: users.length,
      withSnapTrade: usersWithSnapTrade.length,
      withoutSnapTrade: usersWithoutSnapTrade.length,
      successfulMigrations,
      failedMigrations,
      successfulDeletions,
      failedDeletions
    });
  };

  // Load connections for a specific user
  const loadUserConnections = async (user: DatabaseUser) => {
    if (!user.snaptrade_user_id || !user.snaptrade_user_secret) {
      setError('User does not have SnapTrade credentials');
      return;
    }

    setLoadingConnections(true);
    setError('');
    setUserConnections([]);
    setConnectionDeleteResults([]);

    try {
      const response = await fetch('/api/snaptrade/list-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.snaptrade_user_id,
          userSecret: user.snaptrade_user_secret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserConnections(data || []);
        setSelectedUserForConnections(user);
        setShowConnectionsModal(true);
      } else {
        setError(`Failed to load connections: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to load user connections');
    } finally {
      setLoadingConnections(false);
    }
  };

  // Delete a specific connection
  const deleteConnection = async (connection: Connection) => {
    if (!selectedUserForConnections) return;

    const confirmed = confirm(
      `Are you sure you want to delete the connection "${connection.name}"?\n\n` +
      `This will permanently delete all associated accounts and data. This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingConnection(true);

    try {
      const response = await fetch('/api/snaptrade/delete-connection', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserForConnections.snaptrade_user_id,
          userSecret: selectedUserForConnections.snaptrade_user_secret,
          authorizationId: connection.id,
        }),
      });

      const data = await response.json();

      const result: ConnectionDeleteResult = {
        authorizationId: connection.id,
        status: response.ok ? 'success' : 'error',
        error: response.ok ? undefined : data.error
      };

      setConnectionDeleteResults(prev => [...prev, result]);

      if (response.ok) {
        // Reload connections to reflect the deletion
        await loadUserConnections(selectedUserForConnections);
      }
    } catch (err) {
      const result: ConnectionDeleteResult = {
        authorizationId: connection.id,
        status: 'error',
        error: 'Failed to delete connection'
      };
      setConnectionDeleteResults(prev => [...prev, result]);
    } finally {
      setDeletingConnection(false);
    }
  };

  // ... (keeping all existing migration and user deletion functions unchanged)
  
  const migrateSnapTradeUser = async (user: DatabaseUser): Promise<MigrationResult> => {
    try {
      const response = await fetch('/api/snaptrade/migrate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          userId: user.id,
          username: user.username,
          status: 'success',
          snapTradeUserId: data.snapTradeUserId,
        };
      } else {
        return {
          userId: user.id,
          username: user.username,
          status: 'error',
          error: data.error || 'Migration failed',
        };
      }
    } catch (error) {
      return {
        userId: user.id,
        username: user.username,
        status: 'error',
        error: 'Network error during migration',
      };
    }
  };

  const deleteSnapTradeUser = async (user: DatabaseUser): Promise<DeleteResult> => {
    try {
      const response = await fetch('/api/snaptrade/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          snapTradeUserId: user.snaptrade_user_id,
          snapTradeUserSecret: user.snaptrade_user_secret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          userId: user.id,
          username: user.username,
          status: 'success',
        };
      } else {
        return {
          userId: user.id,
          username: user.username,
          status: 'error',
          error: data.error || 'Deletion failed',
        };
      }
    } catch (error) {
      return {
        userId: user.id,
        username: user.username,
        status: 'error',
        error: 'Network error during deletion',
      };
    }
  };

  const runMigration = async () => {
    if (selectedUsers.length === 0) return;

    setMigrating(true);
    setMigrationResults([]);
    setError('');

    const usersToMigrate = usersWithoutSnapTrade.filter(user => 
      selectedUsers.includes(user.id)
    );

    const results: MigrationResult[] = [];
    
    for (const user of usersToMigrate) {
      const result = await migrateSnapTradeUser(user);
      results.push(result);
      setMigrationResults([...results]);
    }

    await loadUsers();
    setMigrating(false);
  };

  const runDeletion = async () => {
    if (selectedSnapTradeUsers.length === 0) return;

    setDeleting(true);
    setDeleteResults([]);
    setError('');

    const usersToDelete = usersWithSnapTrade.filter(user => 
      selectedSnapTradeUsers.includes(user.id)
    );

    const results: DeleteResult[] = [];
    
    for (const user of usersToDelete) {
      const result = await deleteSnapTradeUser(user);
      results.push(result);
      setDeleteResults([...results]);
    }

    await loadUsers();
    setDeleting(false);
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === usersWithoutSnapTrade.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersWithoutSnapTrade.map(user => user.id));
    }
  };

  const selectAllSnapTradeUsers = () => {
    if (selectedSnapTradeUsers.length === usersWithSnapTrade.length) {
      setSelectedSnapTradeUsers([]);
    } else {
      setSelectedSnapTradeUsers(usersWithSnapTrade.map(user => user.id));
    }
  };

  const testMigrateSingleUser = async (user: DatabaseUser) => {
    setMigrating(true);
    setError('');

    const result = await migrateSnapTradeUser(user);
    setMigrationResults([result]);
    await loadUsers();
    setMigrating(false);
  };

  const deleteSingleUser = async (user: DatabaseUser) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${user.username} from SnapTrade?\n\n` +
      `This action is irreversible and will remove all their connections and data.`
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
                    {migrating ? 'Migrating...' : `Migrate Selected (${selectedUsers.length})`}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {usersWithoutSnapTrade.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-sm text-gray-500">@{user.username} • ID: {user.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => testMigrateSingleUser(user)}
                      disabled={migrating}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Test Migrate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users With SnapTrade */}
          {usersWithSnapTrade.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Users With SnapTrade Accounts ({usersWithSnapTrade.length})</h2>
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
                    {deleting ? 'Deleting...' : `Delete Selected (${selectedSnapTradeUsers.length})`}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {usersWithSnapTrade.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-md mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSnapTradeUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSnapTradeUsers([...selectedSnapTradeUsers, user.id]);
                          } else {
                            setSelectedSnapTradeUsers(selectedSnapTradeUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-sm text-gray-500">
                          @{user.username} • SnapTrade ID: {user.snaptrade_user_id}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created: {user.snaptrade_created_at ? new Date(user.snaptrade_created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => loadUserConnections(user)}
                        disabled={loadingConnections}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loadingConnections ? 'Loading...' : 'Manage Connections'}
                      </button>
                      <button
                        onClick={() => deleteSingleUser(user)}
                        disabled={deleting}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Migration Results */}
          {migrationResults.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Migration Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {migrationResults.map((result) => (
                  <div key={result.userId} className="flex items-center justify-between p-2 mb-1">
                    <span className="font-medium">{result.username}</span>
                    {result.status === 'success' ? (
                      <span className="text-green-600 ml-2">✓ Successfully migrated to SnapTrade</span>
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
              <h3 className="text-lg font-semibold mb-3">Deletion Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {deleteResults.map((result) => (
                  <div key={result.userId} className="flex items-center justify-between p-2 mb-1">
                    <span className="font-medium">{result.username}</span>
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

            <h3 className="text-lg font-semibold mb-3 mt-6">Connection Management:</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Click "Manage Connections" to view and manage a user's brokerage connections</li>
              <li>You can see all connected brokerages and delete individual connections</li>
              <li>Deleting a connection removes access to that brokerage's accounts and data</li>
              <li>Connection deletions are permanent and cannot be undone</li>
            </ol>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Warning:</h4>
              <p className="text-yellow-700 text-sm">
                Deleting users from SnapTrade or removing connections is permanent and irreversible. This will remove all their brokerage connections, 
                account data, transaction history, and any other data associated with their SnapTrade account. 
                Only proceed if you are certain you want to permanently remove this data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connections Management Modal */}
      {showConnectionsModal && selectedUserForConnections && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Connections for {selectedUserForConnections.display_name}
              </h2>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loadingConnections ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading connections...</div>
              </div>
            ) : (
              <>
                {userConnections.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">No connections found for this user</div>
                    <p className="text-sm text-gray-400">
                      This user hasn't connected any brokerage accounts yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Found {userConnections.length} connection{userConnections.length !== 1 ? 's' : ''}:
                    </div>
                    
                    {userConnections.map((connection) => (
                      <div key={connection.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-lg">{connection.name}</div>
                            <div className="text-sm text-gray-500">
                              Type: {connection.type} • ID: {connection.id}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteConnection(connection)}
                            disabled={deletingConnection}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingConnection ? 'Deleting...' : 'Delete Connection'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connection Deletion Results */}
                {connectionDeleteResults.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Deletion Results:</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {connectionDeleteResults.map((result) => (
                        <div key={result.authorizationId} className="flex items-center justify-between p-2 mb-1">
                          <span className="font-medium text-sm">Connection {result.authorizationId}</span>
                          {result.status === 'success' ? (
                            <span className="text-green-600 ml-2 text-sm">✓ Successfully deleted</span>
                          ) : (
                            <span className="text-red-600 ml-2 text-sm">✗ Failed: {result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Connection Deletion Warning:</h4>
                  <p className="text-yellow-700 text-sm">
                    Deleting a connection will permanently remove access to that brokerage account and all associated data, 
                    including positions, transactions, and historical information. This action cannot be undone.
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}