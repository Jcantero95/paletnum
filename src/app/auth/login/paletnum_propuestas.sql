-- ============================================================
--  PaletNum — Módulo de propuestas v2.0
--  Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLAS DE PROPUESTAS
-- ------------------------------------------------------------

create type public.estado_propuesta as enum ('pendiente', 'aprobado', 'rechazado');

-- Libros propuestos por usuarios
create table public.libros_propuestos (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  nombre          text not null,
  editorial       text,
  paginas_total   integer not null default 1,
  notas           text,                        -- info adicional del usuario
  estado          public.estado_propuesta not null default 'pendiente',
  motivo_rechazo  text,
  revisado_por    uuid references public.usuarios(id),
  revisado_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- Marcas propuestas por usuarios
create table public.marcas_propuestas (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  nombre          text not null,
  notas           text,
  estado          public.estado_propuesta not null default 'pendiente',
  motivo_rechazo  text,
  revisado_por    uuid references public.usuarios(id),
  revisado_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- Modelos propuestos (siempre ligados a una marca existente o propuesta)
create table public.modelos_propuestos (
  id              uuid primary key default uuid_generate_v4(),
  usuario_id      uuid not null references public.usuarios(id) on delete cascade,
  marca_id        uuid references public.marcas(id),           -- marca existente
  marca_propuesta_id uuid references public.marcas_propuestas(id), -- o propuesta
  nombre          text not null,
  cantidad        integer,
  notas           text,
  estado          public.estado_propuesta not null default 'pendiente',
  motivo_rechazo  text,
  revisado_por    uuid references public.usuarios(id),
  revisado_at     timestamptz,
  created_at      timestamptz not null default now(),
  check (marca_id is not null or marca_propuesta_id is not null)
);

-- ------------------------------------------------------------
-- 2. ÍNDICES
-- ------------------------------------------------------------

create index idx_libros_propuestos_estado
  on public.libros_propuestos (estado, created_at desc);

create index idx_marcas_propuestas_estado
  on public.marcas_propuestas (estado, created_at desc);

create index idx_modelos_propuestos_estado
  on public.modelos_propuestos (estado, created_at desc);

create index idx_libros_propuestos_usuario
  on public.libros_propuestos (usuario_id);

create index idx_marcas_propuestas_usuario
  on public.marcas_propuestas (usuario_id);

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------

alter table public.libros_propuestos   enable row level security;
alter table public.marcas_propuestas   enable row level security;
alter table public.modelos_propuestos  enable row level security;

-- Lectura: cada usuario ve sus propias propuestas
create policy "libros_propuestos_select_own"
  on public.libros_propuestos for select
  using (auth.uid() = usuario_id);

create policy "marcas_propuestas_select_own"
  on public.marcas_propuestas for select
  using (auth.uid() = usuario_id);

create policy "modelos_propuestos_select_own"
  on public.modelos_propuestos for select
  using (auth.uid() = usuario_id);

-- Inserción: cualquier usuario autenticado
create policy "libros_propuestos_insert_auth"
  on public.libros_propuestos for insert
  with check (auth.uid() = usuario_id);

create policy "marcas_propuestas_insert_auth"
  on public.marcas_propuestas for insert
  with check (auth.uid() = usuario_id);

create policy "modelos_propuestos_insert_auth"
  on public.modelos_propuestos for insert
  with check (auth.uid() = usuario_id);

-- ------------------------------------------------------------
-- 4. FUNCIÓN DE ADMIN — bypass RLS para el panel
--    Solo el service_role (server) puede llamar estas funciones
-- ------------------------------------------------------------

-- Trae todas las propuestas pendientes
create or replace function public.admin_get_propuestas()
returns json language plpgsql security definer as $$
begin
  return json_build_object(
    'libros', (
      select json_agg(row_to_json(l))
      from (
        select lp.*, u.nombre as usuario_nombre, u.social as usuario_social
        from public.libros_propuestos lp
        join public.usuarios u on u.id = lp.usuario_id
        order by lp.created_at desc
      ) l
    ),
    'marcas', (
      select json_agg(row_to_json(m))
      from (
        select mp.*, u.nombre as usuario_nombre, u.social as usuario_social
        from public.marcas_propuestas mp
        join public.usuarios u on u.id = mp.usuario_id
        order by mp.created_at desc
      ) m
    ),
    'modelos', (
      select json_agg(row_to_json(mo))
      from (
        select mop.*, u.nombre as usuario_nombre,
               ma.nombre as marca_nombre
        from public.modelos_propuestos mop
        join public.usuarios u on u.id = mop.usuario_id
        left join public.marcas ma on ma.id = mop.marca_id
        order by mop.created_at desc
      ) mo
    )
  );
end;
$$;

-- Aprobar libro propuesto → lo mueve al catálogo real
create or replace function public.admin_aprobar_libro(p_id uuid)
returns void language plpgsql security definer as $$
declare
  v_libro public.libros_propuestos%rowtype;
begin
  select * into v_libro from public.libros_propuestos where id = p_id;

  insert into public.libros (nombre, editorial, paginas_total)
  values (v_libro.nombre, v_libro.editorial, v_libro.paginas_total)
  on conflict (nombre) do nothing;

  update public.libros_propuestos
  set estado = 'aprobado', revisado_at = now()
  where id = p_id;
end;
$$;

-- Rechazar libro propuesto
create or replace function public.admin_rechazar_libro(p_id uuid, p_motivo text default null)
returns void language plpgsql security definer as $$
begin
  update public.libros_propuestos
  set estado = 'rechazado', motivo_rechazo = p_motivo, revisado_at = now()
  where id = p_id;
end;
$$;

-- Aprobar marca propuesta → la mueve al catálogo real
create or replace function public.admin_aprobar_marca(p_id uuid)
returns void language plpgsql security definer as $$
declare
  v_marca public.marcas_propuestas%rowtype;
begin
  select * into v_marca from public.marcas_propuestas where id = p_id;

  insert into public.marcas (nombre)
  values (v_marca.nombre)
  on conflict (nombre) do nothing;

  update public.marcas_propuestas
  set estado = 'aprobado', revisado_at = now()
  where id = p_id;
end;
$$;

-- Rechazar marca propuesta
create or replace function public.admin_rechazar_marca(p_id uuid, p_motivo text default null)
returns void language plpgsql security definer as $$
begin
  update public.marcas_propuestas
  set estado = 'rechazado', motivo_rechazo = p_motivo, revisado_at = now()
  where id = p_id;
end;
$$;

-- Aprobar modelo propuesto → lo mueve al catálogo real
create or replace function public.admin_aprobar_modelo(p_id uuid)
returns void language plpgsql security definer as $$
declare
  v_modelo public.modelos_propuestos%rowtype;
  v_marca_id uuid;
begin
  select * into v_modelo from public.modelos_propuestos where id = p_id;

  -- Resolver marca_id (puede venir de marca existente o de propuesta aprobada)
  if v_modelo.marca_id is not null then
    v_marca_id := v_modelo.marca_id;
  else
    select m.id into v_marca_id
    from public.marcas m
    join public.marcas_propuestas mp on mp.nombre = m.nombre
    where mp.id = v_modelo.marca_propuesta_id;
  end if;

  if v_marca_id is null then
    raise exception 'La marca asociada no está aprobada aún';
  end if;

  insert into public.modelos (marca_id, nombre, cantidad)
  values (v_marca_id, v_modelo.nombre, v_modelo.cantidad)
  on conflict (marca_id, nombre) do nothing;

  update public.modelos_propuestos
  set estado = 'aprobado', revisado_at = now()
  where id = p_id;
end;
$$;

-- Rechazar modelo propuesto
create or replace function public.admin_rechazar_modelo(p_id uuid, p_motivo text default null)
returns void language plpgsql security definer as $$
begin
  update public.modelos_propuestos
  set estado = 'rechazado', motivo_rechazo = p_motivo, revisado_at = now()
  where id = p_id;
end;
$$;
