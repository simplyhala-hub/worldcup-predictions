# World Cup Predictions Dynamic App

This is a dynamic office prediction league using:

- GitHub = stores code
- Vercel = hosts the live website link
- Supabase = database for users, matches, predictions, and leaderboard

## 1) Supabase setup

1. Open Supabase.
2. Create/open your project.
3. Go to SQL Editor.
4. Open `supabase/schema.sql` from this project.
5. Copy all SQL and click Run.

## 2) Environment variables

In Vercel add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

This simple version does not need the service role key.

## 3) GitHub upload

1. Create a new GitHub repository.
2. Upload the CONTENTS of this folder, not the ZIP.
3. Make sure `package.json` is visible on the main repo page.

## 4) Vercel deploy

1. Go to Vercel.
2. Add New > Project.
3. Import your GitHub repository.
4. Add the environment variables.
5. Deploy.

## 5) Admin

Open `/admin` on your deployed website.
Default PIN is `1234`.

Use Admin to:
- Add matches
- Add final results
- Delete matches
- Export JSON

## Notes

This is intentionally simple so it is easy to deploy and use. The leaderboard updates from Supabase, so all colleagues share the same ranking.
