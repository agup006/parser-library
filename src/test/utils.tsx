import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createSlice } from '@reduxjs/toolkit';
import { store } from '../store';
import type { ParserTestResponse } from '../services/parserApi';

// Create a test slice for testing - exported for potential future use
const testAppSlice = createSlice({
  name: 'app',
  initialState: {
    isLoading: false,
    error: null as string | null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

// Export for potential future use
export const testActions = testAppSlice.actions;

// Create a custom render function that includes providers
export const renderWithProviders = (
  ui: React.ReactElement,
  renderOptions: RenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses for testing
export const mockApiResponses = {
  success: {
    result: {
      errors: [],
      parsed: {
        host: '127.0.0.1',
        user: 'frank',
        time: '10/Oct/2000:13:55:36 -0700',
        method: 'GET',
        path: '/apache_pb.gif',
        code: '200',
        size: '2326'
      },
      parsed_time: '2000/10/10 20:55:36 +0000'
    }
  } as ParserTestResponse,

  withErrors: {
    result: {
      errors: ['Failed to parse timestamp', 'Invalid regex pattern'],
      parsed: {},
      parsed_time: undefined
    }
  } as ParserTestResponse,

  partialSuccess: {
    result: {
      errors: ['Could not parse time field'],
      parsed: {
        host: '127.0.0.1',
        user: 'frank'
      },
      parsed_time: undefined
    }
  } as ParserTestResponse,

  empty: {
    result: {
      errors: [],
      parsed: {},
      parsed_time: undefined
    }
  } as ParserTestResponse,

  complexFields: {
    result: {
      errors: [],
      parsed: {
        timestamp: '2023-01-01T12:00:00.123Z',
        level: 'INFO',
        service: 'web-server',
        message: 'Application started successfully',
        request_id: 'abc123',
        user_id: '12345',
        ip_address: '192.168.1.100'
      },
      parsed_time: '2023/01/01 12:00:00 +0000'
    }
  } as ParserTestResponse
};

// Common test patterns and regex examples
export const testPatterns = {
  apache: {
    regex: '/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)$/',
    timeFormat: '%d/%b/%Y:%H:%M:%S %z',
    testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326'
  },
  nginx: {
    regex: '/^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^\"]*?)(?: +\\S*)?)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\"]*)\" \"(?<agent>[^\"]*)\")?$/',
    timeFormat: '%d/%b/%Y:%H:%M:%S %z',
    testString: '192.168.1.1 example.com user [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 1234 "http://example.com" "Mozilla/5.0"'
  },
  syslog: {
    regex: '/^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<ident>[a-zA-Z0-9_\\/\\.\\-]*)(?:\\[(?<pid>[0-9]+)\\])?(?:[^\\:]*\\:)? *(?<message>.*)$/',
    timeFormat: '%b %d %H:%M:%S',
    testString: 'Oct 10 13:55:36 myhost sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2'
  },
  json: {
    regex: '/^(?<log>.*)$/',
    timeFormat: '',
    testString: '{"timestamp":"2023-01-01T12:00:00Z","level":"INFO","message":"Application started","service":"web-server","request_id":"abc123"}'
  },
  invalid: {
    regex: '/[invalid regex(',
    timeFormat: '%Y-%m-%d',
    testString: 'test string'
  }
};

// Helper functions for common test scenarios
export const testHelpers = {
  // Wait for loading to complete
  waitForLoadingToComplete: async (getByText: any) => {
    // Wait for loading indicator to appear and then disappear
    try {
      await getByText('Testing...');
    } catch {
      // Loading might be too fast to catch
    }
  },

  // Fill form with pattern data
  fillFormWithPattern: async (
    getByLabelText: any,
    pattern: typeof testPatterns.apache
  ) => {
    const regexInput = getByLabelText(/Regex Pattern/);
    const timeFormatInput = getByLabelText(/Time Format/);
    const testStringInput = getByLabelText(/Test String/);

    await regexInput.clear();
    await regexInput.type(pattern.regex);
    
    await timeFormatInput.clear();
    await timeFormatInput.type(pattern.timeFormat);
    
    await testStringInput.clear();
    await testStringInput.type(pattern.testString);
  },

  // Clear all form fields
  clearForm: async (getByLabelText: any) => {
    const regexInput = getByLabelText(/Regex Pattern/);
    const timeFormatInput = getByLabelText(/Time Format/);
    const testStringInput = getByLabelText(/Test String/);

    await regexInput.clear();
    await timeFormatInput.clear();
    await testStringInput.clear();
  },

  // Verify form is empty
  expectFormEmpty: (getByLabelText: any, expect: any) => {
    const regexInput = getByLabelText(/Regex Pattern/) as HTMLTextAreaElement;
    const timeFormatInput = getByLabelText(/Time Format/) as HTMLInputElement;
    const testStringInput = getByLabelText(/Test String/) as HTMLTextAreaElement;

    expect(regexInput.value).toBe('');
    expect(timeFormatInput.value).toBe('');
    expect(testStringInput.value).toBe('');
  },

  // Verify results are displayed correctly
  expectResultsDisplayed: (getByText: any, response: ParserTestResponse, expect: any) => {
    expect(getByText('Parser Results')).toBeInTheDocument();
    
    if (response.result.parsed_time) {
      expect(getByText('Parsed Timestamp')).toBeInTheDocument();
      expect(getByText(response.result.parsed_time)).toBeInTheDocument();
    }

    if (response.result.errors && response.result.errors.length > 0) {
      expect(getByText('Parsing Errors')).toBeInTheDocument();
      response.result.errors.forEach(error => {
        expect(getByText(error)).toBeInTheDocument();
      });
    }

    if (response.result.parsed && Object.keys(response.result.parsed).length > 0) {
      const fieldCount = Object.keys(response.result.parsed).length;
      expect(getByText(`Extracted Fields (${fieldCount})`)).toBeInTheDocument();
      
      Object.entries(response.result.parsed).forEach(([key, value]) => {
        expect(getByText(key)).toBeInTheDocument();
        expect(getByText(value)).toBeInTheDocument();
      });
    }
  }
};

// Mock error scenarios
export const mockErrors = {
  networkError: new Error('Network error: Unable to reach the parser API'),
  timeoutError: new Error('Request timeout: The parser API took too long to respond'),
  serverError: new Error('API Error (500): Internal server error'),
  validationError: new Error('Invalid regex pattern provided'),
  genericError: new Error('An unexpected error occurred')
};

// Redux state presets for testing
export const statePresets = {
  initial: {
    app: {
      isLoading: false,
      error: null
    }
  },
  loading: {
    app: {
      isLoading: true,
      error: null
    }
  },
  error: {
    app: {
      isLoading: false,
      error: 'Test error message'
    }
  }
};

// Custom matchers for better test assertions
export const customMatchers = {
  toHaveValidRegex: (received: string) => {
    try {
      // Remove leading/trailing slashes if present
      const cleanRegex = received.replace(/^\/|\/$/g, '');
      new RegExp(cleanRegex);
      return {
        message: () => `Expected ${received} to be an invalid regex`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be a valid regex`,
        pass: false,
      };
    }
  },

  toHaveNamedGroups: (received: string) => {
    const namedGroupPattern = /\(\?\<\w+\>/g;
    const matches = received.match(namedGroupPattern);
    const hasNamedGroups = matches && matches.length > 0;
    
    return {
      message: () => hasNamedGroups 
        ? `Expected ${received} to not have named groups`
        : `Expected ${received} to have named groups`,
      pass: !!hasNamedGroups,
    };
  }
};

// Export everything for easy importing
export * from '@testing-library/react';
export { expect } from 'vitest'; 