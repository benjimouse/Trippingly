// This file will mock the actual firebase.js for Jest tests

export const auth = {
  onAuthStateChanged: jest.fn(() => {
    return jest.fn();
  }),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: jest.fn((email, password) => {
    if (email === 'test@example.com' && password === 'password123') {
      return Promise.resolve({
        user: {
          uid: 'mock-user-id-123',
          email: 'test@example.com',
          getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
        },
      });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'mock-user-id-abc',
      email: 'newuser@example.com',
      getIdToken: jest.fn(() => Promise.resolve('mock-id-token-new')),
    },
  })),
};

export const db = {
  collection: jest.fn(() => db),
  doc: jest.fn(() => db),
  get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
};