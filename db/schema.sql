-- db/schema.sql
-- World Explorer: Authentic UPSC/MPSC Question Bank & Places Schema for Neon Postgres

-- 1. Table: quiz_questions
-- Stores authenticated questions with syllabus classification, difficulty, and editorial status
CREATE TABLE IF NOT EXISTS quiz_questions (
    id VARCHAR(64) PRIMARY KEY,
    mode VARCHAR(32) NOT NULL DEFAULT 'kbc', -- 'kbc', 'india', 'world'
    category VARCHAR(128) NOT NULL,          -- e.g. 'Indian Physical Geography (UPSC)', 'History & Heritage'
    subcategory VARCHAR(128),                 -- e.g. 'River Basins', 'Western Ghats', 'UNESCO Sites'
    difficulty VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'EASY', 'MEDIUM', 'HARD'
    question TEXT NOT NULL,
    options JSONB NOT NULL,                   -- Array of options: ["Option A", "Option B", "Option C", "Option D"]
    answer_index INTEGER NOT NULL,            -- 0-based index of correct option (never exposed to client until checked)
    target_code VARCHAR(32),                  -- Country/State code for map click questions (e.g. 'MH', 'IN')
    lat NUMERIC(9, 6),                        -- Coordinates for map focus
    lng NUMERIC(9, 6),
    hint TEXT,
    fact TEXT,
    explanation TEXT NOT NULL,
    source_syllabus VARCHAR(128) DEFAULT 'NCERT / UPSC Prelims', -- Citation for authenticity verification
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-speed random quiz fetching by mode and verification
CREATE INDEX IF NOT EXISTS idx_quiz_questions_mode_verified ON quiz_questions(mode, is_verified);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);

-- 2. Table: historical_places
-- Curated historical and architectural wonders with verified hook data
CREATE TABLE IF NOT EXISTS historical_places (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state_or_country VARCHAR(128) NOT NULL,
    era VARCHAR(128) NOT NULL,                -- e.g. 'Harappan 2500 BCE', 'Rashtrakuta 8th Century CE'
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    history_hook TEXT NOT NULL,               -- The fascinating hook / wow moment
    architectural_significance TEXT NOT NULL,
    image_url TEXT,
    is_unesco BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: user_place_submissions
-- Moderated community submissions for regional places and wonders
CREATE TABLE IF NOT EXISTS user_place_submissions (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(128) DEFAULT 'Anonymous Explorer',
    place_name VARCHAR(255) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state_or_country VARCHAR(128) NOT NULL,
    historical_notes TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    status VARCHAR(32) DEFAULT 'pending',     -- 'pending', 'approved', 'rejected'
    moderation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
