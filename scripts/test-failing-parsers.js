#!/usr/bin/env node

import axios from 'axios';

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

// The failing parsers that need to be fixed
const failingParsers = [
  {
    id: 'iis-log',
    name: 'IIS Log',
    regex: '^(?<date>[^ ]+) (?<time>[^ ]+) (?<s_ip>[^ ]+) (?<cs_method>[^ ]+) (?<cs_uri_stem>[^ ]+) (?<cs_uri_query>[^ ]+) (?<s_port>[^ ]+) (?<cs_username>[^ ]+) (?<c_ip>[^ ]+) (?<cs_user_agent>[^ ]+) (?<sc_status>[^ ]+) (?<sc_substatus>[^ ]+) (?<sc_win32_status>[^ ]+) (?<time_taken>[^ ]+)$',
    timeFormat: '%Y-%m-%d %H:%M:%S',
    testString: '2023-01-01 12:00:00 192.168.1.1 GET /default.htm - 80 - 10.0.0.1 Mozilla/5.0 200 0 0 1234'
  },
  {
    id: 'cisco-ios',
    name: 'Cisco IOS',
    regex: '^<(?<pri>\\d+)>(?<seq>\\d+): (?<time>[^:]+): %(?<facility>[^-]+)-(?<severity>\\d+)-(?<mnemonic>[^:]+): (?<message>.*)$',
    timeFormat: '%b %d %H:%M:%S',
    testString: '<189>123: Oct 10 13:55:36: %SYS-5-CONFIG_I: Configured from console'
  },
  {
    id: 'cisco-wlc',
    name: 'Cisco WLC',
    regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) \\*(?<log_time>[^:]+): %(?<facility>[^-]+)-(?<severity>[^-]+)-(?<mnemonic>[^:]+): (?<message>.*)$',
    timeFormat: '%b %d %H:%M:%S',
    testString: '<134>Oct 10 13:55:36 wlc-controller *Oct 10 13:55:36.123: %DOT11-6-ASSOC: Station'
  },
  {
    id: 'palo-alto',
    name: 'Palo Alto Networks',
    regex: '^<(?<pri>\\d+)>(?<time>[^ ]+ [^ ]+ [^ ]+ [^ ]+) (?<hostname>[^ ]+) (?<program>[^:]+): (?<message>.*)$',
    timeFormat: '%b %d %Y %H:%M:%S',
    testString: '<134>Oct 10 2023 13:55:36 pa-firewall TRAFFIC: Connection from 192.168.1.100 to 10.0.0.1'
  }
];

// Function to test a single parser
async function testParser(parser) {
  try {
    const payload = {
      regex: parser.regex,
      time_format: parser.timeFormat || null,
      test_string: parser.testString
    };

    console.log(`\n🧪 Testing ${parser.name}...`);
    console.log(`   Regex: ${parser.regex}`);
    console.log(`   Time Format: ${parser.timeFormat}`);
    console.log(`   Test String: ${parser.testString}`);

    const response = await axios.post(API_BASE_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const result = response.data;
    
    // Check if parsing was successful
    const hasFields = result.fields && Object.keys(result.fields).length > 0;
    
    if (hasFields) {
      const fieldCount = Object.keys(result.fields).length;
      const fieldNames = Object.keys(result.fields).join(', ');
      console.log(`   ✅ Success: ${fieldCount} fields extracted`);
      console.log(`   📋 Fields: ${fieldNames}`);
      if (result.time) {
        console.log(`   ⏰ Parsed time: ${result.time}`);
      }
      if (result.warnings && result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
      }
      return true;
    } else {
      console.log(`   ❌ Failed: No fields extracted`);
      if (result.warnings && result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
      }
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main function
async function testFailingParsers() {
  console.log('🔍 Testing failing parsers individually...\n');
  
  let successCount = 0;
  let totalCount = failingParsers.length;
  
  for (const parser of failingParsers) {
    const success = await testParser(parser);
    if (success) {
      successCount++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total parsers tested: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All parsers are now working!');
  } else {
    console.log(`\n⚠️  ${totalCount - successCount} parsers still need fixes.`);
  }
}

// Run the test
testFailingParsers(); 