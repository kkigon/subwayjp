-- 日本版ランキングの同点を共同順位にする既存DB向けパッチ。
-- 新規DBは schema.sql に同じ定義が含まれるため、このファイルは実行不要です。

begin;

create or replace function public.jp_all_time_ranking_by_duration(
  p_mode text,
  p_duration integer,
  p_limit integer default 100
)
returns table (
  rank bigint,
  user_id uuid,
  nickname text,
  theme_line text,
  best_score bigint,
  theoretical_max bigint,
  record_points numeric,
  percentile_bonus numeric,
  adjusted_score numeric
)
language sql stable security definer set search_path = '' as $$
  with best as (
    select p.user_id, max(p.score)::bigint as best_score
    from public.jp_plays p
    where p.rank_mode = 'tokyo:all'
      and p.duration_sec = case when p_duration in (60,120,300) then p_duration else 60 end
    group by p.user_id
  ), calculated as (
    select b.user_id, b.best_score,
      public.jp_tokyo_theoretical_max(p_duration)::bigint as theoretical_max,
      round((70 * sqrt(b.best_score::numeric / public.jp_tokyo_theoretical_max(p_duration)))::numeric, 1) as record_points,
      count(*) over ()::bigint as participant_count,
      rank() over (order by b.best_score desc)::bigint as score_rank
    from best b
  ), scored as (
    select c.*,
      round((case when c.participant_count <= 1 then 30
        else 30 * (c.participant_count - c.score_rank)::numeric / (c.participant_count - 1) end)::numeric, 1) as percentile_bonus
    from calculated c
  ), ordered as (
    select rank() over (
      order by (s.record_points + s.percentile_bonus) desc
    )::bigint as final_rank, s.*
    from scored s
  )
  select o.final_rank, o.user_id,
    coalesce(pr.nickname, '匿名プレイヤー')::text,
    coalesce(pr.theme_line, 'G')::text,
    o.best_score, o.theoretical_max, o.record_points, o.percentile_bonus,
    round((o.record_points + o.percentile_bonus)::numeric, 1) as adjusted_score
  from ordered o
  left join public.jp_profiles pr on pr.id = o.user_id
  where o.final_rank <= least(greatest(coalesce(p_limit, 100), 1), 100)
  order by o.final_rank, o.best_score desc, o.user_id;
$$;

revoke all on function public.jp_all_time_ranking_by_duration(text, integer, integer) from public;
grant execute on function public.jp_all_time_ranking_by_duration(text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
