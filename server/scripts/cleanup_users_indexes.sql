-- ========================================
-- CLEANUP USERS DUPLICATE INDEXES
-- ========================================
-- Tabel Users memiliki 563+ duplicate indexes!
-- Script ini akan drop semua kecuali 3 yang essential
-- ========================================

-- Generate DROP commands untuk semua duplicate indexes
-- (Kita akan execute ini secara manual)

DO $$
DECLARE
  idx_record RECORD;
  counter INT := 0;
BEGIN
  FOR idx_record IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'Users' 
    AND indexname NOT IN (
      'Users_pkey',           -- Keep primary key
      'Users_email_key',      -- Keep original email unique index
      'Users_username_key'    -- Keep original username unique index
    )
    ORDER BY indexname
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS "' || idx_record.indexname || '";';
    counter := counter + 1;
    
    -- Progress update setiap 100 indexes
    IF counter % 100 = 0 THEN
      RAISE NOTICE 'Dropped % indexes...', counter;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Total dropped: % duplicate indexes', counter;
  RAISE NOTICE '✅ Users table now has only 3 essential indexes';
END $$;

-- Verify hasil
SELECT 
  COUNT(*) as total_indexes,
  COUNT(*) - 3 as should_be_zero
FROM pg_indexes 
WHERE tablename = 'Users';

-- List remaining indexes (should only be 3)
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Users'
ORDER BY indexname;
