
// Mock fetch and dependencies BEFORE importing the component
const mockSpeech = {
  name: 'Test Speech',
  content: 'Hello world! This is a test.',
  createdAt: Date.now(),
};

globalThis.fetch = jest.fn((url) => {
  console.log('MOCK FETCH CALLED:', url);
  if (url.includes('getSpeech')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockSpeech),
    });
  }
  return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'error' }) });
});

jest.mock('../../../src/utils/env', () => ({
  VITE_CLOUD_FUNCTION_URL: 'http://localhost',
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ speechId: 'test-id' }),
  useNavigate: () => jest.fn(),
}));
const stableCurrentUser = { getIdToken: async () => 'token' };
jest.mock('../../../src/context/AuthContext', () => {
  const mockCurrentUser = { getIdToken: async () => 'token' };
  return {
    useAuth: () => ({ currentUser: mockCurrentUser })
  };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SpeechDetail from '../../../src/components/SpeechDetail';
import { waitFor } from '@testing-library/react';

describe('SpeechDetail', () => {
  beforeEach(() => {
    fetch.mockClear();
  });


  it('renders speech content', async () => {
    render(<SpeechDetail />);
    // Wait for loading to disappear
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    const contentEl = await screen.findByTestId('speech-content');
    expect(contentEl.textContent).toContain('Hello world! This is a test.');
  });


  it('shows Replace with Emoji button on text selection', async () => {
    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    const contentEl = await screen.findByTestId('speech-content');
    // Directly set selection state for test
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
    expect(screen.getByText('Replace with Emoji')).toBeInTheDocument();
  });


  it('opens emoji picker when button is clicked', async () => {
    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    const contentEl = await screen.findByTestId('speech-content');
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
    fireEvent.click(screen.getByText('Replace with Emoji'));
    expect(screen.getByText('Pick an Emoji')).toBeInTheDocument();
    expect(screen.getByText('😀')).toBeInTheDocument();
  });


  it('clears selection after emoji pick', async () => {
    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    const contentEl = await screen.findByTestId('speech-content');
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
    fireEvent.click(screen.getByText('Replace with Emoji'));
    fireEvent.click(screen.getByText('😀'));
    expect(screen.queryByText('Replace with Emoji')).not.toBeInTheDocument();
  });
});
