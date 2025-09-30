-- Drop existing tables if they exist
DROP TABLE IF EXISTS depth_records;
DROP TABLE IF EXISTS dive_sessions;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dive_sessions table
CREATE TABLE dive_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date TIMESTAMP NOT NULL,
    location VARCHAR(100),
    max_depth DECIMAL(5,2),
    duration INTEGER,
    water_temp DECIMAL(5,2),
    water_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create depth_records table
CREATE TABLE depth_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES dive_sessions(id),
    timestamp TIMESTAMP NOT NULL,
    depth DECIMAL(5,2) NOT NULL,
    temperature DECIMAL(5,2)
);

-- Insert test user (password is 'password123')
INSERT INTO users (username, email, hashed_password)
VALUES (
    'testuser',
    'test@example.com',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
);