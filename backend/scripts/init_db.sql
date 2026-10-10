-- ============================================
-- MazikDLP - Database Initialization
-- ============================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS mazikdlp;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA mazikdlp TO mazikdlp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mazikdlp TO mazikdlp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA mazikdlp GRANT ALL ON TABLES TO mazikdlp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA mazikdlp GRANT ALL ON SEQUENCES TO mazikdlp_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'MazikDLP database initialized successfully';
END $$;
