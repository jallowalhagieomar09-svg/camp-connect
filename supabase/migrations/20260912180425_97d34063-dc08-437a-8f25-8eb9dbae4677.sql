REVOKE EXECUTE ON FUNCTION public.issue_certificate(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid) TO service_role;