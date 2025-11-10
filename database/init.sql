CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (username, password_hash)
VALUES (
    'usuario',
    '$2b$10$u1qdq9hsl5MzdQWx/juZEO6oZX6mE6xPD58Ll35H./TADaBrZE2S'
)
ON CONFLICT (username) DO NOTHING;
