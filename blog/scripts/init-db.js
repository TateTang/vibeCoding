const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

function splitSqlStatements(sqlText) {
  return sqlText
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function initDatabase() {
  const schemaPath = path.resolve(__dirname, '../sql/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  const statements = splitSqlStatements(schemaSql);

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: false,
  });

  try {
    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log(`Database ${env.db.database} initialized successfully.`);
  } finally {
    await connection.end();
  }
}

initDatabase().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exitCode = 1;
});
