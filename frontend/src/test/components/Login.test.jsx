import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from '@components/Login';
import { AuthContext } from '@context/AuthContext'; // We'll mock this
import { BrowserRouter as Router } from 'react-router-dom'; // Needed for Link/Navigate

// Mock AuthContext for testing purposes
const mockAuthContext = {
  currentUser: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

describe('Login Component', () => {
  test('renders login form with email and password fields', () => {
    render(
      <Router> {/* Wrap with Router because Login uses Link/Navigate */}
        <AuthContext.Provider value={mockAuthContext}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );

    // Check if the email and password input fields are present
    expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Check if the login button is present
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();

    // Check for "Forgot Password?" link (if you have one, remove if not)
    // expect(screen.getByText(/Forgot Password?/i)).toBeInTheDocument();

    // Check for "Don't have an account?" link
    expect(screen.getByText(/Need an account?/i)).toBeInTheDocument();
  });
});