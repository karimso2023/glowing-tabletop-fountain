CREATE TABLE public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  first_day date NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Cairo')::date),
  last_pageview_id uuid,
  is_bot boolean NOT NULL DEFAULT false,
  ip inet,
  ip_hash text,
  country text, region text, city text,
  referrer_host text, referrer_path text, landing_path text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text,
  checkout_started_at timestamptz,
  identifiers_purged_at timestamptz
);
CREATE INDEX analytics_sessions_last_seen_idx ON public.analytics_sessions (last_seen_at);
CREATE INDEX analytics_sessions_iphash_idx ON public.analytics_sessions (ip_hash, created_at);

CREATE TABLE public.analytics_session_days (
  session_id uuid NOT NULL REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  day date NOT NULL,
  pageviews integer NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, day)
);
CREATE INDEX analytics_session_days_day_idx ON public.analytics_session_days (day);

CREATE TABLE public.order_attribution (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  analytics_consent boolean NOT NULL DEFAULT false,
  session_id uuid REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
  ip inet,
  country text, region text, city text,
  referrer_host text, referrer_path text, landing_path text,
  first_utm_source text, first_utm_medium text, first_utm_campaign text, first_utm_content text,
  checkout_utm_source text, checkout_utm_medium text, checkout_utm_campaign text, checkout_utm_content text,
  identifiers_purged_at timestamptz
);

REVOKE ALL ON public.analytics_sessions, public.analytics_session_days, public.order_attribution FROM anon, authenticated;
GRANT ALL ON public.analytics_sessions, public.analytics_session_days, public.order_attribution TO service_role;
GRANT SELECT ON public.order_attribution TO authenticated;

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_session_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin reads order attribution" ON public.order_attribution
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.safe_inet(p text) RETURNS inet
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  IF p IS NULL OR length(p) > 64 THEN RETURN NULL; END IF;
  RETURN host(p::inet)::inet;
EXCEPTION WHEN others THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.analytics_track(
  p_token_hash text, p_kind text, p_pageview_id uuid, p_is_bot boolean,
  p_ip text, p_ip_hash text, p_country text, p_region text, p_city text,
  p_ref_host text, p_ref_path text, p_landing text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.analytics_sessions; v_day date := (now() AT TIME ZONE 'Africa/Cairo')::date;
BEGIN
  IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_kind NOT IN ('pageview','heartbeat','checkout_start') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_input');
  END IF;
  SELECT * INTO s FROM public.analytics_sessions WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    IF p_kind <> 'pageview' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_session'); END IF;
    IF p_ip_hash IS NOT NULL AND (SELECT count(*) FROM public.analytics_sessions
        WHERE ip_hash = p_ip_hash AND created_at > now() - interval '1 hour') >= 60 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;
    INSERT INTO public.analytics_sessions (token_hash, is_bot, ip, ip_hash, country, region, city,
      referrer_host, referrer_path, landing_path, utm_source, utm_medium, utm_campaign, utm_content, last_pageview_id)
    VALUES (p_token_hash, coalesce(p_is_bot, false), public.safe_inet(p_ip), p_ip_hash,
      left(p_country, 80), left(p_region, 120), left(p_city, 120),
      left(p_ref_host, 253), left(p_ref_path, 200), left(p_landing, 200),
      left(p_utm_source, 100), left(p_utm_medium, 100), left(p_utm_campaign, 150), left(p_utm_content, 150), p_pageview_id)
    RETURNING * INTO s;
    INSERT INTO public.analytics_session_days (session_id, day, pageviews) VALUES (s.id, v_day, 1);
    RETURN jsonb_build_object('ok', true, 'created', true);
  END IF;

  IF p_kind = 'pageview' THEN
    IF s.last_pageview_id IS DISTINCT FROM p_pageview_id THEN
      INSERT INTO public.analytics_session_days (session_id, day, pageviews) VALUES (s.id, v_day, 1)
      ON CONFLICT (session_id, day) DO UPDATE SET pageviews = public.analytics_session_days.pageviews + 1;
    END IF;
    UPDATE public.analytics_sessions SET last_seen_at = now(), last_pageview_id = p_pageview_id,
      is_bot = is_bot OR coalesce(p_is_bot, false) WHERE id = s.id;
  ELSIF p_kind = 'heartbeat' THEN
    IF s.last_seen_at < now() - interval '10 seconds' THEN
      UPDATE public.analytics_sessions SET last_seen_at = now() WHERE id = s.id;
      INSERT INTO public.analytics_session_days (session_id, day, pageviews) VALUES (s.id, v_day, 0)
      ON CONFLICT (session_id, day) DO NOTHING;
    END IF;
  ELSE
    UPDATE public.analytics_sessions SET last_seen_at = now(),
      checkout_started_at = coalesce(checkout_started_at, now()) WHERE id = s.id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'created', false);
END $$;

