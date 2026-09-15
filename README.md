# ATERRO

Projeto React + Vite preparado para deploy na Vercel.

## Deploy
1. Suba esta pasta para um repositório GitHub ou importe o projeto na Vercel.
2. Na Vercel, adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça um novo deploy.

Sem as variáveis do Supabase, a página ainda abre, mas cadastro/login/dados do banco não funcionarão.

## Local
```bash
npm install
npm run dev
```
