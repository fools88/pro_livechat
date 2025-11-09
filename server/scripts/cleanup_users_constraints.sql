-- ========================================
-- CLEANUP USERS DUPLICATE CONSTRAINTS
-- ========================================
-- Tabel Users memiliki 563+ duplicate UNIQUE CONSTRAINTS!
-- Kita harus drop CONSTRAINTS, bukan DROP INDEX
-- ========================================

DO $$
DECLARE
  constraint_record RECORD;
  counter INT := 0;
BEGIN
  -- Drop duplicate email constraints (keep only Users_email_key)
  FOR constraint_record IN 
    SELECT conname as constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public."Users"'::regclass
    AND conname LIKE 'Users_email_key%'
    AND conname != 'Users_email_key'
    ORDER BY conname
  LOOP
    EXECUTE 'ALTER TABLE public."Users" DROP CONSTRAINT IF EXISTS "' || constraint_record.constraint_name || '";';
    counter := counter + 1;
    
    IF counter % 100 = 0 THEN
      RAISE NOTICE 'Dropped % email constraints...', counter;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Dropped % duplicate email constraints', counter;
  
  -- Reset counter for username constraints
  counter := 0;
  
  -- Drop duplicate username constraints (keep only Users_username_key)
  FOR constraint_record IN 
    SELECT conname as constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public."Users"'::regclass
    AND conname LIKE 'Users_username_key%'
    AND conname != 'Users_username_key'
    ORDER BY conname
  LOOP
    EXECUTE 'ALTER TABLE public."Users" DROP CONSTRAINT IF EXISTS "' || constraint_record.constraint_name || '";';
    counter := counter + 1;
    
    IF counter % 100 = 0 THEN
      RAISE NOTICE 'Dropped % username constraints...', counter;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Dropped % duplicate username constraints', counter;
  RAISE NOTICE '🎉 CLEANUP COMPLETE! Users table now has only essential constraints.';
END $$;

-- Verify hasil
RAISE NOTICE '📊 Verifying cleanup...';

SELECT 
  COUNT(*) as total_constraints
FROM pg_constraint
WHERE conrelid = 'public."Users"'::regclass;

-- List remaining constraints (should be minimal)
SELECT 
  conname as constraint_name, 
  contype as type
FROM pg_constraint 
WHERE conrelid = 'public."Users"'::regclass
ORDER BY conname;
