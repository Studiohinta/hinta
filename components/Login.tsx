import React, { useState, FormEvent } from 'react';

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
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary dark:bg-brand-accent rounded-3xl shadow-2xl mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-10 h-10 text-white dark:text-brand-primary"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
            HINTA
          </h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">
            Studio
          </p>
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