CREATE OR REPLACE FUNCTION public.record_order_attribution(
  p_order_number text, p_token_hash text, p_consent boolean,
  p_ip text, p_country text, p_region text, p_city text,
  p_utm_source text, p_utm_medium text, p_utm_campaign text, p_utm_content text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order uuid; s public.analytics_sessions;
BEGIN
  SELECT id INTO v_order FROM public.orders WHERE order_number = p_order_number;
  IF v_order IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_order'); END IF;
  IF coalesce(p_consent, false) AND p_token_hash IS NOT NULL THEN
    SELECT * INTO s FROM public.analytics_sessions WHERE token_hash = p_token_hash;
  END IF;
  INSERT INTO public.order_attribution (order_id, analytics_consent, session_id, ip, country, region, city,
    referrer_host, referrer_path, landing_path,
    first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content,
    checkout_utm_source, checkout_utm_medium, checkout_utm_campaign, checkout_utm_content)
  VALUES (v_order, coalesce(p_consent, false), s.id, public.safe_inet(p_ip),
    left(p_country, 80), left(p_region, 120), left(p_city, 120),
    s.referrer_host, s.referrer_path, s.landing_path,
    s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content,
    CASE WHEN p_consent THEN left(p_utm_source, 100) END, CASE WHEN p_consent THEN left(p_utm_medium, 100) END,
    CASE WHEN p_consent THEN left(p_utm_campaign, 150) END, CASE WHEN p_consent THEN left(p_utm_content, 150) END)
  ON CONFLICT (order_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'linked', s.id IS NOT NULL);
END $$;

CREATE OR REPLACE FUNCTION public.admin_visitor_stats(p_from date, p_to date) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to - p_from > 366 THEN
    RAISE EXCEPTION 'bad_range';
  END IF;
  WITH sd AS (
    SELECT d.session_id, d.day, d.pageviews FROM public.analytics_session_days d
    JOIN public.analytics_sessions s ON s.id = d.session_id
    WHERE d.day BETWEEN p_from AND p_to AND NOT s.is_bot
  ), ses AS (
    SELECT s.* FROM public.analytics_sessions s WHERE s.id IN (SELECT session_id FROM sd)
  ), src AS (
    SELECT CASE WHEN utm_source IS NOT NULL THEN 'utm:' || utm_source
                WHEN referrer_host IS NOT NULL THEN 'ref:' || referrer_host ELSE 'direct' END AS k,
           utm_medium, utm_campaign FROM ses
  ), ord AS (
    SELECT o.id, a.session_id, a.analytics_consent FROM public.orders o
    LEFT JOIN public.order_attribution a ON a.order_id = o.id
    WHERE (o.created_at AT TIME ZONE 'Africa/Cairo')::date BETWEEN p_from AND p_to
  )
  SELECT jsonb_build_object(
    'pageviews', (SELECT coalesce(sum(pageviews), 0) FROM sd),
    'sessions', (SELECT count(*) FROM ses),
    'new_sessions', (SELECT count(*) FROM ses WHERE first_day BETWEEN p_from AND p_to),
    'checkout_starts', (SELECT count(*) FROM ses WHERE (checkout_started_at AT TIME ZONE 'Africa/Cairo')::date BETWEEN p_from AND p_to),
    'orders_total', (SELECT count(*) FROM ord),
    'orders_from_tracked_sessions', (SELECT count(*) FROM ord WHERE session_id IN (SELECT id FROM ses)),
    'orders_with_attribution', (SELECT count(*) FROM ord WHERE analytics_consent IS NOT NULL),
    'active_now', (SELECT count(*) FROM public.analytics_sessions WHERE NOT is_bot AND last_seen_at > now() - interval '2 minutes'),
    'bot_sessions', (SELECT count(DISTINCT d.session_id) FROM public.analytics_session_days d JOIN public.analytics_sessions s ON s.id = d.session_id WHERE d.day BETWEEN p_from AND p_to AND s.is_bot),
    'by_day', coalesce((SELECT jsonb_agg(x ORDER BY x.day) FROM (SELECT day, count(*) AS sessions, sum(pageviews) AS pageviews FROM sd GROUP BY day) x), '[]'::jsonb),
    'geo', coalesce((SELECT jsonb_agg(x ORDER BY x.n DESC) FROM (SELECT country, region, city, count(*) AS n FROM ses GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 50) x), '[]'::jsonb),
    'sources', coalesce((SELECT jsonb_agg(x ORDER BY x.n DESC) FROM (SELECT k AS source, utm_medium AS medium, utm_campaign AS campaign, count(*) AS n FROM src GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 50) x), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.analytics_purge_identifiers() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.analytics_sessions SET ip = NULL, ip_hash = NULL, token_hash = NULL, referrer_path = NULL,
    identifiers_purged_at = now()
  WHERE created_at < now() - interval '30 days' AND identifiers_purged_at IS NULL;
  UPDATE public.order_attribution SET ip = NULL, identifiers_purged_at = now()
  WHERE created_at < now() - interval '30 days' AND identifiers_purged_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.safe_inet(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.analytics_track(text,text,uuid,boolean,text,text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_order_attribution(text,text,boolean,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.analytics_purge_identifiers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_visitor_stats(date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.safe_inet(text), public.analytics_track(text,text,uuid,boolean,text,text,text,text,text,text,text,text,text,text,text,text),
  public.record_order_attribution(text,text,boolean,text,text,text,text,text,text,text,text), public.analytics_purge_identifiers() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_visitor_stats(date,date) TO authenticated, service_role;

SELECT cron.schedule('analytics-purge-ip-30d', '17 3 * * *', $$SELECT public.analytics_purge_identifiers();$$);