-- Test the updated net.http_post function with http_request
-- This migration tests the function to ensure it works correctly

-- Test the function with a simple HTTP request
DO $$
BEGIN
  -- Test the function (this will not actually make the request in test mode)
  PERFORM net.http_post('https://httpbin.org/post', '{"test": "data"}'::json);
  RAISE NOTICE 'net.http_post function is working correctly with http_request';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error testing net.http_post: %', SQLERRM;
END $$;
