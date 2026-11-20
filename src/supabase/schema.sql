-- Relay MKE schema. Run once in the Supabase SQL editor.
-- Rows carry a jsonb `data` column mirroring the TypeScript types in lib/types.ts,
-- plus a few scalar columns for indexing. Keeps the weekend schema trivial.

create table if not exists requests (
  id text primary key,
  short_code text unique not null,
  status text not null,
  created_at timestamptz not null default now(),
  data jsonb not null
);
create index if not exists requests_status_idx on requests (status);

create table if not exists activity (
  id text primary key,
  request_id text not null references requests (id) on delete cascade,
  at timestamptz not null default now(),
  data jsonb not null
);
create index if not exists activity_request_idx on activity (request_id, at);

create table if not exists partners (
  id text primary key,
  data jsonb not null
);

create table if not exists playbooks (
  id text primary key,
  data jsonb not null
);

-- Row-level security: the app talks to Supabase only from the server with the
-- service key, so lock everything down for anon/authenticated roles.
alter table requests enable row level security;
alter table activity enable row level security;
alter table partners enable row level security;
alter table playbooks enable row level security;

-- Public read-only view for the Neighborhood Pulse: aggregates only, never rows.
create or replace view pulse_by_neighborhood as
select
  data->>'neighborhood' as neighborhood,
  count(*) filter (where status <> 'verified') as open_requests,
  count(*) as total_requests,
  jsonb_agg(distinct n) as needs
from requests, jsonb_array_elements_text(data->'needs') as n
group by 1;
