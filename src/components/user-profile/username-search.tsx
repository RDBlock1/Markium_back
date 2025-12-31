'use client';

import { useState } from 'react';

interface UserData {
    createdAt: string;
    proxyWallet: string;
    profileImage: string;
    displayUsernamePublic: boolean;
    bio: string;
    pseudonym: string;
    name: string;
    users: Array<{
        id: string;
        creator: boolean;
        mod: boolean;
    }>;
}

export default function PolymarketUserSearch() {
    const [username, setUsername] = useState('');
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const searchUser = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');
        setUserData(null);

        try {
            const response = await fetch(`/api/polymarket/user?username=${encodeURIComponent(username)}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch user data');
            }

            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Polymarket User Search</h1>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g., Patt2002)"
                    className="flex-1 px-4 py-2 border rounded"
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                />
                <button
                    onClick={searchUser}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {error}
                </div>
            )}

            {userData && (
                <div className="bg-black border rounded-lg p-6 shadow">
                    <div className="flex items-start gap-4 mb-4">
                        <img
                            src={userData.profileImage}
                            alt={userData.name}
                            className="w-20 h-20 rounded-full"
                        />
                        <div>
                            <h2 className="text-xl font-bold">{userData.name}</h2>
                            <p className="text-gray-600">{userData.pseudonym}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p><strong>Bio:</strong> {userData.bio || 'No bio'}</p>
                        <p><strong>Wallet:</strong> <code className="bg-gray-800 px-2 py-1 rounded text-sm">{userData.proxyWallet}</code></p>
                        <p><strong>Joined:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                        <p><strong>User ID:</strong> {userData.users[0]?.id}</p>
                    </div>

                    <details className="mt-4">
                        <summary className="cursor-pointer font-semibold">View Raw JSON</summary>
                        <pre className="mt-2 p-4 bg-gray-50 rounded overflow-auto text-sm">
                            {JSON.stringify(userData, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
