# GoRez launch-readiness audit

Дата: 14 октомври 2026 г.  
Обхват: публичен сайт, клиентска резервация, собственическо табло, partner onboarding и founder demo.

## Архитектура

- Next.js 16 App Router и React 19;
- Supabase Auth, Postgres, RLS и server-only service role за привилегировани операции;
- Vercel deployment и cron за notification outbox;
- без платен AI: асистентът е детерминиран booking flow върху реалните бизнес данни;
- Resend е незадължителен и не е необходим за основния booking flow.

## Потвърдено работещо

- регистрация, вход и multi-tenant собственическо табло;
- onboarding за профил, услуги, екип и график;
- публична BG/EN страница на бизнеса и 14-дневна реална наличност;
- server-side защита срещу двойна резервация;
- създаване, преместване, статус и защитен cancellation link;
- клиенти, разговори, резултати, настройки, QR, widget и private calendar feed;
- responsive клиентски и собственически интерфейс;
- публична начална страница с категории и реални активни бизнеси.

## Добавено за P0

- отделна BG/EN страница `/for-businesses` с ясна стойност и кратка заявка;
- сигурен `partner_leads` pipeline с rate limit, honeypot, валидация и deduplication;
- защитен admin pipeline за статуси и бележки;
- видим CTA „Добави бизнеса си безплатно“ от началната страница;
- по-добри metadata, canonical и Open Graph настройки;
- защитен `/dashboard/demo` с readiness проверка и 5-минутен презентационен път;
- мобилна dashboard навигация, която остава достъпна при повече секции.

## Частично или зависимо от конфигурация

- имейл известия: работят само с `RESEND_API_KEY` и `EMAIL_FROM`; резервацията не зависи от тях;
- founder уведомление за нов lead: незадължително, със същата Resend конфигурация;
- `/admin`: изисква `PLATFORM_ADMIN_EMAILS`;
- custom domain: `NEXT_PUBLIC_APP_URL` трябва да бъде сменен след свързване на домейна;
- legal copy е продуктова основа, не финален юридически преглед.

## Оставащ блокер преди публичен deployment

Миграцията `20261014150000_partner_pipeline.sql` трябва да бъде приложена в production Supabase и след това публичната lead форма да бъде тествана от край до край. Без миграцията новата страница не трябва да се публикува.

Няма изолиран demo tenant/database. `/dashboard/demo` умишлено показва предупреждение, че използва реалния вписан бизнес. За напълно безопасни многократни демонстрации е необходим отделен demo акаунт и demo business, които не съдържат реални клиентски данни.

## Implementation checklist

1. Приложи новата SQL миграция в Supabase.
2. Потвърди `PLATFORM_ADMIN_EMAILS` във Vercel.
3. По желание конфигурирай Resend; без него не обещавай имейл известия.
4. Изпрати тестова partner заявка и провери, че се вижда само в `/admin`.
5. Направи една тестова резервация, премести я и я отмени.
6. Провери BG/EN и mobile layout на homepage, business landing и booking flow.
7. Свържи custom domain и актуализирай `NEXT_PUBLIC_APP_URL`.
