-- Function to get player rank
CREATE OR REPLACE FUNCTION get_player_rank(search_wallet text, time_period text)
RETURNS TABLE (
  rank bigint,
  score integer,
  top_score_diff integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
  target_score integer;
  start_time timestamp with time zone;
  top_score integer;
BEGIN
  -- Determine start time based on period
  IF time_period = 'daily' THEN
    start_time := date_trunc('day', now());
  ELSIF time_period = 'weekly' THEN
    start_time := date_trunc('week', now());
  ELSIF time_period = 'monthly' THEN
    start_time := date_trunc('month', now());
  ELSIF time_period = 'yearly' THEN
    start_time := date_trunc('year', now());
  ELSE
    start_time := '1970-01-01'::timestamp; -- All time
  END IF;

  -- Get the player's best score in this period
  SELECT MAX(s.score) INTO target_score
  FROM scores s
  WHERE s.wallet_address = search_wallet
  AND s.created_at >= start_time;

  -- If no score found, return nulls
  IF target_score IS NULL THEN
    RETURN QUERY SELECT NULL::bigint, NULL::integer, NULL::integer;
    RETURN;
  END IF;

  -- Get the top score for context
  SELECT MAX(s.score) INTO top_score
  FROM scores s
  WHERE s.created_at >= start_time;

  -- Calculate rank: Count distinct players with higher scores + 1
  -- Note: This is a simplified rank. For dense rank or handling ties, logic might vary.
  -- Here we count how many *scores* are strictly higher.
  RETURN QUERY SELECT 
    (COUNT(*) + 1) as rank,
    target_score as score,
    (top_score - target_score) as top_score_diff
  FROM scores s
  WHERE s.score > target_score
  AND s.created_at >= start_time;
END;
$$;
