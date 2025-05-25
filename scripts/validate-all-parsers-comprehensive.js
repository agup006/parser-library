#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://core.calyptia.com/api/parser';

// Function to extract all parsers from ParserTester.tsx
function extractAllParsers() {
  const filePath = path.join(process.cwd(), 'src/pages/ParserTester.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract the parserLibrary array
  const libraryMatch = content.match(/const parserLibrary: PatternCategory\[\] = (\[[\s\S]*?\]);/);
  if (!libraryMatch) {
    throw new Error('Could not extract parser library from ParserTester.tsx');
  }
  
  // Parse the library structure to extract all parsers
  const parsers = [];
  const categories = [];
  
  // Extract category blocks
  const categoryMatches = content.matchAll(/{\s*name:\s*['"`]([^'"`]+)['"`],\s*patterns:\s*\[([\s\S]*?)\]\s*}/g);
  
  for (const categoryMatch of categoryMatches) {
    const categoryName = categoryMatch[1];
    const patternsBlock = categoryMatch[2];
    
    // Extract individual patterns from this category
    const patternMatches = patternsBlock.matchAll(/{\s*id:\s*['"`]([^'"`]+)['"`],\s*name:\s*['"`]([^'"`]+)['"`],\s*description:\s*['"`]([^'"`]+)['"`],\s*regex:\s*['"`]([^'"`]+)['"`],\s*timeFormat:\s*['"`]([^'"`]*)['"`],\s*testString:\s*['"`]([\s\S]*?)['"`]\s*}/g);
    
    for (const patternMatch of patternMatches) {
      const [, id, name, description, regex, timeFormat, testString] = patternMatch;
      
      parsers.push({
        id,
        name,
        description,
        category: categoryName,
        regex: regex.replace(/^\/|\/$/g, ''), // Remove leading/trailing slashes
        timeFormat,
        testString: testString.replace(/\\'/g, "'") // Unescape quotes
      });
    }
  }
  
  return parsers;
}

// Function to test a single parser
async function testParser(parser) {
  try {
    const payload = {
      regex: parser.regex,
      time_format: parser.timeFormat || null,
      test_string: parser.testString
    };

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
    const hasTime = result.time !== null && result.time !== undefined;
    
    return {
      success: hasFields,
      fields: result.fields || {},
      time: result.time,
      warnings: result.warnings || [],
      error: null
    };
    
  } catch (error) {
    return {
      success: false,
      fields: {},
      time: null,
      warnings: [],
      error: error.response?.data?.error || error.message
    };
  }
}

// Main validation function
async function validateAllParsers() {
  console.log('🧪 Starting comprehensive parser validation...\n');
  
  try {
    const parsers = extractAllParsers();
    console.log(`📊 Found ${parsers.length} parsers to validate\n`);
    
    const results = [];
    const categoryGroups = {};
    
    // Group parsers by category
    parsers.forEach(parser => {
      if (!categoryGroups[parser.category]) {
        categoryGroups[parser.category] = [];
      }
      categoryGroups[parser.category].push(parser);
    });
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    // Test each category
    for (const [categoryName, categoryParsers] of Object.entries(categoryGroups)) {
      console.log(`📂 ${categoryName}`);
      console.log('─'.repeat(60));
      
      for (const parser of categoryParsers) {
        console.log(`Testing ${parser.name}...`);
        
        const result = await testParser(parser);
        
        if (result.success) {
          const fieldCount = Object.keys(result.fields).length;
          const fieldNames = Object.keys(result.fields).join(', ');
          console.log(`  ✅ Success: ${fieldCount} fields extracted`);
          console.log(`     Fields: ${fieldNames}`);
          if (result.time) {
            console.log(`     Parsed time: ${result.time}`);
          }
          totalSuccess++;
        } else {
          console.log(`  ❌ Failed: ${result.error || 'No fields extracted'}`);
          if (result.warnings.length > 0) {
            console.log(`  ⚠️  Warnings: ${result.warnings.join(', ')}`);
          }
          totalFailed++;
        }
        
        results.push({
          ...parser,
          result,
          success: result.success
        });
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('');
    }
    
    // Summary
    const successRate = ((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1);
    
    console.log('='.repeat(80));
    console.log('📊 COMPREHENSIVE VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total parsers tested: ${totalSuccess + totalFailed}`);
    console.log(`Successful: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${successRate}%`);
    
    // Failed parsers analysis
    const failedParsers = results.filter(r => !r.success);
    if (failedParsers.length > 0) {
      console.log('\n❌ FAILED PARSERS ANALYSIS:');
      console.log('─'.repeat(60));
      
      failedParsers.forEach((parser, index) => {
        console.log(`\n${index + 1}. ${parser.name} (${parser.id})`);
        console.log(`   Category: ${parser.description}`);
        console.log(`   Error: ${parser.result.error || 'No fields extracted'}`);
        console.log(`   Regex: ${parser.regex.substring(0, 100)}${parser.regex.length > 100 ? '...' : ''}`);
        console.log(`   Time Format: ${parser.timeFormat || 'None'}`);
        console.log(`   Test String: ${parser.testString.substring(0, 100)}${parser.testString.length > 100 ? '...' : ''}`);
        console.log(`   🔧 Suggested Fix: Check regex pattern matches test string`);
      });
      
      console.log('\n🛠️  RECOMMENDED ACTIONS:');
      console.log('─'.repeat(60));
      console.log('1. Fix the failed parsers listed above');
      console.log('2. Test each fix individually before running full validation');
      console.log('3. Consider breaking complex patterns into simpler components');
      console.log('4. Ensure test strings match the expected log format');
      console.log('5. Remove problematic time formats if field extraction is more important');
    }
    
    // Save detailed report
    const reportPath = 'comprehensive-parser-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total: totalSuccess + totalFailed,
        successful: totalSuccess,
        failed: totalFailed,
        successRate: parseFloat(successRate)
      },
      results: results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n✅ Comprehensive validation complete!');
    
    if (totalFailed > 0) {
      console.log(`⚠️  ${totalFailed} parsers need fixes to achieve 100% success rate.`);
      process.exit(1);
    } else {
      console.log('🎉 100% success rate achieved!');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
validateAllParsers(); 