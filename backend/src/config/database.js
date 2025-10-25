const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    transcription TEXT,
    transcribed_at DATETIME,
    validation_status TEXT,
    validation_result TEXT,
    validated_at DATETIME,
    email_sent INTEGER DEFAULT 0,
    email_sent_at DATETIME
  )
`);

module.exports = db;
