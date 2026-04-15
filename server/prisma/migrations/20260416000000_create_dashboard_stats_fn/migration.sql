-- Computes all dashboard stats in a single table scan.
-- ai_agent_email: the email of the AI system agent (used to identify AI-resolved tickets).
CREATE OR REPLACE FUNCTION get_dashboard_stats(ai_agent_email TEXT)
RETURNS TABLE (
  total_tickets          BIGINT,
  open_tickets           BIGINT,
  ai_resolved_tickets    BIGINT,
  ai_resolved_percentage NUMERIC,
  avg_resolution_time_ms DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)
      AS total_tickets,

    COUNT(*) FILTER (WHERE status = 'open')
      AS open_tickets,

    COUNT(*) FILTER (
      WHERE status = 'resolved'
        AND "assignedToId" = (SELECT id FROM "user" WHERE email = ai_agent_email)
    )
      AS ai_resolved_tickets,

    CASE
      WHEN COUNT(*) = 0 THEN 0::NUMERIC
      ELSE ROUND(
        COUNT(*) FILTER (
          WHERE status = 'resolved'
            AND "assignedToId" = (SELECT id FROM "user" WHERE email = ai_agent_email)
        )::NUMERIC / COUNT(*) * 1000
      ) / 10
    END
      AS ai_resolved_percentage,

    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000
      ) FILTER (WHERE status = 'resolved'),
      0
    )
      AS avg_resolution_time_ms

  FROM "Ticket"
$$;
