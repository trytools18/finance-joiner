-- Fix security warning: Add search_path to validate_transaction_category function
CREATE OR REPLACE FUNCTION validate_transaction_category()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM transaction_categories WHERE id = NEW.category_id) THEN
      RAISE EXCEPTION 'Invalid category_id: category does not exist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Also fix the existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;