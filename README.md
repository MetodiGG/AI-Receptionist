# AI Рецепционист

Модерна SaaS платформа за малки бизнеси, която управлява услуги, екип, работно време и резервации чрез AI асистент.

## Текущ етап

- вход и регистрация със Supabase Auth;
- защитено табло за собственици;
- onboarding за бизнес профил, услуги, екип и седмичен график;
- записване на данните в multi-tenant Supabase схемата;
- responsive интерфейс за desktop и mobile.

## Локално стартиране

Изисквания: Node.js 20.9+ и pnpm.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Попълни в `.env.local` публичните настройки на Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-6-luna
```

Файловете `.env*` с реални стойности са изключени от Git. `SUPABASE_SERVICE_ROLE_KEY` и `OPENAI_API_KEY` са server-only тайни — никога не ги именувай с `NEXT_PUBLIC_` и не ги използвай в Client Components.

## Supabase база данни

SQL промените се пазят в `supabase/migrations`. При нов или съществуващ Supabase проект изпълнявай миграциите по ред през **SQL Editor**.

Ако таблото покаже `permission denied for table businesses`, изпълни:

```text
supabase/migrations/20261013164000_grant_data_api_access.sql
```

Миграцията дава нужните права на вписаните потребители, запазва Row Level Security политиките активни и не позволява директен анонимен достъп до бизнес данните.

## Проверка

```bash
pnpm build
pnpm audit --prod
```
