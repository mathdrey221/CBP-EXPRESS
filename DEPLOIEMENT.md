# CBP Express — Supabase personnel + déploiement

## 1. Base de données
Dans votre projet Supabase → SQL Editor → coller et exécuter en une fois :
`supabase/schema-complet.sql`
(tables, enums, RLS, GRANTs, fonctions, triggers, bucket `colis-photos`, données de départ points relais + tarifs).

## 2. Authentification (email + mot de passe)
Supabase → Authentication → Providers → Email : activé.
- Pour que l'inscription connecte directement l'agent, désactivez « Confirm email ».
- Authentication → URL Configuration → Site URL + Redirect URLs : ajoutez l'URL de votre site
  (`https://mon-app.vercel.app`, `https://mon-app.vercel.app/**`) pour la réinitialisation de mot de passe.
- Le compte `mathdrey221@gmail.com` est automatiquement admin + actif à l'inscription (trigger `handle_new_user`).
  Les autres comptes sont créés inactifs : l'admin les active et leur donne un rôle depuis la page **Équipe**.

## 3. Variables d'environnement
Local : fichier `.env` (déjà rempli, non committé). Modèle : `.env.example`.

À définir chez l'hébergeur (Vercel → Settings → Environment Variables) :

| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | https://tjzbaqslfhgrqeeikmvo.supabase.co |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | votre clé publishable |
| `VITE_SUPABASE_PROJECT_ID` | tjzbaqslfhgrqeeikmvo |
| `SUPABASE_URL` | idem VITE_SUPABASE_URL |
| `SUPABASE_PUBLISHABLE_KEY` | idem VITE_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_PROJECT_ID` | tjzbaqslfhgrqeeikmvo |
| `SUPABASE_SERVICE_ROLE_KEY` | clé secrète (Settings → API) — requise pour créer/inviter un membre depuis la page Équipe |

⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être préfixée `VITE_` ni committée.
