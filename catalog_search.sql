-- ИСТОЧНИК 0 поиска книг: подстрочный поиск по общему справочнику (книги, добавленные пользователями).
-- Регистр игнорируется; совпадения с начала названия — выше; до 8 результатов. Без лимитов внешних API.
create or replace function catalog_search(p_q text)
returns table(norm text, title text, author text, cover text, cover_ref text)
language sql stable security definer set search_path = public as $$
  select norm, title, author, cover, cover_ref
  from book_catalog
  where coalesce(trim(p_q),'') <> ''
    and ( title ilike '%'||p_q||'%' or author ilike '%'||p_q||'%' )
  order by (lower(coalesce(title,'')) like lower(p_q)||'%') desc, length(coalesce(title,'')) asc
  limit 8;
$$;
grant execute on function catalog_search(text) to anon, authenticated;
