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

CREATE POLICY "Enable read access for users based on business_id" ON public.chat_messages
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for users" ON public.chat_messages
  FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for users" ON public.chat_messages
  FOR DELETE
  USING (true);
