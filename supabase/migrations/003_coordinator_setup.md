# Creating the First Coordinator Account

## Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project → Authentication → Users
2. Find the user you want to promote
3. Go to Table Editor → profiles table
4. Find the row with that user's ID
5. Change `role` from `volunteer` to `coordinator`
6. Click Save

## Method 2: Via SQL Editor

```sql
-- Replace the email with the coordinator's actual email
UPDATE profiles
SET role = 'coordinator'
WHERE email = 'coordinator@yourorg.example.com';
```

## Method 3: Service Role API (Programmatic)

Use the SUPABASE_SERVICE_ROLE_KEY (server-side only) to update roles programmatically in an admin panel.

## Security Notes

- Never expose the service role key in client-side code
- Only promote trusted users to coordinator role
- Coordinators have elevated database permissions enforced by RLS
- Role changes are not reversible without direct database access
