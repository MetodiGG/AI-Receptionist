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
```

Файловете `.env*` с реални стойности са изключени от Git. Никога не добавяй `service_role` ключ в клиентската част на приложението.

## Проверка

```bash
pnpm build
pnpm audit --prod
```
