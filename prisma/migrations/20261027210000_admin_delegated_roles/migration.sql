-- Rôles délégués de l'administration (27/10/2026) : responsable carrière et modération.
ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'career_manager';
ALTER TYPE "PlatformRole" ADD VALUE IF NOT EXISTS 'moderator';
