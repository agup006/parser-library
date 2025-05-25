import axios from 'axios';

// Use local proxy to avoid CORS issues
const API_BASE_URL = '/api';

export interface ParserTestRequest {
  regex: string;
  timeFormat?: string;
  testString: string;
}

export interface ParsedResult {
  errors: string[];
  parsed: Record<string, string>;
  parsed_time?: string;
}

export interface ParserTestResponse {
  result: ParsedResult;
}

export const testParser = async (request: ParserTestRequest): Promise<ParserTestResponse> => {
  try {
    const payload = {
      regex: request.regex,
      testString: request.testString,
      ...(request.timeFormat && { timeFormat: request.timeFormat }),
    };

    const response = await axios.post<ParserTestResponse>(`${API_BASE_URL}/parser`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
        throw new Error(`API Error (${error.response.status}): ${message}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error: Unable to reach the parser API');
      } else {
        // Something else happened
        throw new Error(`Request error: ${error.message}`);
      }
    } else {
      throw new Error('An unexpected error occurred while testing the parser');
    }
  }
}; 