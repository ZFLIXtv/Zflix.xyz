import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — ZFlix',
  description: 'Politique de confidentialité et protection des données personnelles de ZFlix.',
}

interface Section {
  number: number
  title: string
  content: string | string[]
}

const sections: Section[] = [
  {
    number: 1,
    title: 'Responsable de traitement',
    content:
      'ZFlix (ci-après « nous ») est responsable du traitement de vos données personnelles. Pour toute question relative à la protection de vos données, vous pouvez nous contacter à l\'adresse : contact@zflix.fr.',
  },
  {
    number: 2,
    title: 'Données collectées',
    content: [
      'Lors de votre inscription et utilisation de ZFlix, nous collectons les données suivantes :',
      '• Données d\'identification : adresse e-mail, nom d\'utilisateur Jellyfin',
      '• Données de connexion : adresse IP, date et heure de connexion, journaux d\'audit',
      '• Données de facturation : informations de transaction (traitées par Stripe — aucune donnée bancaire n\'est stockée par ZFlix)',
      '• Données d\'utilisation : abonnement actif, date d\'expiration, code de parrainage',
      'Aucune donnée sensible (au sens de l\'article 9 du RGPD) n\'est collectée.',
    ],
  },
  {
    number: 3,
    title: 'Finalités du traitement',
    content: [
      'Vos données sont utilisées aux fins suivantes :',
      '• Gestion de votre compte et de votre abonnement',
      '• Fourniture du service de streaming via Jellyfin',
      '• Traitement des paiements et émission des factures',
      '• Gestion du programme de parrainage',
      '• Communication relative au service (notifications, support)',
      '• Sécurité et prévention des fraudes',
      '• Obligations légales et comptables',
    ],
  },
  {
    number: 4,
    title: 'Base légale du traitement',
    content: [
      '• Exécution du contrat (article 6.1.b RGPD) : création de compte, gestion de l\'abonnement, fourniture du service',
      '• Intérêt légitime (article 6.1.f RGPD) : sécurité de la plateforme, prévention des fraudes, journaux d\'audit',
      '• Obligation légale (article 6.1.c RGPD) : conservation des données de facturation',
      '• Consentement (article 6.1.a RGPD) : communications marketing optionnelles',
    ],
  },
  {
    number: 5,
    title: 'Destinataires des données',
    content: [
      'Vos données sont traitées par ZFlix et les sous-traitants suivants :',
      '• Stripe (paiement en ligne) — politique de confidentialité : stripe.com/privacy',
      '• Hébergeur du serveur (infrastructure VPS sécurisée)',
      '• Jellyfin (logiciel open-source de gestion du serveur multimédia)',
      'Nous ne vendons ni ne louons vos données personnelles à des tiers. Aucun transfert hors Union Européenne n\'est effectué sans garanties appropriées.',
    ],
  },
  {
    number: 6,
    title: 'Durée de conservation',
    content: [
      '• Données de compte actif : conservées pendant toute la durée de l\'abonnement',
      '• Données post-résiliation : 3 ans à compter de la fin du contrat (obligations légales)',
      '• Données de facturation : 10 ans conformément aux obligations comptables françaises',
      '• Journaux d\'audit et logs de connexion : 12 mois glissants',
      '• Tokens de réinitialisation de mot de passe : 1 heure (expiration automatique)',
    ],
  },
  {
    number: 7,
    title: 'Vos droits',
    content: [
      'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :',
      '• Droit d\'accès : obtenir une copie de vos données personnelles',
      '• Droit de rectification : corriger vos données inexactes ou incomplètes',
      '• Droit à l\'effacement : demander la suppression de vos données (sous réserve des obligations légales)',
      '• Droit à la portabilité : recevoir vos données dans un format structuré',
      '• Droit d\'opposition : vous opposer au traitement basé sur l\'intérêt légitime',
      '• Droit à la limitation : demander la suspension temporaire du traitement',
      'Pour exercer vos droits, contactez-nous à : contact@zflix.fr. Nous répondrons dans un délai maximum de 30 jours. Vous pouvez également déposer une réclamation auprès de la CNIL (www.cnil.fr).',
    ],
  },
  {
    number: 8,
    title: 'Sécurité des données',
    content: [
      'ZFlix met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :',
      '• Chiffrement des mots de passe avec bcrypt (facteur de coût 12)',
      '• Authentification par token JWT signé (HMAC-SHA256)',
      '• Communications chiffrées via HTTPS/TLS',
      '• Cookies HTTP-only et Secure pour les sessions',
      '• Limitation du taux de requêtes (rate limiting) sur les endpoints d\'authentification',
      '• Accès restreint aux données selon le principe du moindre privilège',
    ],
  },
  {
    number: 9,
    title: 'Cookies et traceurs',
    content: [
      'ZFlix utilise exclusivement des cookies fonctionnels nécessaires au fonctionnement du service :',
      '• Cookie auth-token : authentification de session (HttpOnly, Secure, SameSite=Lax) — durée : 7 jours',
      '• LocalStorage : préférences d\'interface (bannière maintenance) — durée : session',
      'Aucun cookie publicitaire, de tracking ou analytique tiers n\'est utilisé. Aucun consentement supplémentaire n\'est requis pour les cookies strictement nécessaires.',
    ],
  },
  {
    number: 10,
    title: 'Modifications de la politique',
    content:
      'Nous nous réservons le droit de modifier la présente politique de confidentialité à tout moment. Toute modification substantielle vous sera notifiée par e-mail ou via une bannière sur la plateforme. La version en vigueur est celle publiée sur ce site, accompagnée de sa date de mise à jour.',
  },
  {
    number: 11,
    title: 'Contact et réclamations',
    content: [
      'Pour toute question relative à la protection de vos données personnelles :',
      '• E-mail : contact@zflix.fr',
      '• Délai de réponse : 30 jours maximum',
      'Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission Nationale de l\'Informatique et des Libertés (CNIL) :',
      '• Site web : www.cnil.fr',
      '• Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-darkest">
      {/* Header */}
      <header className="border-b border-accent/10 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-[Outfit] font-bold text-xl text-accent focus-visible:outline-accent rounded"
          >
            ZFlix
          </Link>
          <Link href="/" className="text-sm text-accent-off hover:text-accent transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="font-[Outfit] font-bold text-2xl sm:text-3xl text-[#E8F4FA] mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-accent-off">
            Dernière mise à jour : janvier 2025 · Conforme RGPD (Règlement UE 2016/679)
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.number} className="flex flex-col gap-3">
              <h2 className="font-[Outfit] font-semibold text-lg text-[#E8F4FA]">
                {section.number}. {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <div className="flex flex-col gap-2">
                  {section.content.map((paragraph, i) => (
                    <p key={i} className="text-sm text-accent-off leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-accent-off leading-relaxed">{section.content}</p>
              )}
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-accent/10 flex flex-wrap gap-4 text-sm text-accent-off">
          <Link href="/legal/cgv" className="hover:text-accent transition-colors">
            Conditions Générales de Vente
          </Link>
          <Link href="/" className="hover:text-accent transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  )
}
