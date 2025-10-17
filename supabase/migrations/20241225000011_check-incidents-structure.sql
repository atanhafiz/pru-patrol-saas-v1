-- Check the current structure of the incidents table
-- This will help us understand the current column type

-- Check if the table exists and its structure
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
