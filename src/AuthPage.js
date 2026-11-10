import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import service from './service.js';
import './AuthPage.css';

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');

  if (service.hasValidToken()) {
    return <Navigate to="/tasks" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isRegister) {
        await service.register(username, password);
        navigate('/login', {
          replace: true,
          state: { message: 'ההרשמה הושלמה בהצלחה. אפשר להתחבר עכשיו.' }
        });
        return;
      }

      await service.login(username, password);
      navigate('/tasks', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || (
        requestError.response?.status === 401
          ? 'שם המשתמש או הסיסמה שגויים.'
          : 'לא ניתן להשלים את הבקשה. נסו שוב.'
      ));
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <h1>{isRegister ? 'הרשמה' : 'התחברות'}</h1>
        {message && <p className="auth-success" role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <label htmlFor="username">שם משתמש</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          minLength={3}
          maxLength={50}
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="password">סיסמה</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={isRegister ? 8 : undefined}
          maxLength={128}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit">{isRegister ? 'הרשמה' : 'התחברות'}</button>
        <p>
          {isRegister ? 'כבר רשומים?' : 'אין לכם חשבון?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'מעבר להתחברות' : 'מעבר להרשמה'}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default AuthPage;
