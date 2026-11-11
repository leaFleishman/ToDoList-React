import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import service from './service.js';
import AuthPage from './AuthPage.js';
import './App.css';

function TodoPage() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const navigate = useNavigate();

  async function getTodos() {
    const todos = await service.getTasks();
    setTodos(todos);
  }

  async function createTodo(e) {
    e.preventDefault();
    await service.addTask(newTodo);
    setNewTodo("");
    await getTodos();
  }

  async function updateCompleted(todo, isComplete) {
    await service.setCompleted(todo.id, isComplete, todo.name);
    await getTodos();
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();
  }

  function logout() {
    service.clearToken();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    getTodos();
  }, []);

  return (
    <section className="todoapp">
      <header className="header">
        <button type="button" onClick={logout}>Logout</button>
        <h1>todos</h1>
        <form onSubmit={createTodo}>
          <input className="new-todo" placeholder="Well, let's take on the day" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
        </form>
      </header>
      <section className="main" style={{ display: "block" }}>
        <ul className="todo-list">
          {todos.map(todo => (
            <li className={todo.isComplete ? "completed" : ""} key={todo.id}>
              <div className="view">
                <input className="toggle" type="checkbox" checked={Boolean(todo.isComplete)} onChange={(e) => updateCompleted(todo, e.target.checked)} />
                <label>{todo.name}</label>
                <button className="destroy" onClick={() => deleteTodo(todo.id)}></button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('checking');
    if (!service.hasValidToken()) {
      setStatus('anonymous');
      return () => { active = false; };
    }

    service.validateToken()
      .then(() => {
        if (active) setStatus('authenticated');
      })
      .catch(() => {
        if (active) setStatus(service.hasValidToken() ? 'error' : 'anonymous');
      });

    return () => { active = false; };
  }, [attempt]);

  if (status === 'checking') {
    return <p>בודקים התחברות...</p>;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }
  if (status === 'error') {
    return (
      <main>
        <p>לא ניתן לאמת את ההתחברות כרגע.</p>
        <button type="button" onClick={() => setAttempt((current) => current + 1)}>נסה שוב</button>
      </main>
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/tasks" element={<ProtectedRoute><TodoPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={service.hasValidToken() ? "/tasks" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
