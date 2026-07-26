CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY dev_public_chat_messages ON public.chat_messages FOR ALL USING (true);

-- Enable Realtime replication for this table so the app gets instant messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
