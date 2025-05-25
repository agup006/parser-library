#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

// Function to extract parser library from ParserTester.tsx
function extractParserLibrary() {
  const filePath = path.join(process.cwd(), 'src/pages/ParserTester.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract the parserLibrary array from the file
  const libraryMatch = content.match(/const parserLibrary: PatternCategory\[\] = (\[[\s\S]*?\]);/);
  if (!libraryMatch) {
    throw new Error('Could not extract parser library from ParserTester.tsx');
  }
  
  // Convert the extracted string to a JavaScript object
  // This is a simplified approach - in production, you'd want a more robust parser
  const libraryString = libraryMatch[1];
  
  // Replace the regex format from /pattern/ to just pattern for evaluation
  const cleanedString = libraryString
    .replace(/regex: '\/([^']+)\/',/g, "regex: '$1',")
    .replace(/regex: "\/([^"]+)\/",/g, 'regex: "$1",');
  
  try {
    // Use eval to parse the JavaScript object (not recommended for production)
    // In production, you'd want to use a proper JavaScript parser
    const parserLibrary = eval(cleanedString);
    return parserLibrary;
  } catch (error) {
    console.error('Error parsing library:', error);
    throw error;
  }
}

// Hardcoded parser library (extracted from ParserTester.tsx)
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
        regex: '^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] "(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?" (?<code>[^ ]*) (?<size>[^ ]*)$',
        timeFormat: '%d/%b/%Y:%H:%M:%S %z',
        testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326'
      },
      {
        id: 'apache-combined',
        name: 'Apache Combined Log',
        description: 'Apache access log with referer and user agent',
        regex: '^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] "(?<method>\\S+)(?: +(?<path>[^ ]*) +\\S*)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^"]*)" "(?<agent>.*)")?$',
        timeFormat: '%d/%b/%Y:%H:%M:%S %z',
        testString: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)"'
      },
      {
        id: 'nginx-access',
        name: 'Nginx Access Log',
        description: 'Standard Nginx access log format',
        regex: '^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \\[(?<time>[^\\]]*)\\] "(?<method>\\S+)(?: +(?<path>[^"]*?)(?: +\\S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^"]*)" "(?<agent>[^"]*)")?$',
        timeFormat: '%d/%b/%Y:%H:%M:%S %z',
        testString: '192.168.1.1 example.com user [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.1" 200 1234 "http://example.com" "Mozilla/5.0"'
      },
      {
        id: 'iis-log',
        name: 'IIS Log',
        description: 'Microsoft IIS web server log format',
        regex: '^(?<date>\\S+) (?<timestamp>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+) (?<cs_uri_query>\\S+) (?<s_port>\\S+) (?<cs_username>\\S+) (?<c_ip>\\S+) (?<cs_user_agent>\\S+) (?<sc_status>\\S+) (?<sc_substatus>\\S+) (?<sc_win32_status>\\S+) (?<time_taken>\\S+)$',
        timeFormat: '',
        testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0 200 0 0 1234'
      },
      {
        id: 'haproxy',
        name: 'HAProxy',
        description: 'HAProxy load balancer log format',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<client_ip>[^:]+):(?<client_port>\\d+) \\[(?<accept_date>[^\\]]+)\\] (?<frontend_name>[^ ]+) (?<backend_name>[^ ]+) (?<status_code>\\d+) (?<bytes_read>\\d+) (?<request>.*)$',
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
        regex: '^%ASA-(?<pri>\\d+)-(?<id>\\d+):\\s+(?<message>.*)$',
        timeFormat: '%b %d %Y %H:%M:%S',
        testString: '%ASA-6-302013: Built inbound TCP connection 12345 for outside:192.168.1.100/1234 (192.168.1.100/1234) to inside:10.0.0.1/80 (10.0.0.1/80)'
      },
      {
        id: 'cisco-ios',
        name: 'Cisco IOS',
        description: 'Cisco IOS router/switch logs',
        regex: '^<(?<pri>\\d+)>(?<seq>\\d+): (?<timestamp>[^%]+): %(?<facility>[^-]+)-(?<severity>\\d+)-(?<mnemonic>[^:]+): (?<message>.*)$',
        timeFormat: '',
        testString: '<189>123: Oct 10 13:55:36: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (192.168.1.100)'
      },
      {
        id: 'cisco-meraki',
        name: 'Cisco Meraki',
        description: 'Cisco Meraki cloud-managed device logs',
        regex: '^<(?<pri>\\d+)>(?<version>\\d+) (?<timestamp>[^ ]+) (?<device_name>[^ ]+) (?<type>[^ ]+) (?<event_type>[^ ]+) (?<message>.*)$',
        timeFormat: '%Y-%m-%dT%H:%M:%SZ',
        testString: '<134>1 2023-01-01T12:00:00Z MX84 urls src=192.168.1.100 dst=example.com request: GET example.com/'
      },
      {
        id: 'cisco-firepower',
        name: 'Cisco Firepower',
        description: 'Cisco Firepower Threat Defense logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^:]+): (?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 firepower SFIMS: [Primary Detection Engine (a8c4e3b2-1234-5678-9abc-def012345678)] Connection Type: Start, User: N/A'
      },
      {
        id: 'cisco-ise',
        name: 'Cisco ISE',
        description: 'Cisco Identity Services Engine logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^ ]+) (?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 ise-server CISE_RADIUS_Accounting 0000123456 1 0 2023-01-01 12:00:00.123 +00:00 0000123456 5200 NOTICE'
      },
      {
        id: 'cisco-nexus',
        name: 'Cisco Nexus',
        description: 'Cisco Nexus data center switch logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) %(?<facility>[^-]+)-(?<severity>[^-]+)-(?<mnemonic>[^:]+): (?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<189>Oct 10 13:55:36 nexus-switch %ETHPORT-5-IF_UP: Interface Ethernet1/1 is up'
      },
      {
        id: 'cisco-wlc',
        name: 'Cisco WLC',
        description: 'Cisco Wireless LAN Controller logs',
        regex: '^<(?<pri>\\d+)>(?<timestamp>[^\\s]+\\s+[^\\s]+\\s+[^\\s]+) (?<hostname>[^\\s]+) \\*(?<log_time>[^%]+): %(?<facility>[^-]+)-(?<severity>\\d+)-(?<mnemonic>[^:]+): (?<message>.*)$',
        timeFormat: '',
        testString: '<134>Oct 10 13:55:36 wlc-controller *Oct 10 13:55:36.123: %DOT11-6-ASSOC: Station associated'
      },
      {
        id: 'cisco-umbrella',
        name: 'Cisco Umbrella',
        description: 'Cisco Umbrella DNS security logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 umbrella CEF:0|Cisco|Umbrella|1.0|1|DNS Request Allowed|3|src=192.168.1.100 dst=8.8.8.8 dhost=example.com'
      }
    ]
  },
  {
    id: 'security-appliances',
    name: 'Security Appliances',
    icon: '🛡️',
    patterns: [
      {
        id: 'palo-alto',
        name: 'Palo Alto Networks',
        description: 'Palo Alto Networks firewall logs',
        regex: '^<(?<pri>\\d+)>(?<timestamp>[^\\s]+\\s+[^\\s]+\\s+[^\\s]+\\s+[^\\s]+) (?<hostname>[^\\s]+) (?<program>[^:]+): (?<message>.*)$',
        timeFormat: '',
        testString: '<134>Oct 10 2023 13:55:36 pa-firewall TRAFFIC: Connection from 192.168.1.100 to 10.0.0.1'
      },
      {
        id: 'fortinet-fortigate',
        name: 'Fortinet FortiGate',
        description: 'Fortinet FortiGate firewall logs',
        regex: '^date=(?<fdate>[^ ]+)\\s+time=(?<ftime>[^ ]+)\\s+logid="(?<logid>[^"]+)"\\s+type="(?<type>[^"]+)"\\s+subtype="(?<subtype>[^"]+)"\\s+(?<message>.*)$',
        timeFormat: '%Y-%m-%d %H:%M:%S',
        testString: 'date=2023-01-01 time=12:00:00 logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" eventtime=1672574400 srcip=192.168.1.100 srcport=12345 srcintf="port1" dstip=8.8.8.8 dstport=53 dstintf="port2" policyid=1 sessionid=123456 proto=17 action="accept" policytype="policy" service="DNS" dstcountry="United States" srccountry="Reserved" trandisp="snat" transip=203.0.113.1 transport=12345 duration=1 sentbyte=64 rcvdbyte=80'
      },
      {
        id: 'checkpoint',
        name: 'Check Point',
        description: 'Check Point firewall logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<date>[^ ]+) (?<logtime>[^ ]+) (?<src_ip>[^ ]+) product: (?<product>[^;]+);\\s*(?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 checkpoint-gw 10Oct2023 13:55:36 192.168.1.1 product: VPN-1 & FireWall-1; Action="accept"; orig="192.168.1.100"; i/f_dir="inbound"; i/f_name="eth0"; has_accounting="0"; uuid="<12345678-1234-5678-9abc-def012345678>"; product="VPN-1 & FireWall-1"; __policy_id_tag="product=VPN-1 & FireWall-1[db_tag={ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV};mgmt=checkpoint-mgmt;date=1697026536;policy_name=Standard]"; rule_name="Web_Access"; rule_uid="{12345678-1234-5678-9abc-def012345678}"; src="192.168.1.100"; dst="203.0.113.1"; proto="6"; service="80"; s_port="54321"'
      },
      {
        id: 'f5-bigip',
        name: 'F5 BIG-IP',
        description: 'F5 BIG-IP application delivery controller logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<msgid>[^:]+):\\s*(?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 bigip tmm[12345]: 01260013:4: SSL Handshake failed for TCP 192.168.1.100:54321 -> 10.0.0.1:443'
      },
      {
        id: 'juniper-srx',
        name: 'Juniper SRX',
        description: 'Juniper SRX firewall logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<event>[^:]+): (?<message>.*)$',
        timeFormat: '%b %d %Y %H:%M:%S',
        testString: '<134>Oct 10 2023 13:55:36 srx-firewall RT_FLOW[1234]: RT_FLOW_SESSION_CREATE: session created 192.168.1.100/54321->10.0.0.1/80 junos-http None 6 trust-to-untrust trust untrust 1234'
      },
      {
        id: 'sophos-utm',
        name: 'Sophos UTM',
        description: 'Sophos Unified Threat Management logs',
        regex: '^(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$',
        timeFormat: '%b %d %Y %H:%M:%S',
        testString: 'Oct 10 2023 13:55:36 sophos-utm httpd: id="0299" severity="info" sys="SecureWeb" sub="http" name="web request blocked" action="blocked" method="GET" srcip="192.168.1.100" dstip="203.0.113.1" user="" ad_domain="" statuscode="403" cached="0" profile="REF_DefaultHTTPProfile" filteraction="REF_DefaultHTTPCFFAction" size="1234" request="0x12345678" url="http://example.com/blocked" referer="" error="" authtime="0" dnstime="1" cattime="12" avscantime="0" fullreqtime="123" device="0" auth="0" ua="Mozilla/5.0" exceptions=""'
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
        regex: '^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<ident>[a-zA-Z0-9_\\/\\.\\-]*)(?:\\[(?<pid>[0-9]+)\\])?(?:[^\\:]*\\:)? *(?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: 'Oct 10 13:55:36 myhost sshd[1234]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2'
      },
      {
        id: 'auth-log',
        name: 'Auth.log',
        description: 'Linux authentication log format',
        regex: '^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) (?<service>[^\\[]*)(\\[(?<pid>[0-9]+)\\])?: (?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: 'Oct 10 13:55:36 server sudo[12345]: user : TTY=pts/0 ; PWD=/home/user ; USER=root ; COMMAND=/bin/ls'
      },
      {
        id: 'kern-log',
        name: 'Kernel Log',
        description: 'Linux kernel log format',
        regex: '^(?<time>[^ ]* [^ ]* [^ ]*) (?<host>[^ ]*) kernel: \\[(?<timestamp>[^\\]]+)\\] (?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: 'Oct 10 13:55:36 server kernel: [12345.678901] USB disconnect, address 1'
      },
      {
        id: 'windows-event',
        name: 'Windows Event Log',
        description: 'Microsoft Windows Event Log format',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) MSWinEventLog\\t(?<log_level>\\d+)\\t(?<log_source>[^\\t]+)\\t(?<event_id>\\d+)\\t(?<date>[^\\t]+)\\t(?<message>.*)$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 windows-server MSWinEventLog	1	Security	4624	Oct 10 2023 13:55:36	An account was successfully logged on.'
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
        regex: '^(?<log>.*)$',
        timeFormat: '',
        testString: '{"timestamp":"2023-01-01T12:00:00Z","level":"INFO","message":"Application started","service":"web-server","request_id":"abc123"}'
      },
      {
        id: 'docker-log',
        name: 'Docker Container',
        description: 'Docker container log format',
        regex: '^(?<time>[^ ]+) (?<container_id>[^ ]+) (?<container_name>[^ ]+): (?<message>.*)$',
        timeFormat: '%Y-%m-%dT%H:%M:%S',
        testString: '2023-01-01T12:00:00.123456Z a1b2c3d4e5f6 web-server: Starting application on port 8080'
      },
      {
        id: 'k8s-log',
        name: 'Kubernetes Pod',
        description: 'Kubernetes pod log format',
        regex: '^(?<time>[^ ]+) (?<stream>[^ ]+) (?<log_type>[^ ]+) (?<message>.*)$',
        timeFormat: '%Y-%m-%dT%H:%M:%S',
        testString: '2023-01-01T12:00:00.123456Z stdout F {"level":"info","msg":"Server started","port":8080}'
      },
      {
        id: 'splunk',
        name: 'Splunk',
        description: 'Splunk Enterprise logs',
        regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<component>[^ ]+) - - \\[(?<req_time>[^\\]]+)\\] "(?<request>[^"]*)" (?<status>\\d+) (?<bytes>\\d+) - - - (?<duration>\\d+)ms$',
        timeFormat: '%b %d %H:%M:%S',
        testString: '<134>Oct 10 13:55:36 splunk-server splunkd: HttpListener - - [10/Oct/2023:13:55:36.123 +0000] "GET /services/server/info HTTP/1.1" 200 1234 - - - 45ms'
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
        regex: '^(?<time>[^ ]* [^ ]*) (?<thread_id>[^ ]*) \\[(?<level>[^\\]]+)\\] (?<message>.*)$',
        timeFormat: '%Y-%m-%d %H:%M:%S',
        testString: '2023-01-01 12:00:00 123 [ERROR] Access denied for user \'root\'@\'localhost\' (using password: YES)'
      },
      {
        id: 'postgresql-log',
        name: 'PostgreSQL Log',
        description: 'PostgreSQL database log format',
        regex: '^(?<time>[^ ]* [^ ]*) \\[(?<pid>[0-9]+)\\] (?<level>[^:]*): (?<message>.*)$',
        timeFormat: '%Y-%m-%d %H:%M:%S',
        testString: '2023-01-01 12:00:00 [1234] ERROR: relation "users" does not exist at character 15'
      },
      {
        id: 'mongodb-log',
        name: 'MongoDB Log',
        description: 'MongoDB database log format',
        regex: '^(?<time>[^ ]+) (?<severity>[^ ]+) (?<component>[^ ]+) \\[(?<context>[^\\]]+)\\] (?<message>.*)$',
        timeFormat: '%Y-%m-%dT%H:%M:%S',
        testString: '2023-01-01T12:00:00.123+0000 I NETWORK [listener] connection accepted from 127.0.0.1:54321 #1 (1 connection now open)'
      }
    ]
  }
];

