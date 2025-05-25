#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';

// Parser library data (extracted from ParserTester.tsx)
const parserLibrary = [
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
        regex: '/^(?<date>[^ ]+) (?<time>[^ ]+) (?<s_ip>[^ ]+) (?<cs_method>[^ ]+) (?<cs_uri_stem>[^ ]+) (?<cs_uri_query>[^ ]+) (?<s_port>[^ ]+) (?<cs_username>[^ ]+) (?<c_ip>[^ ]+) (?<cs_user_agent>\\S+) (?<sc_status>[^ ]+) (?<sc_substatus>[^ ]+) (?<sc_win32_status>[^ ]+) (?<time_taken>[^ ]+)$/',
        timeFormat: '',
        testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0+(compatible;+MSIE+9.0;+Windows+NT+6.1) 200 0 0 1234'
      },
      {
        id: 'haproxy',
        name: 'HAProxy',
        description: 'HAProxy load balancer log format',
        regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<client_ip>[^:]+):(?<client_port>\\d+) \\[(?<accept_date>[^\\]]+)\\] (?<frontend_name>[^ ]+) (?<backend_name>[^ ]+) (?<status_code>\\d+) (?<bytes_read>\\d+) (?<request>.*)$/',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 loadbalancer haproxy[1234]: 192.168.1.100:54321 [10/Oct/2000:13:55:36.123] frontend backend 200 1234 "GET /api/health HTTP/1.1"'
      }
    ]
  },
  {
    id: 'cisco-network',
    name: 'Cisco Network',
    icon: '🔧',
    patterns: [
      {
        id: 'cisco-asa',
        name: 'Cisco ASA',
        description: 'Cisco Adaptive Security Appliance logs',
        regex: '/^%ASA-(?<pri>\\d+)-(?<id>\\d+):\\s+(?<message>.*)$/',
        timeFormat: '%b %d %Y %H:%M:%S',
        testString: '%ASA-6-302013: Built inbound TCP connection 12345 for outside:192.168.1.100/1234 (192.168.1.100/1234) to inside:10.0.0.1/80 (10.0.0.1/80)'
      },
      {
        id: 'cisco-ios',
        name: 'Cisco IOS',
        description: 'Cisco IOS router/switch logs',
        regex: '/^<(?<pri>\\d+)>(?<seq>\\d+): (?<time>[^:]+): %(?<facility>\\w+)-(?<severity>\\d+)-(?<mnemonic>\\w+): (?<message>.*)$/',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<189>123: Oct 10 13:55:36: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (192.168.1.100)'
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
      }
    ]
  }
];

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

async function testParser(pattern) {
  try {
    console.log(`Testing ${pattern.name}...`);
    
    const payload = {
      regex: pattern.regex,
      testString: pattern.testString
    };
    
    if (pattern.timeFormat && pattern.timeFormat.trim()) {
      payload.timeFormat = pattern.timeFormat;
    }
    
    const response = await axios.post(API_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    const result = response.data.result;
    
    // Validate the response
    if (!result) {
      throw new Error('No result returned from API');
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`  ⚠️  Warnings: ${result.errors.join(', ')}`);
    }
    
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      console.log(`  ✅ Success: ${Object.keys(result.parsed).length} fields extracted`);
      console.log(`     Fields: ${Object.keys(result.parsed).join(', ')}`);
      
      if (result.parsed_time) {
        console.log(`     Parsed time: ${result.parsed_time}`);
      }
      
      return { success: true, pattern, result };
    } else {
      console.log(`  ❌ Failed: No fields extracted`);
      return { success: false, pattern, error: 'No fields extracted', result };
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, pattern, error: error.message };
  }
}

async function validateAllParsers() {
  console.log('🧪 Starting parser validation...\n');
  
  const results = [];
  let totalParsers = 0;
  let successfulParsers = 0;
  
  for (const category of parserLibrary) {
    console.log(`\n📂 ${category.icon} ${category.name}`);
    console.log('─'.repeat(50));
    
    for (const pattern of category.patterns) {
      totalParsers++;
      const result = await testParser(pattern);
      results.push(result);
      
      if (result.success) {
        successfulParsers++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total parsers tested: ${totalParsers}`);
  console.log(`Successful: ${successfulParsers}`);
  console.log(`Failed: ${totalParsers - successfulParsers}`);
  console.log(`Success rate: ${((successfulParsers / totalParsers) * 100).toFixed(1)}%`);
  
  // List failed parsers
  const failedParsers = results.filter(r => !r.success);
  if (failedParsers.length > 0) {
    console.log('\n❌ Failed Parsers:');
    failedParsers.forEach(failed => {
      console.log(`  - ${failed.pattern.name}: ${failed.error}`);
    });
    
    console.log('\n🔧 Suggested Fixes:');
    failedParsers.forEach(failed => {
      if (failed.error.includes('500')) {
        console.log(`  - ${failed.pattern.name}: Simplify regex pattern - may be too complex`);
      } else if (failed.error.includes('time format')) {
        console.log(`  - ${failed.pattern.name}: Fix time format specification`);
      } else if (failed.error.includes('No fields extracted')) {
        console.log(`  - ${failed.pattern.name}: Check regex pattern and test string match`);
      }
    });
  }
  
  // Save detailed results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalParsers,
      successful: successfulParsers,
      failed: totalParsers - successfulParsers,
      successRate: ((successfulParsers / totalParsers) * 100).toFixed(1)
    },
    results: results
  };
  
  fs.writeFileSync('parser-validation-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: parser-validation-report.json');
  
  return results;
}

// Run the validation
validateAllParsers()
  .then(() => {
    console.log('\n✅ Validation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  });

export { validateAllParsers, testParser }; 