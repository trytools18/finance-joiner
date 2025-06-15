
-- Enable RLS for all tables (this is safe to run multiple times)
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Transaction categories policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_categories' AND policyname = 'Users can view their own categories') THEN
    CREATE POLICY "Users can view their own categories" 
      ON public.transaction_categories 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_categories' AND policyname = 'Users can create their own categories') THEN
    CREATE POLICY "Users can create their own categories" 
      ON public.transaction_categories 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_categories' AND policyname = 'Users can update their own categories') THEN
    CREATE POLICY "Users can update their own categories" 
      ON public.transaction_categories 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_categories' AND policyname = 'Users can delete their own categories') THEN
    CREATE POLICY "Users can delete their own categories" 
      ON public.transaction_categories 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;

  -- Transaction parties policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_parties' AND policyname = 'Users can view their own parties') THEN
    CREATE POLICY "Users can view their own parties" 
      ON public.transaction_parties 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_parties' AND policyname = 'Users can create their own parties') THEN
    CREATE POLICY "Users can create their own parties" 
      ON public.transaction_parties 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_parties' AND policyname = 'Users can update their own parties') THEN
    CREATE POLICY "Users can update their own parties" 
      ON public.transaction_parties 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_parties' AND policyname = 'Users can delete their own parties') THEN
    CREATE POLICY "Users can delete their own parties" 
      ON public.transaction_parties 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;

  -- Organization settings policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_settings' AND policyname = 'Users can view their own settings') THEN
    CREATE POLICY "Users can view their own settings" 
      ON public.organization_settings 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_settings' AND policyname = 'Users can create their own settings') THEN
    CREATE POLICY "Users can create their own settings" 
      ON public.organization_settings 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_settings' AND policyname = 'Users can update their own settings') THEN
    CREATE POLICY "Users can update their own settings" 
      ON public.organization_settings 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_settings' AND policyname = 'Users can delete their own settings') THEN
    CREATE POLICY "Users can delete their own settings" 
      ON public.organization_settings 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;
