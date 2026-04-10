create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "pg_net" with schema "extensions";

create extension if not exists "vector" with schema "extensions";

alter table "public"."workspaces" drop constraint "workspaces_plan_id_check";


  create table "public"."hub_events" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "task_id" uuid,
    "event_type" text not null,
    "payload" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."hub_events" enable row level security;


  create table "public"."hub_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "queue_name" text not null default 'default'::text,
    "payload" jsonb not null default '{}'::jsonb,
    "status" text not null default 'pending'::text,
    "priority" integer not null default 0,
    "scheduled_at" timestamp with time zone not null default now(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error" text,
    "result" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."hub_tasks" enable row level security;


  create table "public"."hub_workers" (
    "id" uuid not null default gen_random_uuid(),
    "workspace_id" uuid not null,
    "name" text not null,
    "status" text not null default 'idle'::text,
    "capabilities" jsonb not null default '[]'::jsonb,
    "last_heartbeat" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."hub_workers" enable row level security;

drop extension if exists "pg_net";

CREATE UNIQUE INDEX hub_events_pkey ON public.hub_events USING btree (id);

CREATE UNIQUE INDEX hub_tasks_pkey ON public.hub_tasks USING btree (id);

CREATE UNIQUE INDEX hub_workers_pkey ON public.hub_workers USING btree (id);

alter table "public"."hub_events" add constraint "hub_events_pkey" PRIMARY KEY using index "hub_events_pkey";

alter table "public"."hub_tasks" add constraint "hub_tasks_pkey" PRIMARY KEY using index "hub_tasks_pkey";

alter table "public"."hub_workers" add constraint "hub_workers_pkey" PRIMARY KEY using index "hub_workers_pkey";

alter table "public"."hub_events" add constraint "hub_events_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.hub_tasks(id) ON DELETE CASCADE not valid;

alter table "public"."hub_events" validate constraint "hub_events_task_id_fkey";

alter table "public"."hub_tasks" add constraint "hub_tasks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."hub_tasks" validate constraint "hub_tasks_status_check";

alter table "public"."hub_workers" add constraint "hub_workers_status_check" CHECK ((status = ANY (ARRAY['idle'::text, 'busy'::text, 'offline'::text]))) not valid;

alter table "public"."hub_workers" validate constraint "hub_workers_status_check";

alter table "public"."workspaces" add constraint "workspaces_plan_id_check" CHECK ((plan_id = ANY (ARRAY['free'::text, 'pro'::text, 'team'::text, 'enterprise'::text]))) not valid;

alter table "public"."workspaces" validate constraint "workspaces_plan_id_check";

grant delete on table "public"."hub_events" to "anon";

grant insert on table "public"."hub_events" to "anon";

grant references on table "public"."hub_events" to "anon";

grant select on table "public"."hub_events" to "anon";

grant trigger on table "public"."hub_events" to "anon";

grant truncate on table "public"."hub_events" to "anon";

grant update on table "public"."hub_events" to "anon";

grant delete on table "public"."hub_events" to "authenticated";

grant insert on table "public"."hub_events" to "authenticated";

grant references on table "public"."hub_events" to "authenticated";

grant select on table "public"."hub_events" to "authenticated";

grant trigger on table "public"."hub_events" to "authenticated";

grant truncate on table "public"."hub_events" to "authenticated";

grant update on table "public"."hub_events" to "authenticated";

grant delete on table "public"."hub_events" to "service_role";

grant insert on table "public"."hub_events" to "service_role";

grant references on table "public"."hub_events" to "service_role";

grant select on table "public"."hub_events" to "service_role";

grant trigger on table "public"."hub_events" to "service_role";

grant truncate on table "public"."hub_events" to "service_role";

grant update on table "public"."hub_events" to "service_role";

grant delete on table "public"."hub_tasks" to "anon";

grant insert on table "public"."hub_tasks" to "anon";

grant references on table "public"."hub_tasks" to "anon";

grant select on table "public"."hub_tasks" to "anon";

grant trigger on table "public"."hub_tasks" to "anon";

grant truncate on table "public"."hub_tasks" to "anon";

grant update on table "public"."hub_tasks" to "anon";

grant delete on table "public"."hub_tasks" to "authenticated";

grant insert on table "public"."hub_tasks" to "authenticated";

grant references on table "public"."hub_tasks" to "authenticated";

grant select on table "public"."hub_tasks" to "authenticated";

grant trigger on table "public"."hub_tasks" to "authenticated";

grant truncate on table "public"."hub_tasks" to "authenticated";

grant update on table "public"."hub_tasks" to "authenticated";

grant delete on table "public"."hub_tasks" to "service_role";

grant insert on table "public"."hub_tasks" to "service_role";

grant references on table "public"."hub_tasks" to "service_role";

grant select on table "public"."hub_tasks" to "service_role";

grant trigger on table "public"."hub_tasks" to "service_role";

grant truncate on table "public"."hub_tasks" to "service_role";

grant update on table "public"."hub_tasks" to "service_role";

grant delete on table "public"."hub_workers" to "anon";

grant insert on table "public"."hub_workers" to "anon";

grant references on table "public"."hub_workers" to "anon";

grant select on table "public"."hub_workers" to "anon";

grant trigger on table "public"."hub_workers" to "anon";

grant truncate on table "public"."hub_workers" to "anon";

grant update on table "public"."hub_workers" to "anon";

grant delete on table "public"."hub_workers" to "authenticated";

grant insert on table "public"."hub_workers" to "authenticated";

grant references on table "public"."hub_workers" to "authenticated";

grant select on table "public"."hub_workers" to "authenticated";

grant trigger on table "public"."hub_workers" to "authenticated";

grant truncate on table "public"."hub_workers" to "authenticated";

grant update on table "public"."hub_workers" to "authenticated";

grant delete on table "public"."hub_workers" to "service_role";

grant insert on table "public"."hub_workers" to "service_role";

grant references on table "public"."hub_workers" to "service_role";

grant select on table "public"."hub_workers" to "service_role";

grant trigger on table "public"."hub_workers" to "service_role";

grant truncate on table "public"."hub_workers" to "service_role";

grant update on table "public"."hub_workers" to "service_role";


  create policy "service_role_bypass"
  on "public"."hub_events"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "tenant_member_read"
  on "public"."hub_events"
  as permissive
  for select
  to authenticated
using ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));



  create policy "service_role_bypass"
  on "public"."hub_tasks"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "tenant_member_read"
  on "public"."hub_tasks"
  as permissive
  for select
  to authenticated
using ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));



  create policy "service_role_bypass"
  on "public"."hub_workers"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "tenant_member_read"
  on "public"."hub_workers"
  as permissive
  for select
  to authenticated
using ((workspace_id IN ( SELECT workspace_memberships.workspace_id
   FROM public.workspace_memberships
  WHERE (workspace_memberships.user_id = auth.uid()))));



