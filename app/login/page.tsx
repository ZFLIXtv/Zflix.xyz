import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Connexion — ZFlix',
  description: 'Connectez-vous à votre compte ZFlix.',
}

export default function LoginPage() {
  return <LoginForm />
}
