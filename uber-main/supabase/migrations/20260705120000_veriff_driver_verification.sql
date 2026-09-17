-- Veriff driver licence verification schema
-- Applied to production via Supabase migration: veriff_driver_verification_schema

-- Verification status enum values: pending, processing, verified, rejected, expired, failed

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS veriff_session_id text,
  ADD COLUMN IF NOT EXISTS verification_provider text DEFAULT 'veriff',
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS verification_reference text,
  ADD COLUMN IF NOT EXISTS last_verification_update timestamptz,
  ADD COLUMN IF NOT EXISTS license_expiry text,
  ADD COLUMN IF NOT EXISTS id_number text,
  ADD COLUMN IF NOT EXISTS license_back_pic_url text;

CREATE TABLE IF NOT EXISTS public.driver_verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  veriff_session_id text,
  verification_reference text,
  reason text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_verification_history_driver_id
  ON public.driver_verification_history(driver_id);

CREATE INDEX IF NOT EXISTS idx_drivers_veriff_session_id
  ON public.drivers(veriff_session_id);

ALTER TABLE public.driver_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own verification history"
  ON public.driver_verification_history
  FOR SELECT
  USING (driver_id = public.current_user_id());

-- Sync is_verified, is_approved, account_status, and audit log on status change
CREATE OR REPLACE FUNCTION public.sync_driver_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.verification_status IS DISTINCT FROM NEW.verification_status
      OR OLD.is_verified IS DISTINCT FROM NEW.is_verified) THEN

    INSERT INTO driver_verification_history (
      driver_id, from_status, to_status, veriff_session_id,
      verification_reference, reason, payload
    ) VALUES (
      NEW.id,
      OLD.verification_status,
      NEW.verification_status,
      NEW.veriff_session_id,
      NEW.verification_reference,
      NEW.rejection_reason,
      jsonb_build_object('is_verified', NEW.is_verified, 'is_approved', NEW.is_approved)
    );

    NEW.last_verification_update := now();

    IF NEW.verification_status = 'verified' THEN
      NEW.is_verified := true;
      NEW.is_approved := true;
      NEW.account_status := 'active';
      NEW.verified_at := COALESCE(NEW.verified_at, now());
      NEW.verification_completed_at := COALESCE(NEW.verification_completed_at, now());
      NEW.rejection_reason := NULL;
    ELSIF NEW.verification_status IN ('rejected', 'failed', 'expired') THEN
      NEW.is_verified := false;
      NEW.is_approved := false;
      NEW.is_online := false;
      NEW.verification_completed_at := COALESCE(NEW.verification_completed_at, now());
      IF NEW.account_status = 'active' THEN
        NEW.account_status := 'pending_approval';
      END IF;
    ELSIF NEW.verification_status = 'processing' THEN
      NEW.is_verified := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_driver_verification ON public.drivers;
CREATE TRIGGER trg_sync_driver_verification
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_verification_status();

-- Realtime updates for driver verification status
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
