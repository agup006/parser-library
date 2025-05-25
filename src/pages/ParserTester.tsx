import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLoading, setError } from '../store';
import { testParser } from '../services/parserApi';
import { PlayIcon, TrashIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ParsedResult {
  errors: string[];
  parsed: Record<string, string>;
  parsed_time?: string;
}

interface ParserPattern {
  id: string;
  name: string;
  regex: string;
  timeFormat: string;
  testString: string;
  description: string;
}

interface PatternCategory {
  id: string;
  name: string;
  icon: string;
  patterns: ParserPattern[];
}

const ParserTester: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.app);
  
  const [regex, setRegex] = useState('/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\\\"]*)\" \"(?<agent>.*)\")?$/');
  const [timeFormat, setTimeFormat] = useState('%d/%b/%Y:%H:%M:%S %z');
  const [testString, setTestString] = useState('127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"');
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['web-logs']));
  const [selectedPattern, setSelectedPattern] = useState<string>('apache-common');

  // Parser pattern library
  const patternLibrary: PatternCategory[] = [
    {
      id: 'web-logs',
      name: 'Web Logs',
      icon: '🌐',
      patterns: [
        {
          id: 'apache-common',
          name: 'Apache Common Log',
          description: 'Standard Apache access log format',
          regex: '/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)$/',
          timeFormat: '%d/%b/%Y:%H:%M:%S %z',
          testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326'
        },
        {
          id: 'apache-combined',
          name: 'Apache Combined Log',
          description: 'Apache access log with referer and user agent',
          regex: '/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\\\"]*)\" \"(?<agent>.*)\")?$/',
          timeFormat: '%d/%b/%Y:%H:%M:%S %z',
          testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"'
        },
        {
          id: 'nginx-access',
          name: 'Nginx Access Log',
          description: 'Standard Nginx access log format',
          regex: '/^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^\"]*?)(?: +\\S*)?)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\"]*)\" \"(?<agent>[^\"]*)\")?$/',
          timeFormat: '%d/%b/%Y:%H:%M:%S %z',
          testString: '192.168.1.1 example.com user [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 1234 "http://example.com" "Mozilla/5.0"'
        },
        {
          id: 'iis-log',
          name: 'IIS Log',
          description: 'Microsoft IIS web server log format',
          regex: '/^(?<date>[^ ]+) (?<time>[^ ]+) (?<s_ip>[^ ]+) (?<cs_method>[^ ]+) (?<cs_uri_stem>[^ ]+) (?<cs_uri_query>[^ ]+) (?<s_port>[^ ]+) (?<cs_username>[^ ]+) (?<c_ip>[^ ]+) (?<cs_user_agent>[^ ]+) (?<sc_status>[^ ]+) (?<sc_substatus>[^ ]+) (?<sc_win32_status>[^ ]+) (?<time_taken>[^ ]+)$/',
          timeFormat: '',
          testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0+(compatible;+MSIE+9.0;+Windows+NT+6.1) 200 0 0 1234'
        }
      ]
    },
    {
      id: 'system-logs',
      name: 'System Logs',
      icon: '🖥️',
      patterns: [
        {
          id: 'syslog',
          name: 'Standard Syslog',
          description: 'RFC3164 syslog format',
          regex: '/^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<ident>[a-zA-Z0-9_\\/\\.\\-]*)(?:\\[(?<pid>[0-9]+)\\])?(?:[^\\:]*\\:)? *(?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: 'Oct 10 13:55:36 myhost sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2'
        },
        {
          id: 'auth-log',
          name: 'Auth.log',
          description: 'Linux authentication log format',
          regex: '/^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<service>[^\\[]*)(\\[(?<pid>[0-9]+)\\])?: (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: 'Oct 10 13:55:36 server sudo[12345]: user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/bin/ls'
        },
        {
          id: 'kern-log',
          name: 'Kernel Log',
          description: 'Linux kernel log format',
          regex: '/^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) kernel: \\[(?<timestamp>[^\\]]+)\\] (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: 'Oct 10 13:55:36 server kernel: [12345.678901] USB disconnect, address 1'
        }
      ]
    },
    {
      id: 'application-logs',
      name: 'Application Logs',
      icon: '📱',
      patterns: [
        {
          id: 'json-log',
          name: 'JSON Structured',
          description: 'Structured JSON application logs',
          regex: '/^(?<log>.*)$/',
          timeFormat: '',
          testString: '{"timestamp":"2023-01-01T12:00:00Z","level":"INFO","message":"Application started","service":"web-server","request_id":"abc123"}'
        },
        {
          id: 'docker-log',
          name: 'Docker Container',
          description: 'Docker container log format',
          regex: '/^(?<time>[^ ]+) (?<container_id>[^ ]+) (?<container_name>[^ ]+): (?<message>.*)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%S',
          testString: '2023-01-01T12:00:00.123456Z a1b2c3d4e5f6 web-server: Starting application on port 8080'
        },
        {
          id: 'k8s-log',
          name: 'Kubernetes Pod',
          description: 'Kubernetes pod log format',
          regex: '/^(?<time>[^ ]+) (?<stream>[^ ]+) (?<log_type>[^ ]+) (?<message>.*)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%S',
          testString: '2023-01-01T12:00:00.123456Z stdout F {"level":"info","msg":"Server started","port":8080}'
        }
      ]
    },
    {
      id: 'database-logs',
      name: 'Database Logs',
      icon: '🗄️',
      patterns: [
        {
          id: 'mysql-error',
          name: 'MySQL Error Log',
          description: 'MySQL database error log format',
          regex: '/^(?<time>[^ ]* [^ ]*) (?<thread_id>[^ ]*) \\[(?<level>[^\\]]+)\\] (?<message>.*)$/',
          timeFormat: '%Y-%m-%d %H:%M:%S',
          testString: '2023-01-01 12:00:00 123 [ERROR] Access denied for user \'root\'@\'localhost\' (using password: YES)'
        },
        {
          id: 'postgresql-log',
          name: 'PostgreSQL Log',
          description: 'PostgreSQL database log format',
          regex: '/^(?<time>[^ ]* [^ ]*) \\[(?<pid>[0-9]+)\\] (?<level>[^:]*): (?<message>.*)$/',
          timeFormat: '%Y-%m-%d %H:%M:%S',
          testString: '2023-01-01 12:00:00 [1234] ERROR: relation "users" does not exist at character 15'
        },
        {
          id: 'mongodb-log',
          name: 'MongoDB Log',
          description: 'MongoDB database log format',
          regex: '/^(?<time>[^ ]+) (?<severity>[^ ]+) (?<component>[^ ]+) \\[(?<context>[^\\]]+)\\] (?<message>.*)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%S',
          testString: '2023-01-01T12:00:00.123+0000 I NETWORK [listener] connection accepted from 127.0.0.1:54321 #1 (1 connection now open)'
        }
      ]
    }
  ];

  // VSCode-style input styling
  const vscodeInputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: '#1e1e1e',
    color: '#d4d4d4',
    border: '1px solid #3c3c3c',
    borderRadius: '0.25rem',
    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    resize: 'none' as const,
  };

  const vscodeInputFocusStyle = {
    borderColor: '#007acc',
    boxShadow: '0 0 0 1px #007acc',
  };

  const validateRegex = (regexString: string): boolean => {
    try {
      // Remove leading/trailing slashes if present
      const cleanRegex = regexString.replace(/^\/|\/$/g, '');
      // Test if the regex is valid
      new RegExp(cleanRegex);
      return true;
    } catch (error) {
      console.error('Regex validation error:', error);
      return false;
    }
  };

  const validateTimeFormat = (timeFormat: string): boolean => {
    if (!timeFormat || timeFormat.trim() === '') {
      return true; // Empty time format is valid
    }
    
    // Check for potentially problematic time format specifiers
    const problematicFormats = ['%f', '%z', '%Z'];
    const hasProblematicFormat = problematicFormats.some(format => timeFormat.includes(format));
    
    if (hasProblematicFormat) {
      console.warn('Time format contains potentially unsupported specifiers:', timeFormat);
    }
    
    return true; // For now, allow all formats but warn about problematic ones
  };

  const handleTest = async () => {
    setResult(null);
    dispatch(setError(null));

    if (!regex.trim()) {
      dispatch(setError('Regex pattern is required'));
      return;
    }

    if (!testString.trim()) {
      dispatch(setError('Test string is required'));
      return;
    }

    if (!validateRegex(regex)) {
      dispatch(setError('Invalid regex pattern. Please check your syntax and escape special characters properly.'));
      return;
    }

    if (!validateTimeFormat(timeFormat)) {
      dispatch(setError('Invalid time format. Please check your time format specifiers.'));
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await testParser({
        regex,
        timeFormat: timeFormat.trim() || undefined,
        testString,
      });
      setResult(response.result);
    } catch (err) {
      console.error('Parser test error:', err);
      if (err instanceof Error) {
        // Provide more specific error messages
        if (err.message.includes('Network error')) {
          dispatch(setError('Network error: Unable to reach the parser API. Please check your connection.'));
        } else if (err.message.includes('timeout')) {
          dispatch(setError('Request timeout: The parser API took too long to respond. Please try again.'));
        } else if (err.message.includes('500')) {
          dispatch(setError('Server error: The parser API encountered an internal error. Please try a simpler pattern.'));
        } else {
          dispatch(setError(`Parser error: ${err.message}`));
        }
      } else {
        dispatch(setError('An unexpected error occurred while testing the parser. Please try again.'));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleClear = () => {
    setRegex('');
    setTimeFormat('');
    setTestString('');
    setResult(null);
    dispatch(setError(null));
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const loadPattern = (pattern: ParserPattern) => {
    try {
      // Validate the pattern before loading
      if (!validateRegex(pattern.regex)) {
        dispatch(setError(`Invalid regex pattern in ${pattern.name}. Please report this issue.`));
        return;
      }
      
      setRegex(pattern.regex);
      setTimeFormat(pattern.timeFormat);
      setTestString(pattern.testString);
      setSelectedPattern(pattern.id);
      setResult(null);
      dispatch(setError(null));
    } catch (error) {
      console.error('Error loading pattern:', error);
      dispatch(setError(`Failed to load pattern: ${pattern.name}`));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0e7ff 100%)', display: 'flex' }}>
      {/* Sidebar - Parser Library */}
      <div style={{ 
        width: '280px', 
        background: 'white', 
        borderRight: '1px solid #e5e7eb', 
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        <div style={{ padding: '1.5rem 1rem' }}>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            margin: '0 0 1rem 0'
          }}>
            📚 Parser Library
          </h2>
          
          {patternLibrary.map((category) => (
            <div key={category.id} style={{ marginBottom: '0.5rem' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 0.5rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ marginRight: '0.5rem', fontSize: '1rem' }}>
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </span>
                <span style={{ marginRight: '0.5rem' }}>{category.icon}</span>
                <span>{category.name}</span>
              </button>
              
              {/* Category Patterns */}
              {expandedCategories.has(category.id) && (
                <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                  {category.patterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => loadPattern(pattern)}
                      style={{
                        width: '100%',
                        display: 'block',
                        padding: '0.5rem 0.75rem',
                        background: selectedPattern === pattern.id ? '#dbeafe' : 'transparent',
                        border: selectedPattern === pattern.id ? '1px solid #93c5fd' : '1px solid transparent',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: selectedPattern === pattern.id ? '#1d4ed8' : '#6b7280',
                        textAlign: 'left',
                        marginBottom: '0.25rem',
                        transition: 'all 0.15s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPattern !== pattern.id) {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPattern !== pattern.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '0.125rem' }}>
                        {pattern.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        {pattern.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              Fluent Bit Parser Tester
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '32rem', margin: '0 auto' }}>
              Test and validate your Fluent Bit regex parsers with real-time feedback using the Onigmo regex library
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Input Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Input Form */}
              <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>Parser Configuration</h2>
                
                {/* Error Display */}
                {error && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: '#dc2626', marginRight: '0.75rem' }}>⚠️</span>
                    <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Regex Pattern */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Regex Pattern *
                    </label>
                    <textarea
                      value={regex}
                      onChange={(e) => setRegex(e.target.value)}
                      style={vscodeInputStyle}
                      rows={4}
                      placeholder="Enter your regex pattern..."
                      onFocus={(e) => Object.assign(e.target.style, vscodeInputFocusStyle)}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#3c3c3c';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      Use named capture groups like (?&lt;fieldname&gt;pattern) to extract fields
                    </p>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      🕐 Time Format (optional)
                    </label>
                    <input
                      type="text"
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      style={vscodeInputStyle}
                      placeholder="e.g., %d/%b/%Y:%H:%M:%S %z"
                      onFocus={(e) => Object.assign(e.target.style, vscodeInputFocusStyle)}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#3c3c3c';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      Specify time format for parsing timestamps (strptime format)
                    </p>
                  </div>

                  {/* Test String */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Test String *
                    </label>
                    <textarea
                      value={testString}
                      onChange={(e) => setTestString(e.target.value)}
                      style={vscodeInputStyle}
                      rows={3}
                      placeholder="Enter the log line to test..."
                      onFocus={(e) => Object.assign(e.target.style, vscodeInputFocusStyle)}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#3c3c3c';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      Paste a sample log line that matches your regex pattern
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                    <button
                      onClick={handleTest}
                      disabled={isLoading}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '0.75rem 1.5rem', 
                        background: isLoading ? '#9ca3af' : '#2563eb', 
                        color: 'white', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span style={{ marginRight: '0.5rem' }}>⏳</span>
                          Testing...
                        </>
                      ) : (
                        <>
                          <span style={{ marginRight: '0.5rem' }}>▶️</span>
                          Test Parser
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleClear}
                      style={{ 
                        padding: '0.75rem 1.5rem', 
                        background: '#f3f4f6', 
                        color: '#374151', 
                        borderRadius: '0.5rem', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ marginRight: '0.5rem' }}>🗑️</span>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              {result ? (
                <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ color: '#10b981', marginRight: '0.5rem', fontSize: '1.5rem' }}>✅</span>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>Parser Results</h2>
                  </div>
                  
                  {/* Errors */}
                  {result.errors && result.errors.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#dc2626', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '0.25rem' }}>⚠️</span>
                        Parsing Errors
                      </h3>
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem' }}>
                        {result.errors.map((error, index) => (
                          <p key={index} style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed Time */}
                  {result.parsed_time && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '0.25rem' }}>🕐</span>
                        Parsed Timestamp
                      </h3>
                      <div style={{ 
                        background: '#1e1e1e', 
                        border: '1px solid #3c3c3c', 
                        borderRadius: '0.5rem', 
                        padding: '1rem',
                        fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                      }}>
                        <p style={{ color: '#4ec9b0', fontSize: '0.875rem', margin: 0 }}>{result.parsed_time}</p>
                      </div>
                    </div>
                  )}

                  {/* Parsed Fields */}
                  {result.parsed && Object.keys(result.parsed).length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                        Extracted Fields ({Object.keys(result.parsed).length})
                      </h3>
                      <div style={{ background: '#1e1e1e', border: '1px solid #3c3c3c', borderRadius: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#252526', position: 'sticky', top: 0 }}>
                              <tr>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  textAlign: 'left', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '500', 
                                  color: '#cccccc', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em',
                                  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                                }}>
                                  Field Name
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  textAlign: 'left', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '500', 
                                  color: '#cccccc', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em',
                                  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                                }}>
                                  Extracted Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(result.parsed).map(([key, value]) => (
                                <tr key={key} style={{ borderTop: '1px solid #3c3c3c' }}>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    fontSize: '0.875rem', 
                                    fontWeight: '500', 
                                    color: '#9cdcfe', 
                                    background: '#2d2d30',
                                    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace"
                                  }}>
                                    {key}
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    fontSize: '0.875rem', 
                                    color: '#ce9178', 
                                    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace", 
                                    wordBreak: 'break-all' 
                                  }}>
                                    {value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {(!result.parsed || Object.keys(result.parsed).length === 0) && 
                   (!result.errors || result.errors.length === 0) && 
                   !result.parsed_time && (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                      <p style={{ color: '#6b7280', margin: 0 }}>No fields were parsed from the test string.</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>Check your regex pattern and try again.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Placeholder */
                <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>▶️</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>Ready to Test</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Select a pattern from the library or configure your own regex pattern and test string, then click "Test Parser" to see the results.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem', margin: '0 0 1rem 0' }}>About This Tool</h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
                This parser tester uses the Calyptia API with the same Onigmo regex engine that powers Fluent Bit, 
                ensuring your patterns work exactly as expected in production.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <span>✓ Named capture groups</span>
                <span>✓ Time format parsing</span>
                <span>✓ Real-time validation</span>
                <span>✓ Production-ready patterns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParserTester; 