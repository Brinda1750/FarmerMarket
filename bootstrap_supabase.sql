-- ===================================================================
-- SUPABASE BOOTSTRAP FOR AURORA POSTGRESQL (NO PGJWT REQUIRED)
-- ===================================================================

-- 1. CREATE EXTENSIONS (Aurora PostgreSQL compatible only)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NOTE: pgjwt is NOT needed for Supabase to function; GoTrue validates JWTs

-- 2. CREATE SCHEMAS
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS realtime AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION postgres;

-- 3. CREATE ROLES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
        RAISE NOTICE 'Created role: anon';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
        RAISE NOTICE 'Created role: authenticated';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
        RAISE NOTICE 'Created role: service_role';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT CREATEROLE CREATEDB;
        RAISE NOTICE 'Created role: supabase_auth_admin';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE ROLE supabase_storage_admin NOLOGIN NOINHERIT CREATEROLE;
        RAISE NOTICE 'Created role: supabase_storage_admin';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
        CREATE ROLE supabase_realtime_admin NOLOGIN NOINHERIT CREATEROLE;
        RAISE NOTICE 'Created role: supabase_realtime_admin';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'REPLACE_WITH_SECURE_PASSWORD';
        RAISE NOTICE 'Created role: authenticator';
    END IF;
END $$;

-- 4. TRANSFER SCHEMA OWNERSHIP
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
ALTER SCHEMA storage OWNER TO supabase_storage_admin;
ALTER SCHEMA realtime OWNER TO supabase_realtime_admin;
ALTER SCHEMA _realtime OWNER TO supabase_realtime_admin;

-- 5. GRANT SCHEMA USAGE PERMISSIONS
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA storage TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA realtime TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA _realtime TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;

-- 6. GRANT CREATE PRIVILEGES TO ADMIN ROLES
GRANT CREATE ON SCHEMA auth TO supabase_auth_admin;
GRANT CREATE ON SCHEMA storage TO supabase_storage_admin;
GRANT CREATE ON SCHEMA realtime TO supabase_realtime_admin;
GRANT CREATE ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT CREATE ON SCHEMA public TO authenticated, service_role;

-- 7. GRANT ROLE MEMBERSHIPS TO AUTHENTICATOR
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- 8. GRANT ADMIN ROLES TO POSTGRES SUPERUSER
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;
GRANT supabase_realtime_admin TO postgres;

-- 9. CREATE auth.schema_migrations TABLE
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version character varying(255) NOT NULL PRIMARY KEY,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

COMMENT ON TABLE auth.schema_migrations IS 'Tracks GoTrue migration versions';

-- 10. SET DEFAULT PRIVILEGES FOR FUTURE OBJECTS
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA realtime GRANT ALL ON TABLES TO supabase_realtime_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- 11. ENABLE EXTENSIONS SCHEMA
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 12. VERIFICATION OUTPUT
DO $$
BEGIN
    RAISE NOTICE 'Bootstrap complete. Verify schemas, roles, and migrations table.';
END $$;

SELECT 'BOOTSTRAP COMPLETE' AS status,
       now() AS completed_at,
       current_database() AS database;
