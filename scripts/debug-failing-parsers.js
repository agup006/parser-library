#!/usr/bin/env node

import axios from 'axios';

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

async function testParser(name, regex, testString, timeFormat = '') {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`Regex: ${regex}`);
    console.log(`Test String: ${testString}`);
    console.log(`Time Format: ${timeFormat || 'None'}`);
    
    const payload = {
      regex: `/${regex}/`,
      testString: testString
    };
    
    if (timeFormat && timeFormat.trim()) {
      payload.timeFormat = timeFormat;
    }
    
    const response = await axios.post(API_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000
    });
    
    const result = response.data.result;
    
    if (result.errors && result.errors.length > 0) {
      console.log(`⚠️  Warnings: ${result.errors.join(', ')}`);
    }
    
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      console.log(`✅ Success: ${Object.keys(result.parsed).length} fields extracted`);
      console.log(`Fields: ${Object.keys(result.parsed).join(', ')}`);
      console.log(`Values:`, result.parsed);
      
      if (result.parsed_time) {
        console.log(`Parsed time: ${result.parsed_time}`);
      }
      
      return true;
    } else {
      console.log(`❌ Failed: No fields extracted`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function debugParsers() {
  console.log('🔍 Debugging failing parsers...\n');
  
  // Test IIS Log with different approaches
  console.log('=' .repeat(60));
  console.log('IIS LOG DEBUGGING');
  console.log('=' .repeat(60));
  
  const iisTestString = '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0+(compatible;+MSIE+9.0;+Windows+NT+6.1) 200 0 0 1234';
  
  // Try 1: Original pattern without time format
  await testParser(
    'IIS Log - Original without time',
    '^(?<date>[^ ]+) (?<time>[^ ]+) (?<s_ip>[^ ]+) (?<cs_method>[^ ]+) (?<cs_uri_stem>[^ ]+) (?<cs_uri_query>[^ ]+) (?<s_port>[^ ]+) (?<cs_username>[^ ]+) (?<c_ip>[^ ]+) (?<cs_user_agent>\\S+) (?<sc_status>[^ ]+) (?<sc_substatus>[^ ]+) (?<sc_win32_status>[^ ]+) (?<time_taken>[^ ]+)$',
    iisTestString
  );
  
  // Try 2: Simplified pattern
  await testParser(
    'IIS Log - Simplified',
    '^(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+) (?<cs_uri_query>\\S+) (?<s_port>\\S+) (?<cs_username>\\S+) (?<c_ip>\\S+) (?<cs_user_agent>\\S+) (?<sc_status>\\S+) (?<sc_substatus>\\S+) (?<sc_win32_status>\\S+) (?<time_taken>\\S+)$',
    iisTestString
  );
  
  // Try 3: Even more simplified
  await testParser(
    'IIS Log - Very Simple',
    '^(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<method>\\S+) (?<uri>\\S+) (?<query>\\S+) (?<port>\\S+) (?<user>\\S+) (?<client_ip>\\S+) (?<user_agent>\\S+) (?<status>\\S+) (?<substatus>\\S+) (?<win32_status>\\S+) (?<time_taken>\\S+)',
    iisTestString
  );
  
  // Test Cisco IOS with different approaches
  console.log('\n' + '=' .repeat(60));
  console.log('CISCO IOS DEBUGGING');
  console.log('=' .repeat(60));
  
  const ciscoTestString = '<189>123: Oct 10 13:55:36: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (192.168.1.100)';
  
  // Try 1: Simplified pattern
  await testParser(
    'Cisco IOS - Simplified',
    '^<(?<pri>\\d+)>(?<seq>\\d+): (?<time>[^:]+): %(?<facility>\\w+)-(?<severity>\\d+)-(?<mnemonic>\\w+): (?<message>.*)$',
    ciscoTestString,
    '%b %d %H:%M:%S'
  );
  
  // Try 2: Without time format
  await testParser(
    'Cisco IOS - No time format',
    '^<(?<pri>\\d+)>(?<seq>\\d+): (?<time>[^:]+): %(?<facility>\\w+)-(?<severity>\\d+)-(?<mnemonic>\\w+): (?<message>.*)$',
    ciscoTestString
  );
  
  // Try 3: Even simpler
  await testParser(
    'Cisco IOS - Very Simple',
    '^<(?<pri>\\d+)>(?<seq>\\d+): (?<timestamp>[^:]+): %(?<msg_type>[^:]+): (?<message>.*)$',
    ciscoTestString
  );
  
  // Try 4: Basic pattern
  await testParser(
    'Cisco IOS - Basic',
    '^<(?<priority>\\d+)>(?<sequence>\\d+): (?<time>.+?): %(?<facility>.+?)-(?<severity>\\d+)-(?<mnemonic>.+?): (?<message>.*)$',
    ciscoTestString
  );
}

// Run the debugging
debugParsers()
  .then(() => {
    console.log('\n✅ Debugging complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debugging failed:', error);
    process.exit(1);
  }); 