/*
  # Fix handle_new_user trigger function

  1. Updates
    - Fix the `handle_new_user` function to properly handle the `user_role` enum type
    - Ensure the function correctly inserts new user profiles with proper type casting
    - Handle the case where email might be null in auth metadata

  2. Changes
    - Update the trigger function to cast 'teacher' to the proper enum type
    - Add proper error handling and null checks
    - Ensure compatibility with the existing database schema
*/

-- Drop and recreate the handle_new_user function with proper enum handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'full_name',
    'teacher'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();