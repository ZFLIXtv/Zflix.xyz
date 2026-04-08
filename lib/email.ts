import { Resend } from 'resend'

// ─── Constants ────────────────────────────────────────────────────────────────

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@zflix.com'

const isDev =
  !process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development'

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY!)
}

// ─── Dev fallback ─────────────────────────────────────────────────────────────

function logDevEmail(to: string, subject: string, html: string): void {
  console.log('📧 [DEV] Email:', { to, subject, preview: html.substring(0, 200) })
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZFlix</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1315;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1315;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#171D20;border-radius:12px;overflow:hidden;border:1px solid #2a3540;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;background-color:#12191c;border-bottom:2px solid #BDE6FB;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#BDE6FB;letter-spacing:2px;">Z<span style="color:#ffffff;">FLIX</span></h1>
              <p style="margin:6px 0 0;font-size:12px;color:#7a9aac;letter-spacing:1px;text-transform:uppercase;">Votre plateforme de streaming</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 40px;background-color:#12191c;border-top:1px solid #2a3540;">
              <p style="margin:0;font-size:12px;color:#4a6475;">© ${new Date().getFullYear()} ZFlix · Tous droits réservés</p>
              <p style="margin:6px 0 0;font-size:11px;color:#2a3540;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">${text}</h2>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#c0d4e0;">${text}</p>`
}

function button(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" bgcolor="#BDE6FB" style="border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#0f1315;text-decoration:none;border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`
}

function infoBox(content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:#1e2d35;border-left:4px solid #BDE6FB;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#c0d4e0;line-height:1.6;">
        ${content}
      </td>
    </tr>
  </table>`
}

// ─── sendWelcomeEmail ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  jellyfinUrl: string,
): Promise<void> {
  const subject = 'Bienvenue sur ZFlix 🎬'
  const html = layout(`
    ${heading(`Bienvenue sur ZFlix, ${firstName} !`)}
    ${paragraph('Votre compte a été créé avec succès. Vous pouvez dès maintenant accéder à votre espace membre et profiter de notre catalogue de films, séries et animes.')}
    ${infoBox(`<strong style="color:#BDE6FB;">Votre accès Jellyfin :</strong><br/>${jellyfinUrl}`)}
    ${button('Accéder à Jellyfin', jellyfinUrl)}
    ${paragraph('Si vous avez des questions, n\'hésitez pas à nous contacter. Bonne séance !')}
  `)

  if (isDev) { logDevEmail(to, subject, html); return }

  await getResend().emails.send({ from: FROM, to, subject, html })
}

// ─── sendSubscriptionRenewedEmail ─────────────────────────────────────────────

export async function sendSubscriptionRenewedEmail(
  to: string,
  expiresAt: Date,
  durationDays: number,
): Promise<void> {
  const subject = 'Votre abonnement ZFlix a été renouvelé'
  const expiresFormatted = expiresAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = layout(`
    ${heading('Abonnement renouvelé ✅')}
    ${paragraph(`Merci pour votre confiance ! Votre abonnement ZFlix a été renouvelé avec succès pour <strong style="color:#BDE6FB;">${durationDays} jours</strong>.`)}
    ${infoBox(`
      <strong style="color:#BDE6FB;">Détails de votre abonnement :</strong><br/>
      Durée ajoutée : ${durationDays} jours<br/>
      Abonnement valable jusqu'au : <strong>${expiresFormatted}</strong>
    `)}
    ${paragraph('Votre accès Jellyfin est actif. Profitez de notre catalogue !')}
  `)

  if (isDev) { logDevEmail(to, subject, html); return }

  await getResend().emails.send({ from: FROM, to, subject, html })
}

// ─── sendSubscriptionExpiredEmail ─────────────────────────────────────────────

export async function sendSubscriptionExpiredEmail(to: string): Promise<void> {
  const subject = 'Votre abonnement ZFlix a expiré'
  const html = layout(`
    ${heading('Votre abonnement a expiré')}
    ${paragraph('Votre abonnement ZFlix est arrivé à expiration. Votre accès à la bibliothèque de contenus a été suspendu.')}
    ${paragraph('Pour continuer à profiter de ZFlix, renouvelez votre abonnement dès maintenant depuis votre espace membre.')}
    ${button('Renouveler mon abonnement', `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://zflix.com'}/dashboard/subscription`)}
    ${paragraph('Vous avez des questions ? Nous sommes disponibles pour vous aider.')}
  `)

  if (isDev) { logDevEmail(to, subject, html); return }

  await getResend().emails.send({ from: FROM, to, subject, html })
}

// ─── sendPasswordResetEmail ───────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  appUrl: string,
): Promise<void> {
  const subject = 'Réinitialisation de votre mot de passe ZFlix'
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

  const html = layout(`
    ${heading('Réinitialisation du mot de passe')}
    ${paragraph('Vous avez demandé la réinitialisation de votre mot de passe ZFlix. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.')}
    ${button('Réinitialiser mon mot de passe', resetUrl)}
    ${infoBox(`Ce lien est valable <strong style="color:#BDE6FB;">1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.`)}
    ${paragraph('Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.')}
    <p style="margin:16px 0 0;font-size:12px;color:#4a6475;">Lien direct : <a href="${resetUrl}" style="color:#BDE6FB;">${resetUrl}</a></p>
  `)

  if (isDev) { logDevEmail(to, subject, html); return }

  await getResend().emails.send({ from: FROM, to, subject, html })
}

// ─── sendReferralRewardEmail ──────────────────────────────────────────────────

export async function sendReferralRewardEmail(
  to: string,
  rewardDays: number,
  referredEmail: string,
): Promise<void> {
  const subject = `🎁 Vous avez gagné ${rewardDays} jours offerts sur ZFlix !`
  const maskedEmail =
    referredEmail.replace(/(.{2}).+(@.+)/, '$1***$2')

  const html = layout(`
    ${heading(`Félicitations ! ${rewardDays} jours offerts 🎁`)}
    ${paragraph(`Un ami a rejoint ZFlix grâce à votre code de parrainage. En guise de remerciement, nous vous offrons <strong style="color:#BDE6FB;">${rewardDays} jours supplémentaires</strong> sur votre abonnement.`)}
    ${infoBox(`
      <strong style="color:#BDE6FB;">Détails de la récompense :</strong><br/>
      Filleul : ${maskedEmail}<br/>
      Récompense : +${rewardDays} jours d'abonnement
    `)}
    ${paragraph('Continuez à partager votre code de parrainage pour cumuler encore plus de jours offerts !')}
    ${button('Voir mon tableau de bord', `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://zflix.com'}/dashboard`)}
  `)

  if (isDev) { logDevEmail(to, subject, html); return }

  await getResend().emails.send({ from: FROM, to, subject, html })
}
