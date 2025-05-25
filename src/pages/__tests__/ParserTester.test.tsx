import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store';
import ParserTester from '../ParserTester';
import * as parserApi from '../../services/parserApi';

// Mock the parser API
vi.mock('../../services/parserApi');

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('ParserTester', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the parser tester form', () => {
    renderWithProviders(<ParserTester />);
    
    expect(screen.getByText('Fluent Bit Regex Parser Tester')).toBeInTheDocument();
    expect(screen.getByLabelText(/Regex Pattern/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Format/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Test String/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test Parser/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/ })).toBeInTheDocument();
  });

  it('shows validation error for empty regex', async () => {
    renderWithProviders(<ParserTester />);
    
    const regexInput = screen.getByLabelText(/Regex Pattern/);
    const testButton = screen.getByRole('button', { name: /Test Parser/ });
    
    // Clear the regex input
    fireEvent.change(regexInput, { target: { value: '' } });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Regex pattern is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty test string', async () => {
    renderWithProviders(<ParserTester />);
    
    const testStringInput = screen.getByLabelText(/Test String/);
    const testButton = screen.getByRole('button', { name: /Test Parser/ });
    
    // Clear the test string input
    fireEvent.change(testStringInput, { target: { value: '' } });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test string is required')).toBeInTheDocument();
    });
  });

  it('calls API and displays results on successful test', async () => {
    const mockResponse = {
      result: {
        errors: [],
        parsed: {
          host: '127.0.0.1',
          user: 'frank',
          method: 'GET',
          path: '/apache_pb.gif',
          code: '200',
          size: '2326'
        },
        parsed_time: '2000/10/10 20:55:36 +0000'
      }
    };

    vi.mocked(parserApi.testParser).mockResolvedValue(mockResponse);

    renderWithProviders(<ParserTester />);
    
    const testButton = screen.getByRole('button', { name: /Test Parser/ });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parser Results')).toBeInTheDocument();
      expect(screen.getByText('Parsed Time')).toBeInTheDocument();
      expect(screen.getByText('2000/10/10 20:55:36 +0000')).toBeInTheDocument();
      expect(screen.getByText('Parsed Fields')).toBeInTheDocument();
      expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
      expect(screen.getByText('frank')).toBeInTheDocument();
    });
  });

  it('clears form when clear button is clicked', () => {
    renderWithProviders(<ParserTester />);
    
    const regexInput = screen.getByLabelText(/Regex Pattern/) as HTMLTextAreaElement;
    const timeFormatInput = screen.getByLabelText(/Time Format/) as HTMLInputElement;
    const testStringInput = screen.getByLabelText(/Test String/) as HTMLTextAreaElement;
    const clearButton = screen.getByRole('button', { name: /Clear/ });
    
    // Verify inputs have initial values
    expect(regexInput.value).not.toBe('');
    expect(timeFormatInput.value).not.toBe('');
    expect(testStringInput.value).not.toBe('');
    
    fireEvent.click(clearButton);
    
    // Verify inputs are cleared
    expect(regexInput.value).toBe('');
    expect(timeFormatInput.value).toBe('');
    expect(testStringInput.value).toBe('');
  });
}); 