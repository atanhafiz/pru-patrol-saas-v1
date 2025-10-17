-- Verify the incidents table structure
-- This migration confirms the table is properly configured

-- Check the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns 
WHERE table_name = 'incidents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify the table is working by checking existing records
SELECT COUNT(*) as total_records FROM incidents;
