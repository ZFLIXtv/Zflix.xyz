import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Inscription — ZFlix',
  description: 'Créez votre compte ZFlix gratuitement et accédez à 15 000+ titres dès aujourd\'hui.',
}

export default function RegisterPage() {
  return <RegisterForm />
}
