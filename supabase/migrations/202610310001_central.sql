-- Central Condomínio. All writes use authenticated, transactional functions.
create table public.condominiums (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120),
 timezone text not null default 'America/Fortaleza', settings jsonb not null default '{"announcement_approval":false,"document_approval":false,"service_approval":false,"require_evidence":true}',
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null references public.condominiums(id),
 user_id uuid not null references auth.users(id), display_name text not null, role text not null check(role in ('admin','manager','operator')),
 permissions text[] not null default '{}', active boolean not null default true, unique(condominium_id,user_id)
);
create table public.records (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null references public.condominiums(id),
 kind text not null check(kind in ('requests','services','announcements','documents','blocks','units','people','unit_memberships','checklist_templates','checklist_runs')),
 title text not null check(length(title) between 2 and 180), status text not null, data jsonb not null default '{}',
 assigned_to uuid, due_date date, revision integer not null default 1, file_revision integer not null default 1,
 created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(condominium_id,id), foreign key(condominium_id,assigned_to) references public.memberships(condominium_id,user_id)
);
create index records_scope on public.records(condominium_id,kind,updated_at desc);
create index records_assignment on public.records(condominium_id,assigned_to,status);
create index records_due on public.records(condominium_id,due_date);
create table public.record_versions (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null,
 revision integer not null, snapshot jsonb not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(record_id,revision), foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
create table public.audit_events (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null references public.condominiums(id),
 record_id uuid, actor_id uuid not null references auth.users(id), action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now(),
 foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
create index audit_scope on public.audit_events(condominium_id,created_at desc);
create table public.messages (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null,
 body text not null check(length(body) between 1 and 5000), visibility text not null check(visibility in ('internal','external')),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
create table public.approvals (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null, revision integer not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','superseded')),
 requested_by uuid not null references auth.users(id), decided_by uuid references auth.users(id), reason text, created_at timestamptz not null default now(), decided_at timestamptz,
 unique(record_id,revision), foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
create table public.recipients (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null, revision integer not null,
 person_id uuid not null, unit_id uuid not null, created_at timestamptz not null default now(),
 unique(record_id,revision,person_id,unit_id),
 foreign key(condominium_id,record_id) references public.records(condominium_id,id),
 foreign key(condominium_id,person_id) references public.records(condominium_id,id),
 foreign key(condominium_id,unit_id) references public.records(condominium_id,id)
);
create table public.announcement_events (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null, revision integer not null,
 person_id uuid not null, event text not null check(event in ('notification_sent','opened','acknowledged')), channel text not null,
 created_at timestamptz not null default now(), foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
-- No client write path for delivery/open/acknowledgement events. Future integrations must authenticate provenance.
create table public.attachments (
 id uuid primary key default gen_random_uuid(), condominium_id uuid not null, record_id uuid not null, revision integer not null,
 name text not null, path text not null unique, mime text not null, size integer not null check(size between 1 and 10485760),
 category text not null check(category in ('attachment','before','after','evidence')), ready boolean not null default false,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 foreign key(condominium_id,record_id) references public.records(condominium_id,id)
);
create index attachments_record on public.attachments(condominium_id,record_id);
create index messages_record on public.messages(condominium_id,record_id,created_at);
create index versions_record on public.record_versions(condominium_id,record_id,revision);
create index approvals_scope on public.approvals(condominium_id,status);
create index recipients_scope on public.recipients(condominium_id,record_id,revision);

create function public.has_permission(c uuid, p text) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships m where m.condominium_id=c and m.user_id=(select auth.uid()) and m.active and (p=any(m.permissions) or '*'=any(m.permissions)));
$$;
create function public.can_read_record(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.records r join public.memberships m on m.condominium_id=r.condominium_id and m.user_id=(select auth.uid()) and m.active
 where r.id=rid and public.has_permission(r.condominium_id,r.kind||'.read')
 and (m.role<>'operator' or r.assigned_to=(select auth.uid()) or (r.kind||'.read_all')=any(m.permissions) or '*'=any(m.permissions)));
$$;
create function public.can_write_record(rid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.records r where r.id=rid and public.can_read_record(r.id) and public.has_permission(r.condominium_id,r.kind||'.write'));
$$;

alter table public.condominiums enable row level security;
alter table public.memberships enable row level security;
alter table public.records enable row level security;
alter table public.record_versions enable row level security;
alter table public.audit_events enable row level security;
alter table public.messages enable row level security;
alter table public.approvals enable row level security;
alter table public.recipients enable row level security;
alter table public.announcement_events enable row level security;
alter table public.attachments enable row level security;
create policy condo_read on public.condominiums for select to authenticated using(exists(select 1 from public.memberships m where m.condominium_id=condominiums.id and m.user_id=(select auth.uid()) and m.active));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()) or public.has_permission(condominium_id,'members.read'));
create policy records_read on public.records for select to authenticated using(public.can_read_record(id));
create policy versions_read on public.record_versions for select to authenticated using(public.can_read_record(record_id));
create policy audit_read on public.audit_events for select to authenticated using(public.has_permission(condominium_id,'audit.read') and ((record_id is null and public.has_permission(condominium_id,'members.read')) or public.can_read_record(record_id)));
create policy messages_read on public.messages for select to authenticated using(public.can_read_record(record_id));
create policy approvals_read on public.approvals for select to authenticated using(public.can_read_record(record_id) and public.has_permission(condominium_id,'approvals.read'));
create policy recipients_read on public.recipients for select to authenticated using(public.can_read_record(record_id));
create policy announcement_events_read on public.announcement_events for select to authenticated using(public.can_read_record(record_id));
create policy attachments_read on public.attachments for select to authenticated using(public.can_read_record(record_id));
revoke all on public.condominiums,public.memberships,public.records,public.record_versions,public.audit_events,public.messages,public.approvals,public.recipients,public.announcement_events,public.attachments from anon,authenticated;
grant select on public.condominiums,public.memberships,public.records,public.record_versions,public.audit_events,public.messages,public.approvals,public.recipients,public.announcement_events,public.attachments to authenticated;

create function public.log_event(c uuid, rid uuid, act text, info jsonb default '{}') returns void language plpgsql security definer set search_path = '' as $$
 begin insert into public.audit_events(condominium_id,record_id,actor_id,action,detail) values(c,rid,auth.uid(),act,info); end;
$$;
create function public.snapshot_record(rid uuid) returns void language plpgsql security definer set search_path = '' as $$
 begin
 insert into public.record_versions(condominium_id,record_id,revision,snapshot,created_by)
 select r.condominium_id,r.id,r.revision,to_jsonb(r)||jsonb_build_object('files',coalesce((select jsonb_agg(to_jsonb(a)) from public.attachments a where a.record_id=r.id and a.revision=r.file_revision and a.ready),'[]'::jsonb)),auth.uid() from public.records r where r.id=rid;
 end;
$$;

-- A verified account can create its own new condominium; cannot join an existing one by knowing its ID.
create function public.bootstrap_condominium(p_name text, p_display_name text) returns uuid language plpgsql security definer set search_path = '' as $$
 declare cid uuid;
 begin
 if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail antes de criar um condomínio'; end if;
 if length(trim(p_name))<2 or length(trim(p_name))>120 or length(trim(p_display_name))<2 then raise exception 'Informe nome e identificação válidos'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from public.memberships where user_id=auth.uid()) then raise exception 'Conta já vinculada. Solicite inclusão a um administrador'; end if;
 insert into public.condominiums(name,created_by) values(trim(p_name),auth.uid()) returning id into cid;
 insert into public.memberships(condominium_id,user_id,display_name,role,permissions) values(cid,auth.uid(),trim(p_display_name),'admin',array['*']);
 perform public.log_event(cid,null,'condominium.created');
 return cid;
 end;
$$;

create function public.save_record(p_condominium uuid, p_kind text, p_id uuid, p_revision integer, p_title text, p_data jsonb, p_assigned uuid default null, p_due date default null)
 returns uuid language plpgsql security definer set search_path = '' as $$
 declare old public.records; rid uuid; refkey text; expected_kind text; refid uuid; v_status text; myrole text;
 begin
 if not public.has_permission(p_condominium,p_kind||'.write') then raise exception 'Sem permissão para salvar'; end if;
 select role into myrole from public.memberships where condominium_id=p_condominium and user_id=auth.uid() and active;
 if p_kind not in ('requests','services','announcements','documents','blocks','units','people','unit_memberships','checklist_templates') then raise exception 'Tipo inválido'; end if;
 if length(trim(p_title))<2 or length(p_title)>180 or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>50000 then raise exception 'Dados inválidos'; end if;
 -- Reject unknown keys to prevent injecting execution/provenance fields.
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('description','priority','location','category','body','audience','audience_ids','block_id','unit_id','person_id','relationship','phone','email','validated','items','completion_note')) then raise exception 'Campo não permitido'; end if;
 if p_data ? 'validated' and jsonb_typeof(p_data->'validated')<>'boolean' then raise exception 'Validação inválida'; end if;
 if p_data ? 'priority' and p_data->>'priority' not in ('low','normal','high','urgent') then raise exception 'Prioridade inválida'; end if;
 if p_data ? 'audience' and p_data->>'audience' not in ('all','blocks','units') then raise exception 'Público inválido'; end if;
 if p_data ? 'items' and (jsonb_typeof(p_data->'items')<>'array' or jsonb_array_length(p_data->'items')>100) then raise exception 'Checklist inválido'; end if;
 if p_kind='checklist_templates' and (not p_data ? 'items' or jsonb_array_length(p_data->'items')=0 or exists(select 1 from jsonb_array_elements(p_data->'items') i where jsonb_typeof(i)<>'string' or length(trim(i#>>'{}'))=0)) then raise exception 'Informe os itens do checklist'; end if;
 if p_data ? 'audience_ids' and (jsonb_typeof(p_data->'audience_ids')<>'array' or jsonb_array_length(p_data->'audience_ids')>500) then raise exception 'Público inválido'; end if;
 foreach refkey in array array['block_id','unit_id','person_id'] loop
  if nullif(p_data->>refkey,'') is not null then
   expected_kind:=case refkey when 'block_id' then 'blocks' when 'unit_id' then 'units' else 'people' end;
   if not exists(select 1 from public.records where id=(p_data->>refkey)::uuid and condominium_id=p_condominium and kind=expected_kind) then raise exception 'Referência fora do condomínio'; end if;
  end if;
 end loop;
 if p_kind='units' and nullif(p_data->>'block_id','') is null then raise exception 'Selecione o bloco'; end if;
 if p_kind='unit_memberships' and (nullif(p_data->>'unit_id','') is null or nullif(p_data->>'person_id','') is null or coalesce(p_data->>'relationship','') not in ('owner','resident','authorized')) then raise exception 'Informe unidade, pessoa e vínculo'; end if;
 if coalesce(p_data->>'audience','all')<>'all' then
  if coalesce(jsonb_array_length(p_data->'audience_ids'),0)=0 then raise exception 'Selecione o público'; end if;
  for refkey in select jsonb_array_elements_text(p_data->'audience_ids') loop
   if not exists(select 1 from public.records where id=refkey::uuid and condominium_id=p_condominium and kind=case p_data->>'audience' when 'units' then 'units' else 'blocks' end) then raise exception 'Destinatário inválido'; end if;
  end loop;
 end if;
 if p_assigned is not null and not exists(select 1 from public.memberships where condominium_id=p_condominium and user_id=p_assigned and active) then raise exception 'Responsável inválido'; end if;
 if p_id is not null then
  select * into old from public.records where id=p_id and condominium_id=p_condominium and kind=p_kind for update;
  if not found or not public.can_write_record(p_id) then raise exception 'Registro indisponível'; end if;
  if old.revision<>p_revision then raise exception 'Registro alterado por outra pessoa. Atualize a página'; end if;
  if old.kind='services' and old.status in ('done','cancelled','pending') then raise exception 'Reabra o serviço antes de editar'; end if;
  if myrole='operator' and (old.assigned_to is distinct from p_assigned or old.due_date is distinct from p_due) then raise exception 'Operador não pode reatribuir ou mudar o prazo'; end if;
  v_status:=case when p_kind in ('announcements','documents') then 'draft' else old.status end;
  update public.approvals set status='superseded' where record_id=p_id and status='pending';
  update public.records set title=trim(p_title),data=p_data||(case when old.data ? 'source_request_id' then jsonb_build_object('source_request_id',old.data->'source_request_id') else '{}'::jsonb end),file_revision=revision+1,assigned_to=p_assigned,due_date=p_due,revision=revision+1,updated_by=auth.uid(),updated_at=now(),status=v_status where id=p_id returning id into rid;
  -- Attachments belong to immutable publication versions. Editing content requires explicit reattachment.
 else
  if myrole='operator' then raise exception 'Criação de registros exige atribuição por um administrador'; end if;
  v_status:=case p_kind when 'requests' then 'open' when 'services' then 'todo' when 'announcements' then 'draft' when 'documents' then 'draft' else 'active' end;
  insert into public.records(condominium_id,kind,title,status,data,assigned_to,due_date,created_by,updated_by)
  values(p_condominium,p_kind,trim(p_title),v_status,p_data,p_assigned,p_due,auth.uid(),auth.uid()) returning id into rid;
 end if;
 perform public.snapshot_record(rid);
 perform public.log_event(p_condominium,rid,case when p_id is null then 'record.created' else 'record.updated' end,jsonb_build_object('kind',p_kind));
 return rid;
 end;
$$;

create function public.audience_preview(p_record uuid) returns table(person_id uuid,unit_id uuid,person_name text,unit_name text)
 language plpgsql stable security definer set search_path = '' as $$
 declare r public.records;
 begin
 select * into r from public.records where id=p_record;
 if not public.can_read_record(p_record) or r.kind not in ('announcements','documents') then raise exception 'Sem acesso ao público'; end if;
 return query select distinct p.id,u.id,p.title,u.title from public.records l
 join public.records p on p.id=(l.data->>'person_id')::uuid and p.condominium_id=l.condominium_id and p.kind='people'
 join public.records u on u.id=(l.data->>'unit_id')::uuid and u.condominium_id=l.condominium_id and u.kind='units'
 where l.condominium_id=r.condominium_id and l.kind='unit_memberships' and l.data->>'validated'='true'
 and (coalesce(r.data->>'audience','all')='all' or (r.data->>'audience'='units' and r.data->'audience_ids' ? u.id::text) or (r.data->>'audience'='blocks' and r.data->'audience_ids' ? (u.data->>'block_id')));
 end;
$$;

create function public.record_action(p_id uuid,p_revision integer,p_action text,p_payload jsonb default '{}') returns uuid
 language plpgsql security definer set search_path = '' as $$
 declare r public.records; nextstatus text; needs_approval boolean; cfg jsonb; new_id uuid; a public.approvals; daykey text; result jsonb;
 begin
 select * into r from public.records where id=p_id for update;
 if not found or not public.can_read_record(p_id) then raise exception 'Registro indisponível'; end if;
 if r.revision<>p_revision then raise exception 'Registro alterado. Atualize antes de continuar'; end if;
 select settings into cfg from public.condominiums where id=r.condominium_id;
 if p_action in ('approve','reject') then
  if not public.has_permission(r.condominium_id,'approvals.decide') or r.status<>'pending' then raise exception 'Sem aprovação pendente autorizada'; end if;
  select * into a from public.approvals where record_id=r.id and revision=r.revision and status='pending' for update;
  if not found or a.requested_by=auth.uid() then raise exception 'Outra pessoa autorizada deve decidir esta aprovação'; end if;
  if length(trim(coalesce(p_payload->>'reason','')))<3 then raise exception 'Informe a justificativa da decisão'; end if;
  update public.approvals set status=case p_action when 'approve' then 'approved' else 'rejected' end,reason=p_payload->>'reason',decided_by=auth.uid(),decided_at=now() where id=a.id;
  nextstatus:=case when p_action='reject' then case when r.kind='services' then 'todo' else 'draft' end when r.kind='services' then 'done' else 'published' end;
 elsif not public.can_write_record(p_id) then raise exception 'Sem permissão para executar esta ação';
 elsif p_action='message' then
  if r.kind not in ('requests','services') then raise exception 'Mensagens não disponíveis'; end if;
  insert into public.messages(condominium_id,record_id,body,visibility,created_by) values(r.condominium_id,r.id,trim(p_payload->>'body'),coalesce(p_payload->>'visibility','internal'),auth.uid());
  perform public.log_event(r.condominium_id,r.id,'message.created',jsonb_build_object('visibility',coalesce(p_payload->>'visibility','internal'))); return r.id;
 elsif p_action='create_service' then
  if r.kind<>'requests' or not public.has_permission(r.condominium_id,'services.write') then raise exception 'Sem permissão para criar serviço'; end if;
  if exists(select 1 from public.records where condominium_id=r.condominium_id and kind='services' and data->>'source_request_id'=r.id::text) then raise exception 'Solicitação já possui serviço vinculado'; end if;
  insert into public.records(condominium_id,kind,title,status,data,assigned_to,due_date,created_by,updated_by)
  values(r.condominium_id,'services',r.title,'todo',jsonb_build_object('description',r.data->>'description','priority',coalesce(r.data->>'priority','normal'),'source_request_id',r.id),r.assigned_to,r.due_date,auth.uid(),auth.uid()) returning id into new_id;
  perform public.snapshot_record(new_id); perform public.log_event(r.condominium_id,r.id,'service.linked',jsonb_build_object('service_id',new_id)); perform public.log_event(r.condominium_id,new_id,'service.created_from_request',jsonb_build_object('request_id',r.id)); return new_id;
 elsif p_action='generate' then
  if r.assigned_to is null then raise exception 'Defina um responsável no modelo'; end if;
  if r.kind<>'checklist_templates' or not public.has_permission(r.condominium_id,'checklist_runs.write') then raise exception 'Sem permissão para gerar checklist'; end if;
  select to_char(now() at time zone timezone,'YYYY-MM-DD') into daykey from public.condominiums where id=r.condominium_id;
  if exists(select 1 from public.records where condominium_id=r.condominium_id and kind='checklist_runs' and data->>'template_id'=r.id::text and data->>'day'=daykey) then raise exception 'Checklist do dia já gerado'; end if;
  select jsonb_agg(jsonb_build_object('label',value,'done',false)) into result from jsonb_array_elements_text(r.data->'items');
  if result is null then raise exception 'Modelo sem itens'; end if;
  insert into public.records(condominium_id,kind,title,status,data,assigned_to,due_date,created_by,updated_by) values(r.condominium_id,'checklist_runs',r.title,'todo',jsonb_build_object('template_id',r.id,'template_revision',r.revision,'day',daykey,'items',result),r.assigned_to,daykey::date,auth.uid(),auth.uid()) returning id into new_id;
  perform public.snapshot_record(new_id); perform public.log_event(r.condominium_id,new_id,'checklist.generated'); return new_id;
 elsif p_action='check_item' then
  if r.kind<>'checklist_runs' or r.assigned_to is null then raise exception 'Atribua um responsável ao modelo antes de gerar a execução'; end if;
  if (p_payload->>'index')::integer<0 or (p_payload->>'index')::integer>=jsonb_array_length(r.data->'items') then raise exception 'Item inválido'; end if;
  if r.data->'items'->((p_payload->>'index')::integer)->>'done'='true' then raise exception 'Item já concluído'; end if;
  result:=jsonb_set(r.data,array['items',p_payload->>'index'],(r.data->'items'->((p_payload->>'index')::integer))||jsonb_build_object('done',true,'completed_by',auth.uid(),'completed_at',now(),'note',left(coalesce(p_payload->>'note',''),2000)));
  nextstatus:=case when exists(select 1 from jsonb_array_elements(result->'items') i where i->>'done'<>'true') then 'in_progress' else 'done' end;
  update public.records set data=result where id=r.id;
 elsif p_action='publish' then
  if r.kind not in ('announcements','documents') or r.status not in ('draft') or not public.has_permission(r.condominium_id,r.kind||'.publish') then raise exception 'Publicação não autorizada'; end if;
  if r.kind='announcements' and length(trim(coalesce(r.data->>'body','')))=0 then raise exception 'Informe o texto do comunicado'; end if;
  if r.kind='documents' and not exists(select 1 from public.attachments where record_id=r.id and revision=r.file_revision and ready) then raise exception 'Anexe o arquivo antes de publicar'; end if;
  needs_approval:=coalesce((cfg->>(case r.kind when 'announcements' then 'announcement_approval' else 'document_approval' end))::boolean,false);
  nextstatus:=case when needs_approval then 'pending' else 'published' end;
 elsif p_action='status' then
  nextstatus:=p_payload->>'status';
  if r.kind='requests' then
   if not ((r.status='open' and nextstatus in ('in_progress','cancelled')) or (r.status='in_progress' and nextstatus in ('waiting','resolved','cancelled')) or (r.status='waiting' and nextstatus in ('in_progress','resolved','cancelled')) or (r.status='resolved' and nextstatus='in_progress')) then raise exception 'Transição de solicitação inválida'; end if;
  elsif r.kind='services' then
   if not ((r.status='todo' and nextstatus in ('in_progress','cancelled')) or (r.status='in_progress' and nextstatus in ('done','cancelled')) or (r.status='done' and nextstatus='in_progress')) then raise exception 'Transição de serviço inválida'; end if;
   if nextstatus='in_progress' and r.assigned_to is null then raise exception 'Defina o responsável antes de iniciar'; end if;
   if nextstatus='done' then
    if r.assigned_to is null then raise exception 'Responsável obrigatório'; end if;
    if coalesce((cfg->>'require_evidence')::boolean,true) and length(trim(coalesce(p_payload->>'reason','')))<5 and not exists(select 1 from public.attachments where record_id=r.id and ready and category in ('after','evidence') and mime like 'image/%') then raise exception 'Anexe evidência ou informe justificativa com ao menos 5 caracteres'; end if;
    needs_approval:=coalesce((cfg->>'service_approval')::boolean,false);
    if needs_approval then nextstatus:='pending'; end if;
   end if;
  else raise exception 'Estado não alterável neste módulo'; end if;
  if (r.status in ('done','resolved') or nextstatus='cancelled') and length(trim(coalesce(p_payload->>'reason','')))<3 then raise exception 'Informe o motivo'; end if;
 else raise exception 'Ação inválida'; end if;
 -- Preserve the exact submitted revision while pending; decisions/publication create the next snapshot.
 update public.records set status=nextstatus,updated_at=now(),updated_by=auth.uid(),revision=revision+1 where id=r.id;
 if nextstatus='pending' then
  insert into public.approvals(condominium_id,record_id,revision,requested_by) values(r.condominium_id,r.id,r.revision+1,auth.uid());
 end if;
 if nextstatus='published' then
  insert into public.recipients(condominium_id,record_id,revision,person_id,unit_id)
  select r.condominium_id,r.id,r.revision+1,p.person_id,p.unit_id from public.audience_preview(r.id) p;
  -- Carry attachments into the publication snapshot without changing the original immutable metadata.
  -- Their revision records the draft they were uploaded to; snapshots below keep the publication's list.
 end if;
 perform public.snapshot_record(r.id);
 perform public.log_event(r.condominium_id,r.id,'record.'||p_action,jsonb_build_object('from',r.status,'to',nextstatus,'reason',left(coalesce(p_payload->>'reason',''),2000),'revision',r.revision+1));
 return r.id;
 end;
$$;

create function public.configure_condominium(p_condominium uuid,p_settings jsonb) returns void language plpgsql security definer set search_path = '' as $$
 begin
 if not public.has_permission(p_condominium,'settings.write') then raise exception 'Sem permissão para alterar regras'; end if;
 if jsonb_typeof(p_settings)<>'object' or exists(select 1 from jsonb_each(p_settings) e where e.key not in ('announcement_approval','document_approval','service_approval','require_evidence') or jsonb_typeof(e.value)<>'boolean') then raise exception 'Regras inválidas'; end if;
 update public.condominiums set settings=settings||p_settings where id=p_condominium;
 perform public.log_event(p_condominium,null,'settings.updated',p_settings);
 end;
$$;

create function public.manage_member(p_condominium uuid,p_user uuid,p_name text,p_role text,p_permissions text[]) returns void language plpgsql security definer set search_path = '' as $$
 begin
 if not public.has_permission(p_condominium,'members.write') then raise exception 'Sem permissão para gerenciar a equipe'; end if;
 if exists(select 1 from unnest(p_permissions) p where not public.has_permission(p_condominium,p)) then raise exception 'Não pode conceder permissões que não possui'; end if;
 if p_user=auth.uid() then raise exception 'Não altere suas próprias permissões'; end if;
 if p_role not in ('admin','manager','operator') or length(trim(p_name))<2 then raise exception 'Dados da equipe inválidos'; end if;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'A conta deve existir e ter e-mail confirmado'; end if;
 if exists(select 1 from unnest(p_permissions) p where p<>'*' and p !~ '^(requests|services|announcements|documents|blocks|units|people|unit_memberships|checklist_templates|checklist_runs)\.(read|write|read_all|publish)$' and p not in ('audit.read','members.read','members.write','settings.write','reports.export','approvals.read','approvals.decide')) then raise exception 'Permissão desconhecida'; end if;
 insert into public.memberships(condominium_id,user_id,display_name,role,permissions) values(p_condominium,p_user,trim(p_name),p_role,p_permissions)
 on conflict(condominium_id,user_id) do update set display_name=excluded.display_name,role=excluded.role,permissions=excluded.permissions,active=true;
 perform public.log_event(p_condominium,null,'member.updated',jsonb_build_object('user_id',p_user,'role',p_role,'permissions',p_permissions));
 end;
$$;

create function public.prepare_attachment(p_record uuid,p_revision integer,p_name text,p_mime text,p_size integer,p_category text) returns text language plpgsql security definer set search_path = '' as $$
 declare r public.records; aid uuid:=gen_random_uuid(); objpath text;
 begin
 select * into r from public.records where id=p_record for update;
 if not found or not public.can_write_record(p_record) or r.revision<>p_revision then raise exception 'Anexo não autorizado ou versão desatualizada'; end if;
 if r.status in ('published','pending','done','cancelled') then raise exception 'Edite ou reabra o registro antes de anexar'; end if;
 if p_mime not in ('application/pdf','image/jpeg','image/png','image/webp') or p_size not between 1 and 10485760 or length(p_name)>180 then raise exception 'Arquivo inválido (PDF/imagem, até 10 MB)'; end if;
 objpath:=r.condominium_id::text||'/'||r.id::text||'/'||aid::text;
 insert into public.attachments(id,condominium_id,record_id,revision,name,path,mime,size,category,created_by) values(aid,r.condominium_id,r.id,r.file_revision,p_name,objpath,p_mime,p_size,p_category,auth.uid());
 return objpath;
 end;
$$;
create function public.finish_attachment(p_path text) returns void language plpgsql security definer set search_path = '' as $$
 declare a public.attachments; r public.records;
 begin
 select * into a from public.attachments where path=p_path for update;
 select * into r from public.records where id=a.record_id for update;
 if a.created_by is distinct from auth.uid() or not public.can_write_record(a.record_id) or a.revision<>r.file_revision or r.status in ('published','pending','done','cancelled') or not exists(select 1 from storage.objects where bucket_id='condominium-private' and name=p_path) then raise exception 'Arquivo não encontrado, registro alterado ou acesso negado'; end if;
 update public.attachments set ready=true where id=a.id;
 perform public.log_event(a.condominium_id,a.record_id,'attachment.created',jsonb_build_object('attachment_id',a.id));
 end;
$$;
create function public.record_export(p_condominium uuid) returns void language plpgsql security definer set search_path = '' as $$
 begin
 if not public.has_permission(p_condominium,'reports.export') then raise exception 'Exportação não autorizada'; end if;
 perform public.log_event(p_condominium,null,'report.exported');
 end;
$$;

create function public.deactivate_member(p_condominium uuid,p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
 begin
 if not public.has_permission(p_condominium,'members.write') or p_user=auth.uid() then raise exception 'Revogação não autorizada'; end if;
 if exists(select 1 from public.memberships where condominium_id=p_condominium and user_id=p_user and '*'=any(permissions)) and not public.has_permission(p_condominium,'*') then raise exception 'Apenas um administrador completo pode revogar este acesso'; end if;
 update public.memberships set active=false where condominium_id=p_condominium and user_id=p_user and active;
 if not found then raise exception 'Membro ativo não encontrado'; end if;
 perform public.log_event(p_condominium,null,'member.deactivated',jsonb_build_object('user_id',p_user));
 end;
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('condominium-private','condominium-private',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy private_upload on storage.objects for insert to authenticated with check(bucket_id='condominium-private' and exists(select 1 from public.attachments a where a.path=objects.name and a.created_by=(select auth.uid()) and not a.ready and public.can_write_record(a.record_id)));
create policy private_download on storage.objects for select to authenticated using(bucket_id='condominium-private' and exists(select 1 from public.attachments a where a.path=objects.name and a.ready and public.can_read_record(a.record_id)));
-- No update/delete policies: old evidence and published files cannot be overwritten.

revoke all on function public.log_event(uuid,uuid,text,jsonb), public.snapshot_record(uuid) from public,anon,authenticated;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.has_permission(uuid,text),public.can_read_record(uuid),public.can_write_record(uuid),public.bootstrap_condominium(text,text),public.save_record(uuid,text,uuid,integer,text,jsonb,uuid,date),public.audience_preview(uuid),public.record_action(uuid,integer,text,jsonb),public.configure_condominium(uuid,jsonb),public.manage_member(uuid,uuid,text,text,text[]),public.prepare_attachment(uuid,integer,text,text,integer,text),public.finish_attachment(text),public.record_export(uuid),public.deactivate_member(uuid,uuid) to authenticated;
