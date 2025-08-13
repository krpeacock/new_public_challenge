'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

interface UserSwitcherProps {
  currentUser: User | null;
}

export default function UserSwitcher({ currentUser }: UserSwitcherProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const switchUser = useCallback(async (userId: string) => {
    try {
      // Update the session cookie via API
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to switch user');
      }

      // Give the browser a moment to persist Set-Cookie before navigating
      await new Promise((r) => setTimeout(r, 50));
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Error switching user:', err);
      setError('Failed to switch user');
    }
  }, [router]);

  useEffect(() => {
    // Fetch available users with error handling
    fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Only list non-admin users in the switcher
        const nonAdmins = data.filter((u: User) => u.role !== 'ADMIN');
        setUsers(nonAdmins);
        setIsLoading(false);
        setError(null);
        
        // Set default user if none is selected
        if (!currentUser && nonAdmins.length > 0) {
          const defaultUser = nonAdmins[0];
          switchUser(defaultUser.id);
        }
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setIsLoading(false);
      });
  }, [currentUser, switchUser]);



  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-semibold mb-2">Switch User (Demo)</h3>
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading users...</div>
        ) : (
          users.map(user => (
            <button
              key={user.id}
              data-testid={`switch-user-${user.id}`}
              onClick={() => switchUser(user.id)}
              className={`block w-full text-left px-3 py-2 rounded ${
                currentUser?.id === user.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div>{user.username}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
