# Deployment Guide — Student Representation Portal

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the contents of `supabase-schema.sql`
3. In **Storage**, create a bucket named `signatures` and set it to **Public**
4. Copy your Project URL and API keys from **Project Settings > API**

## 2. Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=a-random-string-of-at-least-32-characters
ADMIN_EMAIL=admin@yourcollege.edu
ADMIN_PASSWORD_HASH=<generated below>
```

## 3. Generate Admin Password Hash

```bash
node scripts/generate-admin-hash.js YourAdminPassword123
```

Copy the output hash into `ADMIN_PASSWORD_HASH` in `.env.local`.

## 4. Local Development

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

## 5. Deploy to Netlify

### Option A — Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option B — Netlify Dashboard
1. Push this folder to a GitHub repo
2. Go to [netlify.com](https://netlify.com) > **New site from Git**
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Install the **@netlify/plugin-nextjs** plugin (already in `netlify.toml`)
7. Add all environment variables in **Site settings > Environment variables**

## 6. Supabase Storage CORS (if needed)

In Supabase dashboard > Storage > Policies, make sure signatures bucket allows public reads.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Public landing page with live stats |
| `/sign` | Student submission form with signature pad |
| `/thank-you` | Success page after submission |
| `/admin/login` | Admin login |
| `/admin` | Dashboard with stats & charts |
| `/admin/students` | CRM table with search, filter, export |
| `/admin/logs` | Activity audit trail |

## Security Notes

- Never commit `.env.local` — it's in `.gitignore`
- The admin password is bcrypt-hashed; the plaintext is never stored
- JWT tokens expire in 8 hours
- Rate limiting is applied to the submission endpoint (5 req/min per IP)
- All admin routes are protected by middleware
