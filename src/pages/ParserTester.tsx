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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['web-logs', 'cisco-network']));
  const [selectedPattern, setSelectedPattern] = useState<string>('apache-common');

  // Comprehensive Fluent Bit Parser Library based on vendor CSV data
  const parserLibrary: PatternCategory[] = [
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
          timeFormat: '%Y-%m-%d %H:%M:%S',
          testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0 200 0 0 1234'
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
          regex: '/^<(?<pri>\\d+)>(?<seq>\\d+): (?<time>[^:]+): %(?<facility>[^-]+)-(?<severity>\\d+)-(?<mnemonic>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<189>123: Oct 10 13:55:36: %SYS-5-CONFIG_I: Configured from console'
        },
        {
          id: 'cisco-meraki',
          name: 'Cisco Meraki',
          description: 'Cisco Meraki cloud-managed device logs',
          regex: '/^<(?<pri>\\d+)>(?<version>\\d+) (?<timestamp>[^ ]+) (?<device_name>[^ ]+) (?<type>[^ ]+) (?<event_type>[^ ]+) (?<message>.*)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%SZ',
          testString: '<134>1 2023-01-01T12:00:00Z MX84 urls src=192.168.1.100 dst=example.com request: GET example.com/'
        },
        {
          id: 'cisco-firepower',
          name: 'Cisco Firepower',
          description: 'Cisco Firepower Threat Defense logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 firepower SFIMS: [Primary Detection Engine (a8c4e3b2-1234-5678-9abc-def012345678)] Connection Type: Start, User: N/A'
        },
        {
          id: 'cisco-ise',
          name: 'Cisco ISE',
          description: 'Cisco Identity Services Engine logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^ ]+) (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 ise-server CISE_RADIUS_Accounting 0000123456 1 0 2023-01-01 12:00:00.123 +00:00 0000123456 5200 NOTICE'
        },
        {
          id: 'cisco-nexus',
          name: 'Cisco Nexus',
          description: 'Cisco Nexus data center switch logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) %(?<facility>[^-]+)-(?<severity>[^-]+)-(?<mnemonic>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<189>Oct 10 13:55:36 nexus-switch %ETHPORT-5-IF_UP: Interface Ethernet1/1 is up'
        },
        {
          id: 'cisco-wlc',
          name: 'Cisco WLC',
          description: 'Cisco Wireless LAN Controller logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) \\*(?<log_time>[^:]+): %(?<facility>[^-]+)-(?<severity>[^-]+)-(?<mnemonic>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 wlc-controller *Oct 10 13:55:36.123: %DOT11-6-ASSOC: Station'
        },
        {
          id: 'cisco-umbrella',
          name: 'Cisco Umbrella',
          description: 'Cisco Umbrella DNS security logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
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
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %Y %H:%M:%S',
          testString: '<134>Oct 10 2023 13:55:36 pa-firewall TRAFFIC: Connection from 192.168.1.100 to 10.0.0.1'
        },
        {
          id: 'fortinet-fortigate',
          name: 'Fortinet FortiGate',
          description: 'Fortinet FortiGate firewall logs',
          regex: '/^date=(?<fdate>[^ ]+)\\s+time=(?<ftime>[^ ]+)\\s+logid="(?<logid>[^"]+)"\\s+type="(?<type>[^"]+)"\\s+subtype="(?<subtype>[^"]+)"\\s+(?<message>.*)$/',
          timeFormat: '%Y-%m-%d %H:%M:%S',
          testString: 'date=2023-01-01 time=12:00:00 logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" eventtime=1672574400 srcip=192.168.1.100 srcport=12345 srcintf="port1" dstip=8.8.8.8 dstport=53 dstintf="port2" policyid=1 sessionid=123456 proto=17 action="accept" policytype="policy" service="DNS" dstcountry="United States" srccountry="Reserved" trandisp="snat" transip=203.0.113.1 transport=12345 duration=1 sentbyte=64 rcvdbyte=80'
        },
        {
          id: 'checkpoint',
          name: 'Check Point',
          description: 'Check Point firewall logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<date>[^ ]+) (?<logtime>[^ ]+) (?<src_ip>[^ ]+) product: (?<product>[^;]+);\\s*(?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 checkpoint-gw 10Oct2023 13:55:36 192.168.1.1 product: VPN-1 & FireWall-1; Action="accept"; orig="192.168.1.100"; i/f_dir="inbound"; i/f_name="eth0"; has_accounting="0"; uuid="<12345678-1234-5678-9abc-def012345678>"; product="VPN-1 & FireWall-1"; __policy_id_tag="product=VPN-1 & FireWall-1[db_tag={ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV};mgmt=checkpoint-mgmt;date=1697026536;policy_name=Standard]"; rule_name="Web_Access"; rule_uid="{12345678-1234-5678-9abc-def012345678}"; src="192.168.1.100"; dst="203.0.113.1"; proto="6"; service="80"; s_port="54321"'
        },
        {
          id: 'f5-bigip',
          name: 'F5 BIG-IP',
          description: 'F5 BIG-IP application delivery controller logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<msgid>[^:]+):\\s*(?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 bigip tmm[12345]: 01260013:4: SSL Handshake failed for TCP 192.168.1.100:54321 -> 10.0.0.1:443'
        },
        {
          id: 'juniper-srx',
          name: 'Juniper SRX',
          description: 'Juniper SRX firewall logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<event>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %Y %H:%M:%S',
          testString: '<134>Oct 10 2023 13:55:36 srx-firewall RT_FLOW[1234]: RT_FLOW_SESSION_CREATE: session created 192.168.1.100/54321->10.0.0.1/80 junos-http None 6 trust-to-untrust trust untrust 1234'
        },
        {
          id: 'sophos-utm',
          name: 'Sophos UTM',
          description: 'Sophos Unified Threat Management logs',
          regex: '/^(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
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
        },
        {
          id: 'windows-event',
          name: 'Windows Event Log',
          description: 'Microsoft Windows Event Log format',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) MSWinEventLog\\t(?<log_level>\\d+)\\t(?<log_source>[^\\t]+)\\t(?<event_id>\\d+)\\t(?<date>[^\\t]+)\\t(?<message>.*)$/',
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
        },
        {
          id: 'splunk',
          name: 'Splunk',
          description: 'Splunk Enterprise logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<component>[^ ]+) - - \\[(?<req_time>[^\\]]+)\\] "(?<request>[^"]*)" (?<status>\\d+) (?<bytes>\\d+) - - - (?<duration>\\d+)ms$/',
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
    },
    {
      id: 'cloud-security',
      name: 'Cloud Security',
      icon: '☁️',
      patterns: [
        {
          id: 'zscaler',
          name: 'Zscaler',
          description: 'Zscaler cloud security platform logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 zscaler CEF:0|Zscaler|NSSWeblog|1.0|200|Allowed|2|src=192.168.1.100 dst=203.0.113.1 spt=54321 dpt=80 request=GET example.com/ HTTP/1.1'
        },
        {
          id: 'imperva-waf',
          name: 'Imperva WAF',
          description: 'Imperva Web Application Firewall logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 imperva-waf CEF:0|Imperva Inc.|SecureSphere|13.0.0|Alert|Alert|High|act=Blocked src=192.168.1.100 spt=54321 dst=10.0.0.1 dpt=80 cs1Label=Policy cs1=SQL Injection cs2Label=Signature cs2=Generic SQL Injection'
        },
        {
          id: 'cloudflare',
          name: 'Cloudflare',
          description: 'Cloudflare CDN and security logs',
          regex: '/^(?<timestamp>[^ ]+) (?<zone_id>[^ ]+) (?<zone_name>[^ ]+) (?<datetime>[^ ]+) (?<client_ip>[^ ]+) (?<client_country>[^ ]+) (?<client_device_type>[^ ]+) (?<client_ip_class>[^ ]+) (?<client_asn>[^ ]+) (?<client_request_host>[^ ]+) (?<client_request_method>[^ ]+) (?<client_request_uri>[^ ]+) (?<client_request_user_agent>[^ ]+) (?<client_request_referer>[^ ]+) (?<client_ssl_cipher>[^ ]+) (?<client_ssl_protocol>[^ ]+) (?<edge_colo_code>[^ ]+) (?<edge_colo_id>[^ ]+) (?<edge_end_timestamp>[^ ]+) (?<edge_request_host>[^ ]+) (?<edge_response_bytes>[^ ]+) (?<edge_response_compression_ratio>[^ ]+) (?<edge_response_content_type>[^ ]+) (?<edge_response_status>[^ ]+) (?<edge_start_timestamp>[^ ]+) (?<firewall_matches_actions>[^ ]+) (?<firewall_matches_rule_ids>[^ ]+) (?<firewall_matches_sources>[^ ]+) (?<origin_ip>[^ ]+) (?<origin_response_bytes>[^ ]+) (?<origin_response_http_expires>[^ ]+) (?<origin_response_http_last_modified>[^ ]+) (?<origin_response_status>[^ ]+) (?<origin_response_time>[^ ]+) (?<origin_ssl_protocol>[^ ]+) (?<parent_ray_id>[^ ]+) (?<ray_id>[^ ]+) (?<security_level>[^ ]+) (?<waf_action>[^ ]+) (?<waf_flags>[^ ]+) (?<waf_matched_var>[^ ]+) (?<waf_profile>[^ ]+) (?<waf_rule_id>[^ ]+) (?<waf_rule_message>[^ ]+) (?<worker_cpu_time>[^ ]+) (?<worker_status>[^ ]+) (?<worker_subrequest>[^ ]+) (?<worker_subrequest_count>[^ ]+) (?<zone_plan>[^ ]+)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%SZ',
          testString: '1672574400 abc123def456 example.com 2023-01-01T12:00:00Z 192.168.1.100 US desktop noRecord 12345 example.com GET /api/data Mozilla/5.0 https://example.com/home TLS_AES_256_GCM_SHA384 TLSv1.3 LAX 123 1672574400123 example.com 1234 1.0 application/json 200 1672574400000 [] [] [] 203.0.113.1 567 - - 200 45 TLSv1.3 - abc123def456ghi789 medium unknown 0 - default - - 0 ok false 0 free'
        }
      ]
    },
    {
      id: 'endpoint-security',
      name: 'Endpoint Security',
      icon: '🔒',
      patterns: [
        {
          id: 'crowdstrike',
          name: 'CrowdStrike Falcon',
          description: 'CrowdStrike Falcon endpoint protection logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 crowdstrike CEF:0|CrowdStrike|FalconHost|1.0|DetectionSummaryEvent|Detection Summary|High|src=192.168.1.100 duser=john.doe cs1Label=DetectionId cs1=ldt:abc123def456:789012345 cs2Label=Severity cs2=High'
        },
        {
          id: 'sentinelone',
          name: 'SentinelOne',
          description: 'SentinelOne endpoint protection logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 sentinelone CEF:0|SentinelOne|Mgmt|1.0|52|Threat Detected|High|src=192.168.1.100 duser=jane.smith cs1Label=ThreatId cs1=123456789 cs2Label=Classification cs2=Malware'
        },
        {
          id: 'carbon-black',
          name: 'Carbon Black',
          description: 'VMware Carbon Black endpoint security logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 carbonblack CEF:0|Bit9|Security Platform|8.1.4|1|Process block|8|src=192.168.1.100 duser=admin cs1Label=Policy cs1=High Security cs2Label=ProcessPath cs2=C:\\\\Windows\\\\System32\\\\calc.exe'
        },
        {
          id: 'cylance',
          name: 'Cylance',
          description: 'BlackBerry Cylance endpoint protection logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 cylance CEF:0|Cylance|CylancePROTECT|2.1|1|Threat Quarantined|High|src=192.168.1.100 duser=user cs1Label=ThreatName cs1=Trojan.Generic cs2Label=FilePath cs2=C:\\\\Users\\\\user\\\\Downloads\\\\malware.exe'
        }
      ]
    },
    {
      id: 'identity-access',
      name: 'Identity & Access',
      icon: '👤',
      patterns: [
        {
          id: 'okta',
          name: 'Okta',
          description: 'Okta identity and access management logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 okta CEF:0|Okta|Okta|1.0|user.session.start|User Login|3|src=192.168.1.100 suser=john.doe@company.com cs1Label=Application cs1=Office365 cs2Label=Result cs2=SUCCESS'
        },
        {
          id: 'azure-ad',
          name: 'Azure Active Directory',
          description: 'Microsoft Azure Active Directory logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 azuread CEF:0|Microsoft|Azure Active Directory|1.0|SigninLogs|User Sign-in|3|src=192.168.1.100 suser=jane.smith@company.com cs1Label=Application cs1=Microsoft Office 365 cs2Label=Status cs2=Success'
        },
        {
          id: 'cyberark',
          name: 'CyberArk',
          description: 'CyberArk Privileged Access Security logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 cyberark CEF:0|Cyber-Ark|Vault|12.1|7|CPM_GetPassword|3|src=192.168.1.100 suser=admin cs1Label=Safe cs1=WindowsAccounts cs2Label=Account cs2=Administrator'
        },
        {
          id: 'ping-identity',
          name: 'Ping Identity',
          description: 'Ping Identity access management logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 pingidentity CEF:0|Ping Identity|PingFederate|10.3|SAML20_SSO|SAML 2.0 SSO|3|src=192.168.1.100 suser=user@company.com cs1Label=PartnerEntityId cs1=urn:amazon:webservices cs2Label=Status cs2=success'
        }
      ]
    },
    {
      id: 'virtualization',
      name: 'Virtualization',
      icon: '💻',
      patterns: [
        {
          id: 'vmware-esxi',
          name: 'VMware ESXi',
          description: 'VMware ESXi hypervisor logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<level>[^ ]+) (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 esxi-host Hostd: info hostd[12345] [Originator@6876 sub=Default] [VpxLRO] -- BEGIN lro-3456 -- vpxapi.VpxApiLogon -- sessionManager.Login'
        },
        {
          id: 'vmware-vcenter',
          name: 'VMware vCenter',
          description: 'VMware vCenter Server logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<level>[^ ]+) (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 vcenter-server vpxd: info vpxd[12345] [Originator@6876 sub=Default] [VpxLRO] -- BEGIN lro-7890 -- SessionManager.Login -- session[52abc123-def4-5678-9012-345678901234]'
        },
        {
          id: 'hyper-v',
          name: 'Microsoft Hyper-V',
          description: 'Microsoft Hyper-V hypervisor logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) MSWinEventLog\\t(?<log_level>\\d+)\\t(?<log_source>[^\\t]+)\\t(?<event_id>\\d+)\\t(?<date>[^\\t]+)\\t(?<event_code>\\d+)\\t(?<source>[^\\t]+)\\t(?<user>[^\\t]+)\\t(?<sid>[^\\t]+)\\t(?<category>[^\\t]+)\\t(?<computer>[^\\t]+)\\t(?<event_type>[^\\t]+)\\t(?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 hyperv-host MSWinEventLog	1	Microsoft-Windows-Hyper-V-VMMS	18590	Oct 10 2023 13:55:36	18590	Microsoft-Windows-Hyper-V-VMMS	N/A	N/A	Information		HYPERV-HOST	Information	HYPERV-HOST	\'VM-WebServer\' was successfully created.'
        },
        {
          id: 'citrix-xenserver',
          name: 'Citrix XenServer',
          description: 'Citrix XenServer hypervisor logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<level>[^ ]+) (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 xenserver xapi: info [Originator@6876 sub=Default] Session.login_with_password D:abc123def456 trackid=789012345 uname=root originator=xsconsole'
        }
      ]
    },
    {
      id: 'storage-systems',
      name: 'Storage Systems',
      icon: '💾',
      patterns: [
        {
          id: 'netapp-ontap',
          name: 'NetApp ONTAP',
          description: 'NetApp ONTAP storage system logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 netapp-filer kernel: RAID assimilated spare disk 1a.00.1 into /aggr0/plex0/rg0'
        },
        {
          id: 'emc-unity',
          name: 'Dell EMC Unity',
          description: 'Dell EMC Unity storage array logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 unity-array uemcli: INFO: LUN lun_001 has been successfully created in storage pool pool_001'
        },
        {
          id: 'pure-storage',
          name: 'Pure Storage',
          description: 'Pure Storage FlashArray logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): \\[(?<severity>[^\\]]+)\\] (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 purearray purity: [INFO] Volume vol001 created successfully with size 1TB'
        },
        {
          id: 'hpe-3par',
          name: 'HPE 3PAR',
          description: 'HPE 3PAR storage system logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 3par-array System: Virtual volume vv001 created successfully in CPG cpg001'
        }
      ]
    },
    {
      id: 'load-balancers',
      name: 'Load Balancers',
      icon: '⚖️',
      patterns: [
        {
          id: 'f5-ltm',
          name: 'F5 LTM',
          description: 'F5 Local Traffic Manager logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<msgid>[^:]+):\\s*(?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 f5-ltm tmm[12345]: 01260013:4: SSL Handshake failed for TCP 192.168.1.100:54321 -> 10.0.0.1:443'
        },
        {
          id: 'citrix-netscaler',
          name: 'Citrix NetScaler',
          description: 'Citrix NetScaler ADC logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<module>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 netscaler default: SSLVPN LOGIN 192.168.1.100:54321 - user john.doe : Group(s) N/A : Vserver 10.0.0.1:443 - NatIP 192.168.1.1:54321 - Browser_type "Mozilla/5.0" - SSLVPN_client_type ICA - Group_policy_name N/A'
        },
        {
          id: 'a10-thunder',
          name: 'A10 Thunder',
          description: 'A10 Networks Thunder ADC logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 a10-thunder ACOS: [INFO] Virtual server web_vs is up'
        },
        {
          id: 'kemp-loadmaster',
          name: 'KEMP LoadMaster',
          description: 'KEMP LoadMaster load balancer logs',
          regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
          timeFormat: '%b %d %H:%M:%S',
          testString: '<134>Oct 10 13:55:36 kemp-lm bal: Virtual Service 10.0.0.1:80 is UP'
        }
      ]
    },
    {
      id: 'monitoring-tools',
      name: 'Monitoring Tools',
      icon: '📊',
      patterns: [
        {
          id: 'nagios',
          name: 'Nagios',
          description: 'Nagios monitoring system logs',
          regex: '/^\\[(?<timestamp>[^\\]]+)\\] (?<type>[^:]+): (?<message>.*)$/',
          timeFormat: '%s',
          testString: '[1672574400] SERVICE ALERT: web-server;HTTP;CRITICAL;HARD;3;HTTP CRITICAL - Unable to open TCP socket'
        },
        {
          id: 'zabbix',
          name: 'Zabbix',
          description: 'Zabbix monitoring system logs',
          regex: '/^(?<time>[^ ]+ [^ ]+) (?<pid>\\d+):(?<level>[^ ]+): (?<message>.*)$/',
          timeFormat: '%Y%m%d:%H%M%S',
          testString: '20230101:120000 12345:information: server #0 started [main process]'
        },
        {
          id: 'prometheus',
          name: 'Prometheus',
          description: 'Prometheus monitoring system logs',
          regex: '/^level=(?<level>[^ ]+) ts=(?<timestamp>[^ ]+) caller=(?<caller>[^ ]+) msg="(?<message>[^"]*)"(?<additional>.*)$/',
          timeFormat: '',
          testString: 'level=info ts=2023-01-01T12:00:00.123Z caller=main.go:123 msg="Server is ready to receive web requests."'
        },
        {
          id: 'grafana',
          name: 'Grafana',
          description: 'Grafana visualization platform logs',
          regex: '/^t=(?<timestamp>[^ ]+) lvl=(?<level>[^ ]+) msg="(?<message>[^"]*)"(?<additional>.*)$/',
          timeFormat: '%Y-%m-%dT%H:%M:%S',
          testString: 't=2023-01-01T12:00:00+0000 lvl=info msg="HTTP Server Listen" logger=http.server address=[::]:3000 protocol=http subUrl= socket='
                 }
       ]
     },
     {
       id: 'enterprise-vendors',
       name: 'Enterprise Vendors',
       icon: '🏢',
       patterns: [
         {
           id: 'microsoft-iis',
           name: 'Microsoft IIS',
           description: 'Microsoft Internet Information Services logs',
           regex: '/^(?<date>[^ ]+) (?<time>[^ ]+) (?<s_ip>[^ ]+) (?<cs_method>[^ ]+) (?<cs_uri_stem>[^ ]+) (?<cs_uri_query>[^ ]+) (?<s_port>[^ ]+) (?<cs_username>[^ ]+) (?<c_ip>[^ ]+) (?<cs_user_agent>[^ ]+) (?<sc_status>[^ ]+) (?<sc_substatus>[^ ]+) (?<sc_win32_status>[^ ]+) (?<time_taken>[^ ]+)$/',
           timeFormat: '',
           testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0+(compatible;+MSIE+9.0;+Windows+NT+6.1) 200 0 0 1234'
         },
         {
           id: 'oracle-database',
           name: 'Oracle Database',
           description: 'Oracle Database alert log format',
           regex: '/^(?<timestamp>[^ ]+ [^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<message>.*)$/',
           timeFormat: '%a %b %d %H:%M:%S %Y',
           testString: 'Mon Jan 01 12:00:00 2023 Starting ORACLE instance (normal)'
         },
         {
           id: 'sap-hana',
           name: 'SAP HANA',
           description: 'SAP HANA database logs',
           regex: '/^\\[(?<pid>\\d+)\\]\\{(?<tid>\\d+)\\}\\[(?<timestamp>[^\\]]+)\\] (?<level>[^ ]+) (?<component>[^ ]+) (?<message>.*)$/',
           timeFormat: '%Y-%m-%d %H:%M:%S',
           testString: '[12345]{67890}[2023-01-01 12:00:00.123] i TraceContext TraceContext.cpp(00123) : Starting trace context'
         },
         {
           id: 'ibm-db2',
           name: 'IBM DB2',
           description: 'IBM DB2 database logs',
           regex: '/^(?<timestamp>[^ ]+ [^ ]+) (?<instance>[^ ]+) (?<level>[^ ]+) (?<component>[^ ]+) (?<message>.*)$/',
           timeFormat: '%Y-%m-%d-%H.%M.%S',
           testString: '2023-01-01-12.00.00.123456 INSTANCE0 LEVEL-INFO DB2START : DB2 instance started successfully'
         },
         {
           id: 'salesforce',
           name: 'Salesforce',
           description: 'Salesforce event monitoring logs',
           regex: '/^"(?<event_type>[^"]+)","(?<timestamp>[^"]+)","(?<user_id>[^"]+)","(?<username>[^"]+)","(?<event_date>[^"]+)","(?<source_ip>[^"]+)"(?<additional>.*)$/',
           timeFormat: '%Y%m%d%H%M%S',
           testString: '"Login","20230101120000","005xx0000012345","user@company.com","2023-01-01","192.168.1.100","SUCCESS"'
         }
       ]
     },
     {
       id: 'network-infrastructure',
       name: 'Network Infrastructure',
       icon: '🌐',
       patterns: [
         {
           id: 'arista-eos',
           name: 'Arista EOS',
           description: 'Arista Networks EOS switch logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<189>Oct 10 13:55:36 arista-switch Stp: %STP-6-TOPOLOGY_CHANGE: Topology change detected on port Ethernet1/1'
         },
         {
           id: 'brocade-fabric',
           name: 'Brocade Fabric OS',
           description: 'Brocade Fibre Channel switch logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<event>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 brocade-fc ZONE-1001: Zone configuration change detected'
         },
         {
           id: 'ubiquiti-unifi',
           name: 'Ubiquiti UniFi',
           description: 'Ubiquiti UniFi network device logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 unifi-ap hostapd: wlan0: STA 00:11:22:33:44:55 IEEE 802.11: authenticated'
         },
         {
           id: 'mikrotik-routeros',
           name: 'MikroTik RouterOS',
           description: 'MikroTik RouterOS logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<topic>[^,]+),(?<severity>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 mikrotik-router firewall,info: input: in:ether1 out:(unknown 0), src-mac 00:11:22:33:44:55, proto TCP (SYN), 192.168.1.100:54321->10.0.0.1:80, len 60'
         },
         {
           id: 'ruckus-wireless',
           name: 'Ruckus Wireless',
           description: 'Ruckus wireless controller logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^:]+): (?<component>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 ruckus-controller wlan: AP[00:11:22:33:44:55]: Station 00:aa:bb:cc:dd:ee associated to WLAN "Corporate"'
         }
       ]
     },
     {
       id: 'backup-recovery',
       name: 'Backup & Recovery',
       icon: '💿',
       patterns: [
         {
           id: 'veeam-backup',
           name: 'Veeam Backup',
           description: 'Veeam Backup & Replication logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 veeam-server CEF:0|Veeam|Backup & Replication|11.0|100|Job completed|3|src=192.168.1.100 cs1Label=JobName cs1=VM-Backup-Daily cs2Label=Status cs2=Success'
         },
         {
           id: 'commvault',
           name: 'Commvault',
           description: 'Commvault backup solution logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 commvault CEF:0|Commvault|Complete Backup & Recovery|11.24|1001|Backup Job Completed|3|src=192.168.1.100 cs1Label=ClientName cs1=DB-Server cs2Label=JobStatus cs2=Completed'
         },
         {
           id: 'cohesity-backup',
           name: 'Cohesity',
           description: 'Cohesity data protection platform logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 cohesity CEF:0|Cohesity|DataPlatform|6.8|2001|Protection Job Success|3|src=192.168.1.100 cs1Label=JobName cs1=VM-Protection cs2Label=ObjectsProcessed cs2=25'
         },
         {
           id: 'rubrik',
           name: 'Rubrik',
           description: 'Rubrik cloud data management logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 rubrik CEF:0|Rubrik|Cloud Data Management|8.1|3001|Snapshot Taken|3|src=192.168.1.100 cs1Label=ObjectName cs1=SQL-Database cs2Label=SnapshotId cs2=snapshot_123456'
         }
       ]
     },
     {
       id: 'email-security',
       name: 'Email Security',
       icon: '📧',
       patterns: [
         {
           id: 'proofpoint-tap',
           name: 'Proofpoint TAP',
           description: 'Proofpoint Targeted Attack Protection logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 proofpoint CEF:0|Proofpoint|TAP|2.8|1001|Message Blocked|High|src=192.168.1.100 cs1Label=Threat cs1=Malicious URL cs2Label=Recipient cs2=user@company.com'
         },
         {
           id: 'mimecast',
           name: 'Mimecast',
           description: 'Mimecast email security logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 mimecast CEF:0|Mimecast|Email Security|1.0|2001|Spam Detected|Medium|src=192.168.1.100 cs1Label=Subject cs1=Suspicious Email cs2Label=Action cs2=Quarantined'
         },
         {
           id: 'barracuda-ess',
           name: 'Barracuda ESS',
           description: 'Barracuda Email Security Service logs',
           regex: '/^(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<level>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %Y %H:%M:%S',
           testString: 'Oct 10 2023 13:55:36 barracuda-ess INFO: Message from sender@external.com to recipient@company.com was quarantined due to spam detection'
         },
         {
           id: 'microsoft-defender',
           name: 'Microsoft Defender',
           description: 'Microsoft Defender for Office 365 logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 defender CEF:0|Microsoft|Defender for Office 365|1.0|4001|Safe Attachments Detection|High|src=192.168.1.100 cs1Label=ThreatType cs1=Malware cs2Label=FileName cs2=document.pdf'
         }
       ]
     },
     {
       id: 'iot-industrial',
       name: 'IoT & Industrial',
       icon: '🏭',
       patterns: [
         {
           id: 'schneider-electric',
           name: 'Schneider Electric',
           description: 'Schneider Electric industrial control systems',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 schneider-plc ModbusServer: Connection established from 192.168.1.100:502'
         },
         {
           id: 'siemens-scada',
           name: 'Siemens SCADA',
           description: 'Siemens SCADA system logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 siemens-hmi WinCC: Alarm - Temperature sensor reading exceeded threshold: 85°C'
         },
         {
           id: 'ge-digital',
           name: 'GE Digital',
           description: 'GE Digital Predix platform logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 ge-predix AssetMonitor: Vibration anomaly detected on turbine unit TU-001'
         },
         {
           id: 'honeywell-dcs',
           name: 'Honeywell DCS',
           description: 'Honeywell Distributed Control System logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<component>[^:]+): (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 honeywell-dcs ProcessControl: Setpoint change detected on loop LC-101: 45.2% -> 50.0%'
         }
       ]
     },
     {
       id: 'specialized-systems',
       name: 'Specialized Systems',
       icon: '⚙️',
       patterns: [
         {
           id: 'dns-bind',
           name: 'ISC BIND DNS',
           description: 'ISC BIND DNS server logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 dns-server named[12345]: client 192.168.1.100#54321 (example.com): query: example.com IN A + (192.168.1.1)'
         },
         {
           id: 'ntp-server',
           name: 'NTP Server',
           description: 'Network Time Protocol server logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 ntp-server ntpd[12345]: synchronized to 192.168.1.1, stratum 2'
         },
         {
           id: 'radius-server',
           name: 'RADIUS Server',
           description: 'RADIUS authentication server logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 radius-server radiusd[12345]: Login OK: [john.doe] (from client 192.168.1.100 port 1812)'
         },
         {
           id: 'ldap-server',
           name: 'LDAP Server',
           description: 'LDAP directory server logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<process>[^\\[]+)\\[(?<pid>\\d+)\\]: (?<message>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 ldap-server slapd[12345]: conn=1234 op=5 BIND dn="cn=john.doe,ou=users,dc=company,dc=com" method=128'
         },
         {
           id: 'git-server',
           name: 'Git Server',
           description: 'Git version control server logs',
           regex: '/^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) CEF:(?<version>[^|]+)\\|(?<vendor>[^|]+)\\|(?<product>[^|]+)\\|(?<product_version>[^|]+)\\|(?<event_id>[^|]+)\\|(?<event_name>[^|]+)\\|(?<severity>[^|]+)\\|(?<extension>.*)$/',
           timeFormat: '%b %d %H:%M:%S',
           testString: '<134>Oct 10 13:55:36 git-server CEF:0|GitHub|Enterprise Server|3.8|5001|Repository Push|3|src=192.168.1.100 suser=john.doe cs1Label=Repository cs1=company/webapp cs2Label=Branch cs2=main'
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
          
          {parserLibrary.map((category) => (
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