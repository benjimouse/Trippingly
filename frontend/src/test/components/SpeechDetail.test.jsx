
// Mock fetch and dependencies BEFORE importing the component
// Mock the emoji-mart v5 Picker to a simple test-friendly component
jest.mock('@emoji-mart/react', () => {
  return ({ onEmojiSelect }) => {
    return (
      <div>
        <button onClick={() => onEmojiSelect({ native: '😀' })}>😀</button>
        <button onClick={() => onEmojiSelect({ native: '😂' })}>😂</button>
      </div>
    );
  };
});
const mockSpeech = {
  name: 'Test Speech',
  content: 'Hello world! This is a test.',
  createdAt: Date.now(),
};

// Capture fetch calls so tests can assert on them
let fetchCalls = [];
globalThis.fetch = jest.fn((url, opts = {}) => {
  fetchCalls.push({ url, opts });
  console.log('MOCK FETCH CALLED:', url);
  if (url.includes('getSpeech')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpeech) });
  }
  if (url.includes('saveEmojiAssociation')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'saved' }) });
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
import { render, screen, fireEvent, within } from '@testing-library/react';
import { act } from 'react';
import SpeechDetail from '../../../src/components/SpeechDetail';
import { waitFor } from '@testing-library/react';

describe('SpeechDetail', () => {
  beforeEach(() => {
  fetch.mockClear();
  fetchCalls = [];
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
  expect(screen.getByText(/Replace with Emoji/)).toBeInTheDocument();
  });


  it('opens emoji picker when button is clicked', async () => {
    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    const contentEl = await screen.findByTestId('speech-content');
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
  fireEvent.click(screen.getByText(/Replace with Emoji/));
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
  fireEvent.click(screen.getByText(/Replace with Emoji/));
  // Click the emoji inside the opened picker modal
  fireEvent.click(within(screen.getByText('Pick an Emoji').parentElement).getByText('😀'));
    expect(screen.queryByText('Replace with Emoji')).not.toBeInTheDocument();
  });

  it('posts emoji association to backend with expected payload', async () => {
    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
    fireEvent.click(screen.getByText(/Replace with Emoji/));
  // Click the emoji inside the opened picker modal
  fireEvent.click(within(screen.getByText('Pick an Emoji').parentElement).getByText('😀'));

    // Wait for the saveEmojiAssociation fetch to be recorded
    await waitFor(() => expect(fetchCalls.find(c => c.url.includes('saveEmojiAssociation'))).toBeDefined());

    const call = fetchCalls.find(c => c.url.includes('saveEmojiAssociation'));
    expect(call.opts.method).toBe('POST');
    const payload = JSON.parse(call.opts.body);
    expect(payload.speechId).toBe('test-id');
    expect(payload.originalText).toBe(mockSpeech.content);
    expect(payload.emoji).toBe('😀');
    expect(payload.position).toBe(0);
    expect(payload.cleanSpeech).toBe(mockSpeech.content);
  // New: ensure assocId was included for idempotent saves
  expect(typeof payload.assocId).toBe('string');
  });

  it('handles saveEmojiAssociation failure gracefully', async () => {
    // Make fetch return ok for getSpeech, but fail for saveEmojiAssociation
    const originalFetch = global.fetch;
    let callCount = 0;
    global.fetch = jest.fn((url, opts = {}) => {
      callCount++;
      if (url.includes('getSpeech')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSpeech) });
      }
      // Simulate server error on save
      if (url.includes('saveEmojiAssociation')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'save failed' }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'error' }) });
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SpeechDetail />);
    await waitFor(() => expect(screen.queryByText('Loading speech details...')).not.toBeInTheDocument());
    await act(async () => {
      window._setSpeechSelection({ start: 0, end: mockSpeech.content.length, text: mockSpeech.content });
    });
    fireEvent.click(screen.getByText(/Replace with Emoji/));
  // Click the emoji inside the opened picker modal
  fireEvent.click(within(screen.getByText('Pick an Emoji').parentElement).getByText('😀'));

    // UI should still reflect the emoji replacement
    const contentEl = await screen.findByTestId('speech-content');
    expect(contentEl.textContent).toContain('😀');

    // save failure should cause console.error to be called inside saveEmojiAssociation catch
    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

    // Restore
    consoleErrorSpy.mockRestore();
    global.fetch = originalFetch;
  });
});