async function testParser(pattern) {
  try {
    console.log(`Testing ${pattern.name}...`);
    
    const payload = {
      regex: `/${pattern.regex}/`,
      testString: pattern.testString
    };
    
    if (pattern.timeFormat && pattern.timeFormat.trim()) {
      payload.timeFormat = pattern.timeFormat;
    }
    
    const response = await axios.post(API_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000
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
  console.log('🧪 Starting comprehensive parser validation...\n');
  
  const results = [];
  const failedParsers = [];
  let totalParsers = 0;
  let successfulParsers = 0;
  
  for (const category of parserLibrary) {
    console.log(`\n📂 ${category.icon} ${category.name}`);
    console.log('─'.repeat(60));
    
    for (const pattern of category.patterns) {
      totalParsers++;
      const result = await testParser(pattern);
      results.push(result);
      
      if (result.success) {
        successfulParsers++;
      } else {
        failedParsers.push(result);
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total parsers tested: ${totalParsers}`);
  console.log(`Successful: ${successfulParsers}`);
  console.log(`Failed: ${totalParsers - successfulParsers}`);
  console.log(`Success rate: ${((successfulParsers / totalParsers) * 100).toFixed(1)}%`);
  
  // List failed parsers with detailed analysis
  if (failedParsers.length > 0) {
    console.log('\n❌ FAILED PARSERS ANALYSIS:');
    console.log('─'.repeat(60));
    
    failedParsers.forEach((failed, index) => {
      console.log(`\n${index + 1}. ${failed.pattern.name} (${failed.pattern.id})`);
      console.log(`   Category: ${failed.pattern.description}`);
      console.log(`   Error: ${failed.error}`);
      console.log(`   Regex: ${failed.pattern.regex}`);
      console.log(`   Time Format: ${failed.pattern.timeFormat || 'None'}`);
      console.log(`   Test String: ${failed.pattern.testString.substring(0, 100)}...`);
      
      // Suggest fixes based on error type
      if (failed.error.includes('500')) {
        console.log(`   🔧 Suggested Fix: Simplify regex pattern - may be too complex for API`);
      } else if (failed.error.includes('time format')) {
        console.log(`   🔧 Suggested Fix: Remove or correct time format specification`);
      } else if (failed.error.includes('No fields extracted')) {
        console.log(`   🔧 Suggested Fix: Check regex pattern matches test string`);
      } else if (failed.error.includes('timeout')) {
        console.log(`   🔧 Suggested Fix: Simplify regex pattern to reduce processing time`);
      }
    });
    
    console.log('\n🛠️  RECOMMENDED ACTIONS:');
    console.log('─'.repeat(60));
    console.log('1. Fix the failed parsers listed above');
    console.log('2. Test each fix individually before running full validation');
    console.log('3. Consider breaking complex patterns into simpler components');
    console.log('4. Ensure test strings match the expected log format');
    console.log('5. Remove problematic time formats if field extraction is more important');
  } else {
    console.log('\n🎉 ALL PARSERS PASSED! 100% SUCCESS RATE!');
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
    results: results,
    failedParsers: failedParsers
  };
  
  fs.writeFileSync('comprehensive-parser-validation-report.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed report saved to: comprehensive-parser-validation-report.json');
  
  return results;
}

// Run the validation
validateAllParsers()
  .then((results) => {
    const failedCount = results.filter(r => !r.success).length;
    console.log('\n✅ Comprehensive validation complete!');
    
    if (failedCount === 0) {
      console.log('🎯 TARGET ACHIEVED: 100% parser success rate!');
      process.exit(0);
    } else {
      console.log(`⚠️  ${failedCount} parsers need fixes to achieve 100% success rate.`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  });

export { validateAllParsers, testParser }; 