#!/usr/bin/env node

/**
 * Database Health Check Script
 * Verifies PostgreSQL connectivity and basic functionality
 */

const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crm_erp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
  connectionTimeoutMillis: 10000,
};

async function checkDatabase() {
  const client = new Client(config);
  const results = {
    success: false,
    checks: [],
    error: null,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('🔍 Checking database connectivity...');
    
    // 1. Connect to database
    const connectStart = Date.now();
    try {
      await client.connect();
    } catch (connectError) {
      console.error('Database connection error:', connectError.message);
      if (connectError.message.includes('timeout')) {
        console.log('Connection timeout - database may not be ready yet');
      }
      throw connectError;
    }
    const connectTime = Date.now() - connectStart;
    
    results.checks.push({
      name: 'database_connection',
      status: 'pass',
      duration_ms: connectTime,
      message: `Connected to ${config.database} in ${connectTime}ms`,
    });

    // 2. Execute simple query
    const queryStart = Date.now();
    const queryResult = await client.query('SELECT 1 as test, version() as version');
    const queryTime = Date.now() - queryStart;
    
    results.checks.push({
      name: 'database_query',
      status: 'pass',
      duration_ms: queryTime,
      message: `Query executed in ${queryTime}ms`,
      data: {
        test_value: queryResult.rows[0].test,
        version: queryResult.rows[0].version.split(' ').slice(0, 3).join(' '),
      },
    });

    // 3. Check required tables exist
    const tablesStart = Date.now();
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tablesTime = Date.now() - tablesStart;
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    const requiredTables = ['organizations', 'users', 'customers'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    results.checks.push({
      name: 'database_tables',
      status: missingTables.length === 0 ? 'pass' : 'fail',
      duration_ms: tablesTime,
      message: missingTables.length === 0 
        ? `All required tables exist (${tableNames.length} total tables)`
        : `Missing tables: ${missingTables.join(', ')}`,
      data: {
        total_tables: tableNames.length,
        required_tables: requiredTables,
        missing_tables: missingTables,
      },
    });

    // 4. Check migrations table
    try {
      const migrationsResult = await client.query(`
        SELECT COUNT(*) as count FROM migrations
      `);
      
      results.checks.push({
        name: 'database_migrations',
        status: 'pass',
        message: `Found ${migrationsResult.rows[0].count} applied migrations`,
        data: {
          migration_count: parseInt(migrationsResult.rows[0].count),
        },
      });
    } catch (migrationError) {
      results.checks.push({
        name: 'database_migrations',
        status: 'warn',
        message: 'Migrations table not found or not accessible',
        error: migrationError.message,
      });
    }

    // 5. Check database size and connections
    const statsStart = Date.now();
    const statsResult = await client.query(`
      SELECT 
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections
    `);
    const statsTime = Date.now() - statsStart;
    
    const sizeMB = Math.round(statsResult.rows[0].size_bytes / 1024 / 1024);
    
    results.checks.push({
      name: 'database_stats',
      status: 'pass',
      duration_ms: statsTime,
      message: `Database size: ${sizeMB}MB, Active connections: ${statsResult.rows[0].active_connections}`,
      data: {
        size_bytes: parseInt(statsResult.rows[0].size_bytes),
        size_mb: sizeMB,
        active_connections: parseInt(statsResult.rows[0].active_connections),
      },
    });

    results.success = results.checks.every(check => check.status === 'pass');
    
    if (results.success) {
      console.log('✅ Database health check passed');
    } else {
      console.log('⚠️  Database health check completed with warnings/errors');
    }

  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    
    results.success = false;
    results.error = {
      message: error.message,
      stack: error.stack,
    };
    
    results.checks.push({
      name: 'database_connection',
      status: 'fail',
      message: `Connection failed: ${error.message}`,
    });
    
  } finally {
    try {
      await client.end();
    } catch (endError) {
      // Ignore connection end errors
    }
  }

  return results;
}

// Export for use in other scripts
module.exports = { checkDatabase };

// Run if called directly
if (require.main === module) {
  checkDatabase()
    .then(results => {
      console.log('\n📊 Database Health Check Results:');
      console.log(JSON.stringify(results, null, 2));
      
      // Exit with appropriate code
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error during database check:', error);
      process.exit(1);
    });
}