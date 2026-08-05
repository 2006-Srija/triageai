-- TriageAI Database Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor to initialize the database

-- ============================================================
-- ORGANIZATIONS (tenants)
-- Each signup creates a new organization. Organizations have an
-- optional invite_code for joining an existing team.
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- USERS (belong to one tenant, have a role within it)
-- Roles: Admin, Agent, Viewer
-- Every query MUST filter by tenant_id from JWT, never from
-- request body.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'Agent' CHECK (role IN ('Admin', 'Agent', 'Viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email    ON users(email);

-- ============================================================
-- TICKETS (customer support tickets)
-- Each ticket is owned by a tenant. The AI triage pipeline
-- categorizes, prioritizes, assesses sentiment, and detects
-- prompt injection attempts. Suggested response is AI-generated
-- and editable by agents.
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject           TEXT NOT NULL,
  description       TEXT NOT NULL,
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_email    TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  category          TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Billing', 'Technical', 'Complaint', 'General', 'Feature Request')),
  priority          TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  sentiment         TEXT NOT NULL DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Neutral', 'Negative', 'Angry')),
  summary           TEXT NOT NULL DEFAULT '',
  suggested_response TEXT NOT NULL DEFAULT '',
  security_flag     BOOLEAN NOT NULL DEFAULT false,
  assigned_to       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_tenant_id    ON tickets(tenant_id);
CREATE INDEX idx_tickets_status       ON tickets(status);
CREATE INDEX idx_tickets_category     ON tickets(category);
CREATE INDEX idx_tickets_priority     ON tickets(priority);
CREATE INDEX idx_tickets_tenant_status ON tickets(tenant_id, status);
