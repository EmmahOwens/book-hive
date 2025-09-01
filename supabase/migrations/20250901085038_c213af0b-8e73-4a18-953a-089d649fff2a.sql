-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the queue_notification function search path
CREATE OR REPLACE FUNCTION public.queue_notification(
  notification_type TEXT,
  email_to TEXT,
  email_subject TEXT,
  email_content TEXT,
  payload_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
BEGIN
  -- Insert into activity log for tracking
  INSERT INTO public.activity_log (actor, action, details)
  VALUES (
    'system',
    'notification_queued',
    jsonb_build_object(
      'type', notification_type,
      'email_to', email_to,
      'subject', email_subject,
      'payload', payload_data
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Notification queued successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;