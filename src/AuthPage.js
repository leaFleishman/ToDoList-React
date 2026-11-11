import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import service from './service.js';
import './AuthPage.css';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 19.5c1.3-3.4 4-5.1 7.2-5.1s5.9 1.7 7.2 5.1" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8.3 10.5V8a3.7 3.7 0 0 1 7.4 0v2.5" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 12s3.3-6 9.2-6 9.2 6 9.2 6-3.3 6-9.2 6-9.2-6-9.2-6z" />
      <circle cx="12" cy="12" r="2.7" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}

const DEMO_TASKS = ['לקבוע פגישה', 'להתקשר לסבתא', 'לסיים את הפרויקט', 'רגע של שקט לעצמי'];
// Steps 1..4 check the tasks one by one, then hold, then reset.
const DEMO_CYCLE = 8;

function ChecklistArt() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTick(DEMO_TASKS.length);
      return undefined;
    }
    const timer = setInterval(() => setTick((current) => (current + 1) % DEMO_CYCLE), 1100);
    return () => clearInterval(timer);
  }, []);

  // At least one task always carries a V; the page fills up, holds, then starts over.
  const done = tick === DEMO_CYCLE - 1 ? 1 : Math.max(1, Math.min(tick, DEMO_TASKS.length));
  const allDone = done === DEMO_TASKS.length;

  return (
    <div className="auth-board-stack">
    <div className={`auth-board${allDone ? ' is-complete' : ''}`}>
      <div className="auth-board-head">
        <span>היום</span>
        <span className="auth-board-count">{done}/{DEMO_TASKS.length}</span>
      </div>
      <ul>
        {DEMO_TASKS.map((task, index) => (
          <li key={task} className={index < done ? 'is-done' : ''}>
            <span className="auth-board-check">
              <svg viewBox="0 0 24 24"><path d="M6 12.5l4 4L18 8" /></svg>
            </span>
            <span className="auth-board-text">{task}</span>
          </li>
        ))}
      </ul>
      <div className="auth-board-progress">
        <span style={{ transform: `scaleX(${done / DEMO_TASKS.length})` }} />
      </div>
      <span className="auth-board-spark auth-board-spark-1">✦</span>
      <span className="auth-board-spark auth-board-spark-2">✦</span>
      <span className="auth-board-spark auth-board-spark-3">✦</span>
    </div>
    </div>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');

  if (service.hasValidToken()) {
    return <Navigate to="/tasks" replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell" key={mode}>
        <aside className="auth-art" aria-hidden="true">
          <ChecklistArt />
          <div className="auth-art-text">
            <span className="auth-brand">todos</span>
            <p>כל יום הוא דף חדש.<br />בואו נמלא אותו בדברים שחשובים.</p>
          </div>
        </aside>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-emblem" aria-hidden="true">✦</div>
          <h1>{isRegister ? 'יצירת חשבון' : 'שמחים לראות אותך'}</h1>
          <p className="auth-subtitle">
            {isRegister ? 'כמה פרטים קטנים ומתחילים' : 'התחברו כדי להמשיך לרשימה שלכם'}
          </p>

          {message && <p className="auth-success" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          <div className="auth-field">
            <input
              id="username"
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              placeholder=" "
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <label htmlFor="username">שם משתמש</label>
            <span className="auth-icon"><UserIcon /></span>
          </div>

          <div className="auth-field">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              required
              placeholder=" "
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <label htmlFor="password">סיסמה</label>
            <span className="auth-icon"><LockIcon /></span>
            <button
              type="button"
              className="auth-reveal"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'הסתרת סיסמה' : 'הצגת סיסמה'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {isRegister && <p className="auth-hint">לפחות 8 תווים</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            <span>{submitting ? 'רק רגע…' : (isRegister ? 'הרשמה' : 'התחברות')}</span>
          </button>

          <div className="auth-divider"><span>או</span></div>

          <p className="auth-switch">
            {isRegister ? 'כבר רשומים?' : 'עוד אין לכם חשבון?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'להתחברות' : 'להרשמה'}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default AuthPage;
