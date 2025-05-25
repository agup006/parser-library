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

const ParserTester: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.app);
  
  const [regex, setRegex] = useState('/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\\\"]*)\" \"(?<agent>.*)\")?$/');
  const [timeFormat, setTimeFormat] = useState('%d/%b/%Y:%H:%M:%S %z');
  const [testString, setTestString] = useState('127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"');
  const [result, setResult] = useState<ParsedResult | null>(null);

  const validateRegex = (regexString: string): boolean => {
    try {
      new RegExp(regexString.replace(/^\/|\/$/g, ''));
      return true;
    } catch {
      return false;
    }
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
      dispatch(setError('Invalid regex pattern'));
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
      dispatch(setError(err instanceof Error ? err.message : 'Failed to test parser'));
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

  const loadExample = (type: 'apache' | 'nginx' | 'json' | 'syslog') => {
    switch (type) {
      case 'apache':
        setRegex('/^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\\\"]*)\" \"(?<agent>.*)\")?$/');
        setTimeFormat('%d/%b/%Y:%H:%M:%S %z');
        setTestString('127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"');
        break;
      case 'nginx':
        setRegex('/^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] \"(?<method>\\S+)(?: +(?<path>[^\"]*?)(?: +\\S*)?)?\" (?<code>[^ ]*) (?<size>[^ ]*)(?: \"(?<referer>[^\"]*)\" \"(?<agent>[^\"]*)\")?$/');
        setTimeFormat('%d/%b/%Y:%H:%M:%S %z');
        setTestString('192.168.1.1 example.com user [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 1234 "http://example.com" "Mozilla/5.0"');
        break;
      case 'json':
        setRegex('/^(?<log>.*)$/');
        setTimeFormat('');
        setTestString('{"timestamp":"2023-01-01T12:00:00Z","level":"INFO","message":"Application started","service":"web-server"}');
        break;
      case 'syslog':
        setRegex('/^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<ident>[a-zA-Z0-9_\\/\\.\\-]*)(?:\\[(?<pid>[0-9]+)\\])?(?:[^\\:]*\\:)? *(?<message>.*)$/');
        setTimeFormat('%b %d %H:%M:%S');
        setTestString('Oct 10 13:55:36 myhost sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2');
        break;
    }
    setResult(null);
    dispatch(setError(null));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0e7ff 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
            {/* Quick Examples */}
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                📄 Quick Examples
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={() => loadExample('apache')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: '0.5rem', border: '1px solid #93c5fd', cursor: 'pointer' }}
                >
                  Apache Log
                </button>
                <button
                  onClick={() => loadExample('nginx')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#dcfce7', color: '#166534', borderRadius: '0.5rem', border: '1px solid #86efac', cursor: 'pointer' }}
                >
                  Nginx Log
                </button>
                <button
                  onClick={() => loadExample('json')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '0.5rem', border: '1px solid #c4b5fd', cursor: 'pointer' }}
                >
                  JSON Log
                </button>
                <button
                  onClick={() => loadExample('syslog')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#fed7aa', color: '#ea580c', borderRadius: '0.5rem', border: '1px solid #fdba74', cursor: 'pointer' }}
                >
                  Syslog
                </button>
              </div>
            </div>

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
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none' }}
                    rows={4}
                    placeholder="Enter your regex pattern..."
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
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
                    placeholder="e.g., %d/%b/%Y:%H:%M:%S %z"
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
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'none' }}
                    rows={3}
                    placeholder="Enter the log line to test..."
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
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem' }}>
                      <p style={{ color: '#166534', fontFamily: 'monospace', fontSize: '0.875rem', margin: 0 }}>{result.parsed_time}</p>
                    </div>
                  </div>
                )}

                {/* Parsed Fields */}
                {result.parsed && Object.keys(result.parsed).length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem' }}>
                      Extracted Fields ({Object.keys(result.parsed).length})
                    </h3>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Field Name
                              </th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Extracted Value
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(result.parsed).map(([key, value]) => (
                              <tr key={key} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: '#111827', background: '#dbeafe' }}>
                                  {key}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-all' }}>
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
                    Configure your regex pattern and test string, then click "Test Parser" to see the results.
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
  );
};

export default ParserTester; 