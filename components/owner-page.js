'use client'

import Link from 'next/link'
import { useOwner } from './owner-context'

export function OwnerPage({ children, allowSetup = false }) {
  const owner = useOwner()
  const en = owner.locale === 'en'
  if (owner.status === 'setup' && !allowSetup) return <main className="dashboard-content"><div className="empty-state"><h2>{en ? 'Complete the initial setup' : 'Завърши първоначалната настройка'}</h2><p>{en ? 'Add your business, services and working hours before using this section.' : 'Преди да използваш тази секция, добави бизнеса, услугите и работното време.'}</p><Link className="primary-button" href="/dashboard">{en ? 'Go to setup' : 'Към настройката'}</Link></div></main>
  return children(owner)
}
