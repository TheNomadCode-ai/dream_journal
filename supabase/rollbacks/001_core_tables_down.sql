-- Migration 001: Core Tables (DOWN)
-- Drops all tables created in 001_core_tables.sql in reverse dependency order

DROP TABLE IF EXISTS public.dream_tags;
DROP TABLE IF EXISTS public.dreams;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.user_profiles;
