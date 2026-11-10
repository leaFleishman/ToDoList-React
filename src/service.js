import axios from 'axios';

// הגדרת ברירות מחדל
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5213";

const TOKEN_KEY = 'todo_jwt';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function hasValidToken() {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')));
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      clearToken();
      return false;
    }

    return true;
  } catch {
    clearToken();
    return false;
  }
}

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

const service = {
  getToken,
  clearToken,
  hasValidToken,
  validateToken: async () => {
    return axios.get('/auth/validate');
  },

  register: async (username, password) => {
    return axios.post('/auth/register', { username, password });
  },

  login: async (username, password) => {
    const result = await axios.post('/auth/login', { username, password });
    localStorage.setItem(TOKEN_KEY, result.data.token);
    return result.data;
  },

  // שליפת כל המשימות
  getTasks: async () => {
    const result = await axios.get('/items');
    return result.data;
  },

  // הוספת משימה חדשה
  addTask: async (name) => {
    const result = await axios.post('/items', {
      name: name,
      isComplete: false
    });
    return result.data;
  },

  // עדכון משימה
  setCompleted: async (id, isComplete, name) => {
    const result = await axios.put(`/items/${id}`, {
      name: name,
      isComplete: isComplete
    });
    return result.data;
  },

  // מחיקת משימה
  deleteTask: async (id) => {
    const result = await axios.delete(`/items/${id}`);
    return result.data;
  }
};

export default service;
