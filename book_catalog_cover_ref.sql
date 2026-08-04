-- Polka · ЭТАЛОННАЯ обложка книги (одна на всех), которую задаёт полка-куратор (Veronica).
-- Гибрид: у каждого может быть СВОЯ личная обложка (хранится в его блобе, поле cover),
-- но если у книги есть cover_ref (загружена куратором) — она показывается всем по умолчанию.
-- Выполни в Supabase → SQL Editor → Run. Персональных данных здесь нет.

-- 1) новая колонка под эталон (личная/авто-обложка остаётся в старой колонке cover)
alter table public.book_catalog add column if not exists cover_ref text not null default '';

-- 2) catalog_get теперь отдаёт и cover_ref (меняем сигнатуру → сначала DROP)
drop function if exists catalog_get(text);
create or replace function catalog_get(p_norm text)
returns table(norm text, title text, author text, cover text, cover_ref text, description text)
language sql security definer set search_path = public as $$
  select norm, title, author, cover, cover_ref, description from book_catalog where norm = p_norm;
$$;
grant execute on function catalog_get(text) to anon, authenticated;

-- 3) задать ЭТАЛОННУЮ обложку (с перезаписью) — ТОЛЬКО полка-куратор.
--    Код куратора зашит здесь: если сменишь свою полку — поменяй его и в клиенте (OWNER_CODE).
create or replace function catalog_set_cover(p_norm text, p_cover text, p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_norm is null or length(trim(p_norm)) = 0 then return; end if;
  if upper(coalesce(p_code,'')) <> 'YZ97JT' then return; end if;   -- только полка Veronica задаёт эталон
  insert into book_catalog(norm, cover_ref, updated_at)
  values (p_norm, left(coalesce(p_cover,''), 300000), now())
  on conflict (norm) do update set cover_ref = excluded.cover_ref, updated_at = now();
end $$;
grant execute on function catalog_set_cover(text,text,text) to anon, authenticated;

-- Проверить эталонные обложки (в панели, service role):
--   select norm, title, left(cover_ref,30) as ref, updated_at from public.book_catalog where cover_ref <> '' order by updated_at desc limit 50;
