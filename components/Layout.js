import React, { useState, useEffect } from 'react';
import Head from 'next/head';

const Layout = ({ children }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Recupera i dati dell'utente dal cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const authToken = getCookie('auth_token');
    if (authToken) {
      try {
        // Decodifica i dati da base64
        const decodedData = atob(authToken);
        const user = JSON.parse(decodedData);
        setUserData(user);
      } catch (e) {
        console.error('Errore nel parsing dei dati utente:', e);
        // Se c'è un errore nel parsing, fai il logout
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/login';
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>CheckClass360</title>
        <meta name="description" content="Sistema di prenotazione aule" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[3000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-800">CheckClass360</h1>
            <div className="flex items-center gap-4">
              {userData && (
                <span className="text-sm text-gray-600">
                  {userData.nome} ({userData.ruolo})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[3000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout; 