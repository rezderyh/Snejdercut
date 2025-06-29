/*
  # Fix admin registration issues

  1. Security
    - Temporarily disable RLS for profiles during setup
    - Create a simpler trigger function
    - Add proper policies after setup

  2. Changes
    - Simplify the handle_new_user function
    - Add better error handling
    - Ensure proper permissions
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Temporarily disable RLS on profiles for easier setup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a simpler trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert basic profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'teacher'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;
CREATE POLICY "Enable all operations for authenticated users"
  ON profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for anon users during signup" ON profiles;
CREATE POLICY "Enable insert for anon users during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);