import React, { useState, FormEvent } from 'react';
import { brandAssets } from '../lib/brandAssets';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check password (in production, this should be a secure API call)
    if (password === 'admin-master') {
      // Store authentication in localStorage
      localStorage.setItem('hinta_auth', JSON.stringify({ 
        authenticated: true, 
        timestamp: Date.now() 
      }));
      setIsLoading(false);
      onLogin();
    } else {
      setError('Felaktigt lösenord');
      setIsLoading(false);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <div className="w-full max-w-md px-6">
        {/* Ikon ovanför logotyp (design-system) */}
        <div className="text-center mb-12">
          <img src={brandAssets.favicon.black} alt="" className="w-12 h-12 mx-auto dark:hidden mb-4" aria-hidden />
          <img src={brandAssets.favicon.white} alt="" className="w-12 h-12 mx-auto hidden dark:block mb-4" aria-hidden />
          <img src={brandAssets.logo.black} alt="HINTA" className="h-10 mx-auto dark:hidden" />
          <img src={brandAssets.logo.white} alt="HINTA" className="h-10 mx-auto hidden dark:block" />
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2"
              >
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Ange admin-lösenord"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-accent focus:border-transparent transition-all font-medium"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-4 bg-brand-primary dark:bg-brand-accent text-white dark:text-brand-primary font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
          © {new Date().getFullYear()} Studio Hinta. Alla rättigheter förbehållna.
        </p>
      </div>
    </div>
  );
};

