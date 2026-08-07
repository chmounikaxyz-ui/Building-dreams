import { DatabaseSync } from 'node:sqlite';

try {
  const db = new DatabaseSync('prisma/dev.db');
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("TABLES IN SQLITE:", tables);

  if (tables.some(t => t.name === 'User')) {
    const users = db.prepare("SELECT id, name, email, role FROM User").all();
    console.log("USERS IN SQLITE:", users);
  }
  
  if (tables.some(t => t.name === 'Post')) {
    const posts = db.prepare("SELECT id, description, userId FROM Post").all();
    console.log("POSTS IN SQLITE:", posts);
  }
} catch (err) {
  console.error("SQLite read error:", err);
}
