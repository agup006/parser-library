#!/usr/bin/env node

import axios from 'axios';

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

async function testIISParser(name, regex, testString, timeFormat = null) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`Regex: ${regex}`);
    console.log(`Test String: ${testString}`);
    console.log(`Time Format: ${timeFormat || 'None'}`);
    
    const payload = {
      regex: `/${regex}/`,
      testString: testString
    };
    
    if (timeFormat) {
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

async function debugIISParser() {
  console.log('🔍 Debugging IIS Log parser...\n');
  
  const testString = '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0 200 0 0 1234';
  
  // Test 1: Current pattern
  await testIISParser(
    'IIS Log - Current',
    '^(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+) (?<cs_uri_query>\\S+) (?<s_port>\\S+) (?<cs_username>\\S+) (?<c_ip>\\S+) (?<cs_user_agent>\\S+) (?<sc_status>\\S+) (?<sc_substatus>\\S+) (?<sc_win32_status>\\S+) (?<time_taken>\\S+)$',
    testString
  );
  
  // Test 2: Without anchors
  await testIISParser(
    'IIS Log - No anchors',
    '(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+) (?<cs_uri_query>\\S+) (?<s_port>\\S+) (?<cs_username>\\S+) (?<c_ip>\\S+) (?<cs_user_agent>\\S+) (?<sc_status>\\S+) (?<sc_substatus>\\S+) (?<sc_win32_status>\\S+) (?<time_taken>\\S+)',
    testString
  );
  
  // Test 3: Very simple pattern
  await testIISParser(
    'IIS Log - Simple',
    '^(?<field1>\\S+) (?<field2>\\S+) (?<field3>\\S+) (?<field4>\\S+) (?<field5>\\S+) (?<field6>\\S+) (?<field7>\\S+) (?<field8>\\S+) (?<field9>\\S+) (?<field10>\\S+) (?<field11>\\S+) (?<field12>\\S+) (?<field13>\\S+) (?<field14>\\S+)$',
    testString
  );
  
  // Test 4: Just first few fields
  await testIISParser(
    'IIS Log - First 5 fields',
    '^(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+)',
    testString
  );
  
  // Test 5: With explicit time format
  await testIISParser(
    'IIS Log - With time format',
    '^(?<date>\\S+) (?<time>\\S+) (?<s_ip>\\S+) (?<cs_method>\\S+) (?<cs_uri_stem>\\S+) (?<cs_uri_query>\\S+) (?<s_port>\\S+) (?<cs_username>\\S+) (?<c_ip>\\S+) (?<cs_user_agent>\\S+) (?<sc_status>\\S+) (?<sc_substatus>\\S+) (?<sc_win32_status>\\S+) (?<time_taken>\\S+)$',
    testString,
    '%Y-%m-%d %H:%M:%S'
  );
}

// Run the debugging
debugIISParser()
  .then(() => {
    console.log('\n✅ IIS debugging complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ IIS debugging failed:', error);
    process.exit(1);
  }); 