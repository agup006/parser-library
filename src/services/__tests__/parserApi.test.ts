import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { testParser } from '../parserApi';
import type { ParserTestRequest, ParserTestResponse } from '../parserApi';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('parserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testParser', () => {
    const mockRequest: ParserTestRequest = {
      regex: '/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\]/',
      timeFormat: '%d/%b/%Y:%H:%M:%S %z',
      testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /test.html HTTP/1.0"'
    };

    const mockSuccessResponse: ParserTestResponse = {
      result: {
        errors: [],
        parsed: {
          host: '127.0.0.1',
          user: 'frank',
          time: '10/Oct/2000:13:55:36 -0700'
        },
        parsed_time: '2000/10/10 20:55:36 +0000'
      }
    };

    it('makes successful API call with all parameters', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await testParser(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/parser',
        {
          regex: mockRequest.regex,
          testString: mockRequest.testString,
          timeFormat: mockRequest.timeFormat
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      expect(result).toEqual(mockSuccessResponse);
    });

    it('makes API call without optional timeFormat', async () => {
      const requestWithoutTimeFormat: ParserTestRequest = {
        regex: mockRequest.regex,
        testString: mockRequest.testString
      };

      mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

      await testParser(requestWithoutTimeFormat);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/parser',
        {
          regex: requestWithoutTimeFormat.regex,
          testString: requestWithoutTimeFormat.testString
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    });

    it('handles empty timeFormat correctly', async () => {
      const requestWithEmptyTimeFormat: ParserTestRequest = {
        regex: mockRequest.regex,
        testString: mockRequest.testString,
        timeFormat: ''
      };

      mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

      await testParser(requestWithEmptyTimeFormat);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/parser',
        {
          regex: requestWithEmptyTimeFormat.regex,
          testString: requestWithEmptyTimeFormat.testString
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    });

    it('returns parsed results with errors', async () => {
      const responseWithErrors: ParserTestResponse = {
        result: {
          errors: ['Failed to parse timestamp', 'Invalid regex pattern'],
          parsed: {},
          parsed_time: undefined
        }
      };

      mockedAxios.post.mockResolvedValue({ data: responseWithErrors });

      const result = await testParser(mockRequest);

      expect(result).toEqual(responseWithErrors);
      expect(result.result.errors).toHaveLength(2);
      expect(result.result.errors).toContain('Failed to parse timestamp');
      expect(result.result.errors).toContain('Invalid regex pattern');
    });

    it('returns partial parsing results', async () => {
      const partialResponse: ParserTestResponse = {
        result: {
          errors: ['Could not parse time field'],
          parsed: {
            host: '127.0.0.1',
            user: 'frank'
          },
          parsed_time: undefined
        }
      };

      mockedAxios.post.mockResolvedValue({ data: partialResponse });

      const result = await testParser(mockRequest);

      expect(result).toEqual(partialResponse);
      expect(Object.keys(result.result.parsed)).toHaveLength(2);
      expect(result.result.parsed_time).toBeUndefined();
    });

    describe('Error Handling', () => {
      it('handles server error responses with message', async () => {
        const errorResponse = {
          response: {
            status: 400,
            data: {
              message: 'Invalid regex pattern provided'
            }
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'API Error (400): Invalid regex pattern provided'
        );
      });

      it('handles server error responses with error field', async () => {
        const errorResponse = {
          response: {
            status: 500,
            data: {
              error: 'Internal server error'
            }
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'API Error (500): Internal server error'
        );
      });

      it('handles server error responses without specific message', async () => {
        const errorResponse = {
          response: {
            status: 422,
            data: {}
          }
        };

        mockedAxios.post.mockRejectedValue(errorResponse);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'API Error (422): Server error occurred'
        );
      });

      it('handles network errors', async () => {
        const networkError = {
          request: {},
          message: 'Network Error'
        };

        mockedAxios.post.mockRejectedValue(networkError);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'Network error: Unable to reach the parser API'
        );
      });

      it('handles timeout errors', async () => {
        const timeoutError = {
          code: 'ECONNABORTED',
          message: 'timeout of 10000ms exceeded'
        };

        mockedAxios.post.mockRejectedValue(timeoutError);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'Request error: timeout of 10000ms exceeded'
        );
      });

      it('handles generic request errors', async () => {
        const genericError = {
          message: 'Something went wrong'
        };

        mockedAxios.post.mockRejectedValue(genericError);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'Request error: Something went wrong'
        );
      });

      it('handles non-axios errors', async () => {
        const nonAxiosError = new Error('Unexpected error');

        mockedAxios.post.mockRejectedValue(nonAxiosError);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'An unexpected error occurred while testing the parser'
        );
      });

      it('handles errors without message', async () => {
        const errorWithoutMessage = {};

        mockedAxios.post.mockRejectedValue(errorWithoutMessage);

        await expect(testParser(mockRequest)).rejects.toThrow(
          'An unexpected error occurred while testing the parser'
        );
      });
    });

    describe('Request Configuration', () => {
      it('sets correct headers', async () => {
        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(mockRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
            }
          })
        );
      });

      it('sets correct timeout', async () => {
        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(mockRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            timeout: 10000
          })
        );
      });

      it('uses correct API endpoint', async () => {
        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(mockRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    describe('Edge Cases', () => {
      it('handles empty regex pattern', async () => {
        const emptyRegexRequest: ParserTestRequest = {
          regex: '',
          testString: 'test string'
        };

        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(emptyRegexRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          {
            regex: '',
            testString: 'test string'
          },
          expect.any(Object)
        );
      });

      it('handles empty test string', async () => {
        const emptyTestStringRequest: ParserTestRequest = {
          regex: '/test/',
          testString: ''
        };

        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(emptyTestStringRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          {
            regex: '/test/',
            testString: ''
          },
          expect.any(Object)
        );
      });

      it('handles complex regex patterns', async () => {
        const complexRegexRequest: ParserTestRequest = {
          regex: '/^(?<timestamp>\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z) (?<level>\\w+) (?<service>\\w+) (?<message>.*)$/',
          testString: '2023-01-01T12:00:00.123Z INFO web-server Application started',
          timeFormat: '%Y-%m-%dT%H:%M:%S'
        };

        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(complexRegexRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          {
            regex: complexRegexRequest.regex,
            testString: complexRegexRequest.testString,
            timeFormat: complexRegexRequest.timeFormat
          },
          expect.any(Object)
        );
      });

      it('handles unicode characters in test string', async () => {
        const unicodeRequest: ParserTestRequest = {
          regex: '/^(?<message>.*)$/',
          testString: 'Test with unicode: 你好世界 🌍 émojis'
        };

        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(unicodeRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          {
            regex: unicodeRequest.regex,
            testString: unicodeRequest.testString
          },
          expect.any(Object)
        );
      });

      it('handles very long test strings', async () => {
        const longTestString = 'a'.repeat(10000);
        const longStringRequest: ParserTestRequest = {
          regex: '/^(?<data>.*)$/',
          testString: longTestString
        };

        mockedAxios.post.mockResolvedValue({ data: mockSuccessResponse });

        await testParser(longStringRequest);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/parser',
          {
            regex: longStringRequest.regex,
            testString: longTestString
          },
          expect.any(Object)
        );
      });
    });

    describe('Response Validation', () => {
      it('handles response with all fields populated', async () => {
        const fullResponse: ParserTestResponse = {
          result: {
            errors: [],
            parsed: {
              field1: 'value1',
              field2: 'value2',
              field3: 'value3'
            },
            parsed_time: '2023-01-01T12:00:00Z'
          }
        };

        mockedAxios.post.mockResolvedValue({ data: fullResponse });

        const result = await testParser(mockRequest);

        expect(result.result.errors).toEqual([]);
        expect(Object.keys(result.result.parsed)).toHaveLength(3);
        expect(result.result.parsed_time).toBe('2023-01-01T12:00:00Z');
      });

      it('handles response with only errors', async () => {
        const errorOnlyResponse: ParserTestResponse = {
          result: {
            errors: ['Parse failed'],
            parsed: {},
            parsed_time: undefined
          }
        };

        mockedAxios.post.mockResolvedValue({ data: errorOnlyResponse });

        const result = await testParser(mockRequest);

        expect(result.result.errors).toEqual(['Parse failed']);
        expect(Object.keys(result.result.parsed)).toHaveLength(0);
        expect(result.result.parsed_time).toBeUndefined();
      });

      it('handles response with null/undefined values', async () => {
        const nullResponse: ParserTestResponse = {
          result: {
            errors: [],
            parsed: {
              field1: 'value1',
              field2: '',
              field3: 'null'
            },
            parsed_time: undefined
          }
        };

        mockedAxios.post.mockResolvedValue({ data: nullResponse });

        const result = await testParser(mockRequest);

        expect(result.result.parsed.field2).toBe('');
        expect(result.result.parsed.field3).toBe('null');
        expect(result.result.parsed_time).toBeUndefined();
      });
    });
  });
}); 