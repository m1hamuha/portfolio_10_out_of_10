#!/usr/bin/env node

/**
 * Combined Health Check Script
 * Runs all infrastructure health checks and aggregates results
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

async function runHealthCheck(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  
  try {
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    try {
      // Try to parse JSON output from the script
      const lines = stdout.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        return JSON.parse(jsonLine);
      }
    } catch (parseError) {
      // If we can't parse JSON, create a basic result
      return {
        success: false,
        error: `Could not parse output from ${scriptName}`,
        rawOutput: stdout.substring(0, 500), // First 500 chars
      };
    }
    
    return {
      success: false,
      error: `No JSON output from ${scriptName}`,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
      stdout: error.stdout,
    };
  }
}

async function checkAll() {
  console.log('🚀 Starting comprehensive infrastructure health checks\n');
  
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    duration_ms: 0,
    services: {},
    overall: {
      success: false,
      passed: 0,
      failed: 0,
      total: 0,
    },
  };

  // Define health checks to run
  const healthChecks = [
    { name: 'database', script: 'check-database.js' },
    { name: 'redis', script: 'check-redis.js' },
    // Add more checks as needed: rabbitmq, api, frontend, etc.
  ];

  // Run checks in parallel
  const checkPromises = healthChecks.map(async (check) => {
    console.log(`🔍 Running ${check.name} health check...`);
    const result = await runHealthCheck(check.script);
    return { name: check.name, result };
  });

  const checkResults = await Promise.all(checkPromises);

  // Process results
  checkResults.forEach(({ name, result }) => {
    results.services[name] = result;
    
    if (result.success) {
      results.overall.passed++;
    } else {
      results.overall.failed++;
    }
    results.overall.total++;
  });

  // Calculate overall status
  results.duration_ms = Date.now() - startTime;
  results.overall.success = results.overall.failed === 0;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 INFRASTRUCTURE HEALTH CHECK SUMMARY');
  console.log('='.repeat(60));
  
  checkResults.forEach(({ name, result }) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name.toUpperCase()}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Print individual check results if available
    if (result.checks) {
      result.checks.forEach(check => {
        const checkStatus = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
        console.log(`   ${checkStatus} ${check.name}: ${check.message}`);
      });
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total checks: ${results.overall.total}`);
  console.log(`Passed: ${results.overall.passed}`);
  console.log(`Failed: ${results.overall.failed}`);
  console.log(`Duration: ${results.duration_ms}ms`);
  console.log(`Overall status: ${results.overall.success ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log('='.repeat(60));

  // Generate recommendations if any checks failed
  if (!results.overall.success) {
    console.log('\n🔧 RECOMMENDATIONS:');
    
    if (!results.services.database?.success) {
      console.log('• Check PostgreSQL service is running');
      console.log('• Verify database credentials in environment variables');
      console.log('• Ensure database has required tables and migrations');
    }
    
    if (!results.services.redis?.success) {
      console.log('• Check Redis service is running');
      console.log('• Verify Redis connection settings');
      console.log('• Check Redis memory usage and configuration');
    }
    
    console.log('\n💡 Run individual checks for more details:');
    console.log('  node scripts/health-check/check-database.js');
    console.log('  node scripts/health-check/check-redis.js');
  }

  return results;
}

// Export for use in other scripts
module.exports = { checkAll };

// Run if called directly
if (require.main === module) {
  checkAll()
    .then(results => {
      // Exit with appropriate code
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error during health checks:', error);
      process.exit(1);
    });
}