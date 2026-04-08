#!/usr/bin/env node
/**
 * ZFlix Cron Runner
 * Appelle /api/cron/check-expirations toutes les heures.
 * Usage: node scripts/cron-runner.js
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('[cron-runner] CRON_SECRET manquant dans les variables d\'environnement.')
  process.exit(1)
}

const INTERVAL_MS = 60 * 60 * 1000 // 1 heure

async function runCheck() {
  const now = new Date().toLocaleString('fr-FR')
  console.log(`[cron-runner] ${now} — Vérification des expirations...`)

  try {
    const res = await fetch(`${APP_URL}/api/cron/check-expirations`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error(`[cron-runner] Erreur: ${JSON.stringify(data)}`)
      return
    }

    const { processed, total, errors } = data.data
    console.log(`[cron-runner] ${processed}/${total} abonnements expirés traités.`)
    if (errors.length > 0) {
      console.warn(`[cron-runner] ${errors.length} erreur(s):`, errors)
    }
  } catch (err) {
    console.error('[cron-runner] Impossible de joindre le serveur:', err.message)
  }
}

// Lancement immédiat puis toutes les heures
runCheck()
setInterval(runCheck, INTERVAL_MS)

console.log(`[cron-runner] Démarré. Vérification toutes les heures. (${APP_URL})`)
