jest.mock('axios', () => {
  const axios = {
    defaults: {},
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };

  return { __esModule: true, default: axios };
});

import axios from 'axios';
import service from './service';

const requestInterceptor = axios.interceptors.request.use.mock.calls[0][0];
const responseErrorInterceptor = axios.interceptors.response.use.mock.calls[0][1];

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/login');
  jest.clearAllMocks();
});

test('adds the stored JWT to outgoing requests', () => {
  localStorage.setItem('todo_jwt', 'header.payload.signature');
  const config = { headers: {} };

  expect(requestInterceptor(config).headers.Authorization).toBe('Bearer header.payload.signature');
});

test('stores the JWT returned by login', async () => {
  axios.post.mockResolvedValue({ data: { token: 'issued.jwt.token' } });

  await service.login('user', 'password');

  expect(localStorage.getItem('todo_jwt')).toBe('issued.jwt.token');
});

test('clears the stored JWT after a 401', async () => {
  localStorage.setItem('todo_jwt', 'invalid.jwt.token');
  const error = { response: { status: 401 } };
  const logError = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(responseErrorInterceptor(error)).rejects.toBe(error);
  expect(localStorage.getItem('todo_jwt')).toBeNull();

  logError.mockRestore();
});
