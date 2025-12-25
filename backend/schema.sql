-- FUaaS Database Schema
-- Cloudflare D1 (SQLite)

-- Drop existing table if recreating
DROP TABLE IF EXISTS quotes;

-- Main quotes table
CREATE TABLE quotes (
    id INTEGER PRIMARY KEY,
    quote TEXT NOT NULL,
    source_url TEXT NOT NULL,
    has_image BOOLEAN DEFAULT FALSE
);

-- Index for random selection with images
CREATE INDEX idx_quotes_has_image ON quotes(has_image);
