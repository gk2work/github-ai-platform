-- Initialize GitHub AI Platform Database

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Basic tables will be created later via TypeORM migrations
-- This file ensures the database is ready for the application

-- Create initial admin user table (placeholder)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (email, name) VALUES ('admin@github-ai-platform.com', 'Admin User') 
ON CONFLICT (email) DO NOTHING;
