import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

const dbPath = process.env.DB_PATH || "data/app.db";
const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA foreign_keys = ON;");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS application_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS application_resume_ats_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    resume_version_id TEXT NOT NULL,
    resume_version_title TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    matched_keyword_count INTEGER NOT NULL,
    total_keyword_count INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    summary TEXT,
    skills TEXT,
    visibility_config TEXT NOT NULL DEFAULT '{}',
    is_main INTEGER NOT NULL DEFAULT 0,
    application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    parent_version_id INTEGER REFERENCES resume_versions(id) ON DELETE SET NULL,
    font_size REAL NOT NULL DEFAULT 11,
    margin_top REAL NOT NULL DEFAULT 0.75,
    margin_right REAL NOT NULL DEFAULT 0.75,
    margin_bottom REAL NOT NULL DEFAULT 0.75,
    margin_left REAL NOT NULL DEFAULT 0.75,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_education_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    school_name TEXT NOT NULL DEFAULT '',
    degree TEXT NOT NULL DEFAULT '',
    field_of_study TEXT NOT NULL DEFAULT '',
    gpa TEXT,
    courses TEXT,
    awards_honors TEXT,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    visibility_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_generated_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    format TEXT NOT NULL,
    label TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_work_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    company_name TEXT NOT NULL DEFAULT '',
    role_title TEXT NOT NULL DEFAULT '',
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    bullets TEXT,
    visibility_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL DEFAULT '',
    link TEXT,
    technologies TEXT,
    description TEXT,
    visibility_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resume_certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL DEFAULT '',
    issuer TEXT,
    issue_date TEXT,
    credential_id TEXT,
    visibility_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

try {
  sqlite.exec(`ALTER TABLE applications ADD COLUMN cover_letter_text TEXT;`);
} catch {
  // Column already exists
}

try {
  sqlite.exec(`ALTER TABLE applications ADD COLUMN attached_resume_version_id TEXT;`);
} catch {
  // Column already exists
}

for (const statement of [
  `ALTER TABLE applications ADD COLUMN employment_type TEXT NOT NULL DEFAULT 'full_time';`,
  `ALTER TABLE applications ADD COLUMN workplace_type TEXT NOT NULL DEFAULT 'remote';`,
  `ALTER TABLE applications ADD COLUMN compensation_type TEXT NOT NULL DEFAULT 'salary';`,
  `ALTER TABLE applications ADD COLUMN job_posted_at TEXT;`,
  `ALTER TABLE applications ADD COLUMN job_application_url TEXT;`,
  `ALTER TABLE applications ADD COLUMN job_application_status_url TEXT;`,
  `ALTER TABLE applications ADD COLUMN work_location_city TEXT;`,
  `ALTER TABLE applications ADD COLUMN work_location_state TEXT;`,
  `ALTER TABLE applications ADD COLUMN offers_equity INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE applications ADD COLUMN hiring_manager_name TEXT;`,
  `ALTER TABLE applications ADD COLUMN hiring_manager_email TEXT;`,
  `ALTER TABLE applications ADD COLUMN hiring_manager_phone TEXT;`,
  `ALTER TABLE applications ADD COLUMN hiring_manager_linkedin_url TEXT;`,
  `ALTER TABLE applications ADD COLUMN application_medium TEXT;`,
]) {
  try {
    sqlite.exec(statement);
  } catch {
    // Column already exists
  }
}

for (const statement of [
  `ALTER TABLE resume_versions ADD COLUMN public_id TEXT;`,
  `ALTER TABLE resume_versions ADD COLUMN location TEXT;`,
  `ALTER TABLE resume_versions ADD COLUMN font_size REAL NOT NULL DEFAULT 11;`,
  `ALTER TABLE resume_versions ADD COLUMN summary TEXT;`,
  `ALTER TABLE resume_versions ADD COLUMN skills TEXT;`,
  `ALTER TABLE resume_versions ADD COLUMN visibility_config TEXT NOT NULL DEFAULT '{}';`,
  `ALTER TABLE resume_versions ADD COLUMN is_main INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE resume_versions ADD COLUMN application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL;`,
  `ALTER TABLE resume_versions ADD COLUMN margin_top REAL NOT NULL DEFAULT 0.75;`,
  `ALTER TABLE resume_versions ADD COLUMN margin_right REAL NOT NULL DEFAULT 0.75;`,
  `ALTER TABLE resume_versions ADD COLUMN margin_bottom REAL NOT NULL DEFAULT 0.75;`,
  `ALTER TABLE resume_versions ADD COLUMN margin_left REAL NOT NULL DEFAULT 0.75;`,
  `ALTER TABLE resume_education_entries ADD COLUMN gpa TEXT;`,
  `ALTER TABLE resume_education_entries ADD COLUMN courses TEXT;`,
  `ALTER TABLE resume_education_entries ADD COLUMN awards_honors TEXT;`,
  `ALTER TABLE resume_education_entries ADD COLUMN visibility_config TEXT NOT NULL DEFAULT '{}';`,
  `ALTER TABLE resume_work_experiences ADD COLUMN visibility_config TEXT NOT NULL DEFAULT '{}';`,
  `ALTER TABLE resume_projects ADD COLUMN visibility_config TEXT NOT NULL DEFAULT '{}';`,
  `ALTER TABLE resume_certifications ADD COLUMN visibility_config TEXT NOT NULL DEFAULT '{}';`,
]) {
  try {
    sqlite.exec(statement);
  } catch {
    // Column already exists
  }
}

sqlite.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS resume_versions_public_id_idx
  ON resume_versions(public_id);
`);

const resumeVersionRows = sqlite
  .query("SELECT id FROM resume_versions WHERE public_id IS NULL OR public_id = ''")
  .all() as Array<{ id: number }>;

for (const row of resumeVersionRows) {
  sqlite
    .query("UPDATE resume_versions SET public_id = ? WHERE id = ?")
    .run(randomUUID(), row.id);
}

console.log("Database migrations complete.");
sqlite.close();
