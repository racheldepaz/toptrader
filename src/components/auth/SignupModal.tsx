'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsConfirmation(false);

    console.log('Attempting signup with:', { email, username });

    const { error, needsEmailConfirmation } = await signUp(email, password, username);
    
    if (error) {
      console.error('Signup error:', error);
      setError(error.message);
    } else if (needsEmailConfirmation) {
      console.log('Signup successful, needs email confirmation');
      setNeedsConfirmation(true);
      // Don't close modal yet - let user see the confirmation message
    } else {
      console.log('Signup successful and confirmed!');
      onClose();
      setEmail('');
      setPassword('');
      setUsername('');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setNeedsConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Join TopTrader</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {needsConfirmation && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-600">📧</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Check your email!</h3>
                <p className="mt-1 text-sm">
                  We've sent a confirmation link to <strong>{email}</strong>. 
                  Please check your email and click the link to complete your signup.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!needsConfirmation && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              required
              disabled={loading}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
              required
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password (min 6 characters)"
              required
              disabled={loading}
              minLength={6}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {needsConfirmation && (
          <div className="mt-4">
            <button 
              onClick={handleClose}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Got it!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}