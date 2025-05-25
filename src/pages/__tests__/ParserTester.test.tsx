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

  describe('Component Rendering', () => {
    it('renders the main components', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByText('Fluent Bit Parser Tester')).toBeInTheDocument();
      expect(screen.getByText('📚 Parser Library')).toBeInTheDocument();
      expect(screen.getByText('Parser Configuration')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your regex pattern...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter the log line to test...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Test Parser/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear/ })).toBeInTheDocument();
    });

    it('renders parser library categories', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByText('Web Logs')).toBeInTheDocument();
      expect(screen.getByText('System Logs')).toBeInTheDocument();
      expect(screen.getByText('Application Logs')).toBeInTheDocument();
      expect(screen.getByText('Database Logs')).toBeInTheDocument();
    });

    it('shows web logs category expanded by default', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByText('Apache Common Log')).toBeInTheDocument();
      expect(screen.getByText('Apache Combined Log')).toBeInTheDocument();
      expect(screen.getByText('Nginx Access Log')).toBeInTheDocument();
      expect(screen.getByText('IIS Log')).toBeInTheDocument();
    });

    it('has Apache Common Log selected by default', () => {
      renderWithProviders(<ParserTester />);
      
      const apacheButton = screen.getByText('Apache Common Log').closest('button');
      expect(apacheButton).toHaveStyle('background: rgb(219, 234, 254)');
    });
  });

  describe('Pattern Library Functionality', () => {
    it('expands and collapses categories', async () => {
      renderWithProviders(<ParserTester />);
      
      const systemLogsButton = screen.getByText('System Logs').closest('button');
      
      // Initially collapsed
      expect(screen.queryByText('Standard Syslog')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(systemLogsButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Standard Syslog')).toBeInTheDocument();
        expect(screen.getByText('Auth.log')).toBeInTheDocument();
        expect(screen.getByText('Kernel Log')).toBeInTheDocument();
      });
      
      // Click to collapse
      fireEvent.click(systemLogsButton!);
      
      await waitFor(() => {
        expect(screen.queryByText('Standard Syslog')).not.toBeInTheDocument();
      });
    });

    it('loads pattern when clicked', async () => {
      renderWithProviders(<ParserTester />);
      
      const nginxButton = screen.getByText('Nginx Access Log').closest('button');
      fireEvent.click(nginxButton!);
      
      await waitFor(() => {
        const regexInput = screen.getByPlaceholderText('Enter your regex pattern...') as HTMLTextAreaElement;
        const timeFormatInput = screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z') as HTMLInputElement;
        const testStringInput = screen.getByPlaceholderText('Enter the log line to test...') as HTMLTextAreaElement;
        
        expect(regexInput.value).toContain('(?<remote>');
        expect(timeFormatInput.value).toBe('%d/%b/%Y:%H:%M:%S %z');
        expect(testStringInput.value).toContain('192.168.1.1 example.com');
      });
    });

    it('updates selected pattern visual state', async () => {
      renderWithProviders(<ParserTester />);
      
      const nginxButton = screen.getByText('Nginx Access Log').closest('button');
      fireEvent.click(nginxButton!);
      
      await waitFor(() => {
        expect(nginxButton).toHaveStyle('background: rgb(219, 234, 254)');
      });
    });

    it('loads different category patterns correctly', async () => {
      renderWithProviders(<ParserTester />);
      
      // Expand system logs
      const systemLogsButton = screen.getByText('System Logs').closest('button');
      fireEvent.click(systemLogsButton!);
      
      await waitFor(() => {
        const syslogButton = screen.getByText('Standard Syslog').closest('button');
        fireEvent.click(syslogButton!);
      });
      
      await waitFor(() => {
        const regexInput = screen.getByPlaceholderText('Enter your regex pattern...') as HTMLTextAreaElement;
        const testStringInput = screen.getByPlaceholderText('Enter the log line to test...') as HTMLTextAreaElement;
        
        expect(regexInput.value).toContain('(?<time>');
        expect(regexInput.value).toContain('(?<host>');
        expect(testStringInput.value).toContain('Oct 10 13:55:36 myhost sshd');
      });
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty regex', async () => {
      renderWithProviders(<ParserTester />);
      
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...');
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      
      fireEvent.change(regexInput, { target: { value: '' } });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Regex pattern is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty test string', async () => {
      renderWithProviders(<ParserTester />);
      
      const testStringInput = screen.getByPlaceholderText('Enter the log line to test...');
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      
      fireEvent.change(testStringInput, { target: { value: '' } });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test string is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid regex', async () => {
      renderWithProviders(<ParserTester />);
      
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...');
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      
      fireEvent.change(regexInput, { target: { value: '/[invalid regex(' } });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid regex pattern/)).toBeInTheDocument();
      });
    });

    it('validates time format', async () => {
      renderWithProviders(<ParserTester />);
      
      const timeFormatInput = screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z');
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      
      // Set a valid regex and test string first
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...');
      const testStringInput = screen.getByPlaceholderText('Enter the log line to test...');
      
      fireEvent.change(regexInput, { target: { value: '/(?<test>.*)/' } });
      fireEvent.change(testStringInput, { target: { value: 'test string' } });
      fireEvent.change(timeFormatInput, { target: { value: '%Y-%m-%d' } });
      
      fireEvent.click(testButton);
      
      // Should not show time format error for valid format
      await waitFor(() => {
        expect(screen.queryByText(/Invalid time format/)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
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
        expect(screen.getByText('✅')).toBeInTheDocument();
        expect(screen.getByText('Parser Results')).toBeInTheDocument();
        expect(screen.getByText('🕐')).toBeInTheDocument();
        expect(screen.getByText('Parsed Timestamp')).toBeInTheDocument();
        expect(screen.getByText('2000/10/10 20:55:36 +0000')).toBeInTheDocument();
        expect(screen.getByText('Extracted Fields (6)')).toBeInTheDocument();
        expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
        expect(screen.getByText('frank')).toBeInTheDocument();
      });
    });

    it('displays parsing errors when returned by API', async () => {
      const mockResponse = {
        result: {
          errors: ['Failed to parse timestamp', 'Invalid regex pattern'],
          parsed: {},
          parsed_time: undefined
        }
      };

      vi.mocked(parserApi.testParser).mockResolvedValue(mockResponse);

      renderWithProviders(<ParserTester />);
      
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Parsing Errors')).toBeInTheDocument();
        expect(screen.getByText('Failed to parse timestamp')).toBeInTheDocument();
        expect(screen.getByText('Invalid regex pattern')).toBeInTheDocument();
      });
    });

    it('handles API network errors', async () => {
      vi.mocked(parserApi.testParser).mockRejectedValue(new Error('Network error: Unable to reach the parser API'));

      renderWithProviders(<ParserTester />);
      
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error: Unable to reach the parser API/)).toBeInTheDocument();
      });
    });

    it('handles API timeout errors', async () => {
      vi.mocked(parserApi.testParser).mockRejectedValue(new Error('Request timeout'));

      renderWithProviders(<ParserTester />);
      
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Request timeout/)).toBeInTheDocument();
      });
    });

    it('handles API server errors', async () => {
      vi.mocked(parserApi.testParser).mockRejectedValue(new Error('API Error (500): Internal server error'));

      renderWithProviders(<ParserTester />);
      
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });
    });

    it('shows loading state during API call', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise<parserApi.ParserTestResponse>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(parserApi.testParser).mockReturnValue(promise);

      renderWithProviders(<ParserTester />);
      
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      // Should show loading state
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Testing...')).toBeInTheDocument();
      expect(testButton).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({
        result: { errors: [], parsed: {}, parsed_time: undefined }
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
        expect(testButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Actions', () => {
    it('clears form when clear button is clicked', () => {
      renderWithProviders(<ParserTester />);
      
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...') as HTMLTextAreaElement;
      const timeFormatInput = screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z') as HTMLInputElement;
      const testStringInput = screen.getByPlaceholderText('Enter the log line to test...') as HTMLTextAreaElement;
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

    it('clears results when clear button is clicked', async () => {
      const mockResponse = {
        result: {
          errors: [],
          parsed: { test: 'value' },
          parsed_time: '2023-01-01T12:00:00Z'
        }
      };

      vi.mocked(parserApi.testParser).mockResolvedValue(mockResponse);

      renderWithProviders(<ParserTester />);
      
      // First test to get results
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Parser Results')).toBeInTheDocument();
      });
      
      // Then clear
      const clearButton = screen.getByRole('button', { name: /Clear/ });
      fireEvent.click(clearButton);
      
      expect(screen.queryByText('Parser Results')).not.toBeInTheDocument();
      expect(screen.getByText('Ready to Test')).toBeInTheDocument();
    });

    it('clears errors when clear button is clicked', async () => {
      renderWithProviders(<ParserTester />);
      
      // Trigger an error
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...');
      const testButton = screen.getByRole('button', { name: /Test Parser/ });
      
      fireEvent.change(regexInput, { target: { value: '' } });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Regex pattern is required')).toBeInTheDocument();
      });
      
      // Clear the form
      const clearButton = screen.getByRole('button', { name: /Clear/ });
      fireEvent.click(clearButton);
      
      expect(screen.queryByText('Regex pattern is required')).not.toBeInTheDocument();
    });
  });

  describe('VSCode Styling', () => {
    it('applies VSCode-style input styling', () => {
      renderWithProviders(<ParserTester />);
      
      const regexInput = screen.getByPlaceholderText('Enter your regex pattern...');
      const timeFormatInput = screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z');
      const testStringInput = screen.getByPlaceholderText('Enter the log line to test...');
      
      // Check for dark background and monospace font
      expect(regexInput).toHaveStyle('background: rgb(30, 30, 30)');
      expect(regexInput).toHaveStyle('color: rgb(212, 212, 212)');
      expect(regexInput).toHaveStyle("font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace");
      
      expect(timeFormatInput).toHaveStyle('background: rgb(30, 30, 30)');
      expect(testStringInput).toHaveStyle('background: rgb(30, 30, 30)');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form inputs', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByPlaceholderText('Enter your regex pattern...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter the log line to test...')).toBeInTheDocument();
    });

    it('has proper button roles and names', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByRole('button', { name: /Test Parser/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear/ })).toBeInTheDocument();
    });

    it('provides helpful placeholder text', () => {
      renderWithProviders(<ParserTester />);
      
      expect(screen.getByPlaceholderText('Enter your regex pattern...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., %d/%b/%Y:%H:%M:%S %z')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter the log line to test...')).toBeInTheDocument();
    });
  });
}); 