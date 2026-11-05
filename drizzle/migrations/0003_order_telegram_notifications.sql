CREATE TABLE public.order_notifications (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'telegram',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','dead')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  message_id bigint,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT ALL ON public.order_notifications TO service_role;
GRANT SELECT ON public.order_notifications TO authenticated;
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notifications" ON public.order_notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only orders created after this feature shipped may ever be notified (old/test orders excluded).
CREATE OR REPLACE FUNCTION public.enqueue_order_notification(p_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  INSERT INTO order_notifications(order_id)
  SELECT id FROM orders WHERE id = p_order_id AND created_at >= '2026-11-05 14:10:00+00'
  ON CONFLICT (order_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.claim_order_notifications(p_limit int)
RETURNS SETOF public.order_notifications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE order_notifications SET status = 'dead', locked_until = NULL
   WHERE status IN ('failed','processing') AND attempts >= 8 AND (locked_until IS NULL OR locked_until < now());
  RETURN QUERY
  UPDATE order_notifications n SET status = 'processing', attempts = n.attempts + 1, locked_until = now() + interval '2 minutes'
   WHERE n.order_id IN (
     SELECT order_id FROM order_notifications
      WHERE (status IN ('pending','failed') AND next_attempt_at <= now())
         OR (status = 'processing' AND locked_until < now() AND attempts < 8)
      ORDER BY created_at LIMIT greatest(1, least(p_limit, 20)) FOR UPDATE SKIP LOCKED)
  RETURNING n.*;
END $$;

REVOKE ALL ON FUNCTION public.enqueue_order_notification(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_order_notifications(int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_order_notification(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_order_notifications(int) TO service_role;