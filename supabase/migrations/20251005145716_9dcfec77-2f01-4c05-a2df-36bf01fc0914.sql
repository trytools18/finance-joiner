-- Clean up orphaned transaction references
-- This migration fixes transactions that reference non-existent categories or parties

-- First, let's update transactions with invalid category references to NULL
UPDATE transactions 
SET category_id = NULL 
WHERE category_id IS NOT NULL 
AND category_id NOT IN (SELECT id FROM transaction_categories);

-- Add a comment to document this
COMMENT ON COLUMN transactions.category_id IS 'References transaction_categories.id. Can be NULL for uncategorized transactions.';

-- Create an index to speed up lookups
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_party ON transactions(party);

-- Add a function to validate category references before insert/update
CREATE OR REPLACE FUNCTION validate_transaction_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM transaction_categories WHERE id = NEW.category_id) THEN
      RAISE EXCEPTION 'Invalid category_id: category does not exist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate category on insert/update
DROP TRIGGER IF EXISTS validate_category_trigger ON transactions;
CREATE TRIGGER validate_category_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_category();