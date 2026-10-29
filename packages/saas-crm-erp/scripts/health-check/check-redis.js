#!/usr/bin/env node

/**
 * Redis Health Check Script
 * Verifies Redis connectivity and basic functionality
 */

const Redis = require('ioredis');

const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    // Don't retry for health checks
    return null;
  },
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
};

async function checkRedis() {
  const redis = new Redis(config);
  const results = {
    success: false,
    checks: [],
    error: null,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('🔍 Checking Redis connectivity...');
    
    // 1. Ping Redis
    const pingStart = Date.now();
    const pingResponse = await redis.ping();
    const pingTime = Date.now() - pingStart;
    
    results.checks.push({
      name: 'redis_connection',
      status: pingResponse === 'PONG' ? 'pass' : 'fail',
      duration_ms: pingTime,
      message: pingResponse === 'PONG' 
        ? `Connected to Redis in ${pingTime}ms` 
        : `Unexpected ping response: ${pingResponse}`,
      data: {
        response: pingResponse,
      },
    });

    // 2. Set and get a test value
    const testKey = `health-check:${Date.now()}`;
    const testValue = 'health-check-value';
    
    const setStart = Date.now();
    await redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
    const setTime = Date.now() - setStart;
    
    results.checks.push({
      name: 'redis_set',
      status: 'pass',
      duration_ms: setTime,
      message: `SET operation completed in ${setTime}ms`,
    });

    const getStart = Date.now();
    const retrievedValue = await redis.get(testKey);
    const getTime = Date.now() - getStart;
    
    results.checks.push({
      name: 'redis_get',
      status: retrievedValue === testValue ? 'pass' : 'fail',
      duration_ms: getTime,
      message: retrievedValue === testValue
        ? `GET operation completed in ${getTime}ms`
        : `GET returned unexpected value: ${retrievedValue}`,
      data: {
        expected: testValue,
        actual: retrievedValue,
      },
    });

    // 3. Check Redis info
    const infoStart = Date.now();
    const info = await redis.info();
    const infoTime = Date.now() - infoStart;
    
    // Parse basic info from Redis INFO command
    const infoLines = info.split('\r\n');
    const redisInfo = {};
    infoLines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        redisInfo[key] = value;
      }
    });
    
    results.checks.push({
      name: 'redis_info',
      status: 'pass',
      duration_ms: infoTime,
      message: `Redis version: ${redisInfo.redis_version || 'unknown'}`,
      data: {
        version: redisInfo.redis_version,
        used_memory: redisInfo.used_memory_human,
        connected_clients: redisInfo.connected_clients,
        uptime_days: redisInfo.uptime_in_days,
      },
    });

    // 4. Check Redis memory usage
    const memoryUsage = parseFloat(redisInfo.used_memory_human) || 0;
    const memoryStatus = memoryUsage > 1024 ? 'warn' : 'pass'; // Warn if > 1GB
    
    if (memoryStatus === 'warn') {
      results.checks.push({
        name: 'redis_memory',
        status: 'warn',
        message: `High memory usage: ${redisInfo.used_memory_human}`,
        data: {
          used_memory: redisInfo.used_memory_human,
          maxmemory: redisInfo.maxmemory_human || 'not set',
        },
      });
    }

    // 5. Cleanup test key
    try {
      await redis.del(testKey);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    results.success = results.checks.every(check => check.status === 'pass');
    
    if (results.success) {
      console.log('✅ Redis health check passed');
    } else {
      console.log('⚠️  Redis health check completed with warnings/errors');
    }

  } catch (error) {
    console.error('❌ Redis health check failed:', error.message);
    
    results.success = false;
    results.error = {
      message: error.message,
      stack: error.stack,
    };
    
    results.checks.push({
      name: 'redis_connection',
      status: 'fail',
      message: `Connection failed: ${error.message}`,
    });
    
  } finally {
    try {
      await redis.quit();
    } catch (quitError) {
      // Ignore quit errors
    }
  }

  return results;
}

// Export for use in other scripts
module.exports = { checkRedis };

// Run if called directly
if (require.main === module) {
  checkRedis()
    .then(results => {
      console.log('\n📊 Redis Health Check Results:');
      console.log(JSON.stringify(results, null, 2));
      
      // Exit with appropriate code
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error during Redis check:', error);
      process.exit(1);
    });
}