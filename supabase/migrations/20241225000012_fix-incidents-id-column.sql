-- Fix incidents table id column from identity to sequence
-- This migration converts the identity column to a regular sequence

-- First, let's check if we need to handle existing data
DO $$
BEGIN
    -- Check if the column is an identity column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'incidents' 
        AND table_schema = 'public' 
        AND column_name = 'id' 
        AND is_identity = 'YES'
    ) THEN
        -- Drop the identity property
        ALTER TABLE incidents ALTER COLUMN id DROP IDENTITY;
        
        -- Create a sequence
        CREATE SEQUENCE IF NOT EXISTS incidents_id_seq;
        
        -- Set the sequence to start from the current max value + 1
        PERFORM setval('incidents_id_seq', COALESCE((SELECT MAX(id) FROM incidents), 0) + 1);
        
        -- Set the default value
        ALTER TABLE incidents ALTER COLUMN id SET DEFAULT nextval('incidents_id_seq');
        
        RAISE NOTICE 'Successfully converted identity column to sequence';
    ELSE
        RAISE NOTICE 'Column is not an identity column, no changes needed';
    END IF;
END $$;
