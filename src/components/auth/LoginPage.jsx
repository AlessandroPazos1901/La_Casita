import React, { useState } from 'react';
import MessageDisplay from './MessageDisplay';
import { auth } from '../../services/supabaseClient';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setMessage('Por favor, ingresa tu usuario y contraseña');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('Username:', username, typeof username);
      console.log('Password:', password, typeof password);
      
      // Llamar directamente al hook login, NO al auth.signIn
      const result = await onLogin(username, password);
      
      if (result && !result.success) {
        setMessage(result.error);
        setMessageType('error');
      } else {
        setMessage('¡Bienvenido! Iniciando sesión...');
        setMessageType('success');
        // No llamar onLogin de nuevo aquí
      }
    } catch (error) {
      setMessage('Error inesperado: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8D5C8] to-[#CF9D34]">
      <MessageDisplay 
        message={message} 
        type={messageType} 
        onClose={() => setMessage('')} 
      />
      
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Bienvenido a la casita 🏠
          </h1>
          <p className="text-gray-600 text-lg">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: juanp123"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu contraseña"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Problemas para acceder? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;