import { PasswordRecovery } from '../../components/password-recovery'

export const metadata = { title: 'Възстановяване на парола / Password recovery', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default function ForgotPasswordPage() {
  return <PasswordRecovery />
}
