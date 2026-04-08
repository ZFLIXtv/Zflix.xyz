import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — ZFlix',
  description: 'Conditions générales de vente de la plateforme ZFlix.',
}

interface Article {
  number: number
  title: string
  content: string | string[]
}

const articles: Article[] = [
  {
    number: 1,
    title: 'Objet',
    content:
      'Les présentes conditions générales de vente (ci-après « CGV ») régissent les relations contractuelles entre ZFlix (ci-après « le Prestataire ») et toute personne physique souhaitant souscrire à un abonnement de streaming (ci-après « l\'Utilisateur »). Toute souscription implique l\'acceptation pleine et entière des présentes CGV.',
  },
  {
    number: 2,
    title: 'Acceptation des conditions',
    content:
      'En créant un compte sur la plateforme ZFlix et en procédant à tout achat ou utilisation des services, l\'Utilisateur reconnaît avoir pris connaissance des présentes CGV et les accepter sans réserve. ZFlix se réserve le droit de modifier les présentes CGV à tout moment. Les nouvelles conditions prennent effet à leur date de publication sur le site.',
  },
  {
    number: 3,
    title: 'Description des services',
    content: [
      'ZFlix propose un service de streaming vidéo permettant l\'accès à un catalogue de contenus (films, séries, animés) via la plateforme open-source Jellyfin.',
      'L\'accès au service est personnel et non transférable. Le compte est réservé à un usage strictement personnel et privé.',
      'ZFlix ne garantit pas la disponibilité permanente et ininterrompue du service. Des interruptions pour maintenance peuvent survenir avec ou sans préavis.',
    ],
  },
  {
    number: 4,
    title: 'Abonnements et tarifs',
    content: [
      'Les abonnements sont proposés aux tarifs suivants :',
      '• 1 mois : 4,99 € — facturé 4,99 €',
      '• 6 mois : 3,99 €/mois — facturé 23,94 €',
      '• 12 mois : 2,99 €/mois — facturé 35,88 €',
      'Tous les prix sont indiqués en euros TTC. ZFlix se réserve le droit de modifier ses tarifs à tout moment. Les tarifs applicables sont ceux en vigueur au moment de la souscription.',
    ],
  },
  {
    number: 5,
    title: 'Paiement',
    content: [
      'Le paiement s\'effectue en ligne par carte bancaire via notre prestataire de paiement sécurisé (Stripe). Aucune donnée bancaire n\'est stockée par ZFlix.',
      'En cas d\'échec du paiement, l\'abonnement ne sera pas activé. L\'Utilisateur sera invité à réessayer avec un autre moyen de paiement.',
      'Les factures sont disponibles dans l\'espace client de l\'Utilisateur.',
    ],
  },
  {
    number: 6,
    title: 'Résiliation',
    content: [
      'L\'Utilisateur peut résilier son abonnement à tout moment depuis son espace client. La résiliation prend effet à l\'échéance de la période d\'abonnement en cours ; aucun remboursement au prorata n\'est accordé.',
      'ZFlix se réserve le droit de suspendre ou résilier l\'accès de tout Utilisateur en cas de violation des présentes CGV, sans préavis ni remboursement.',
    ],
  },
  {
    number: 7,
    title: 'Essai gratuit',
    content: [
      'Tout nouvel Utilisateur bénéficie d\'un essai gratuit de 3 (trois) jours à compter de la date de création de son compte.',
      'Un seul essai gratuit est accordé par personne. Toute tentative de contournement de cette limite (création de plusieurs comptes, etc.) constitue une violation des présentes CGV.',
      'À l\'issue de la période d\'essai, l\'accès est suspendu automatiquement si aucun abonnement n\'a été souscrit.',
    ],
  },
  {
    number: 8,
    title: 'Programme de parrainage',
    content: [
      'ZFlix propose un programme de parrainage permettant à tout Utilisateur disposant d\'un abonnement actif de partager un code unique.',
      'Pour chaque nouvel Utilisateur inscrit via ce code et ayant validé son compte, le parrain reçoit 30 (trente) jours d\'abonnement gratuit, cumulables.',
      'ZFlix se réserve le droit de modifier ou d\'interrompre ce programme à tout moment et de refuser tout parrainage considéré comme abusif ou frauduleux.',
    ],
  },
  {
    number: 9,
    title: 'Responsabilités',
    content: [
      'ZFlix s\'efforce d\'assurer la disponibilité et la qualité du service mais ne peut être tenu responsable des interruptions techniques, des pertes de données ou d\'un accès à des contenus spécifiques.',
      'L\'Utilisateur est responsable de la confidentialité de ses identifiants de connexion. Tout accès réalisé avec ses identifiants est présumé effectué par lui.',
      'L\'utilisation du service à des fins illicites ou contraires aux présentes CGV engage la seule responsabilité de l\'Utilisateur.',
    ],
  },
  {
    number: 10,
    title: 'Propriété intellectuelle',
    content: [
      'L\'ensemble des éléments constitutifs de la plateforme ZFlix (logo, interface, code source, marque) sont la propriété exclusive de ZFlix et sont protégés par les lois relatives à la propriété intellectuelle.',
      'Les contenus accessibles via le service sont fournis par des sources tierces. ZFlix ne revendique aucun droit sur ces contenus.',
      'Toute reproduction, représentation ou diffusion non autorisée des éléments de la plateforme est strictement interdite.',
    ],
  },
  {
    number: 11,
    title: 'Droit applicable et litiges',
    content: [
      'Les présentes CGV sont soumises au droit français.',
      'En cas de litige relatif à l\'exécution ou à l\'interprétation des présentes CGV, les parties s\'efforceront de trouver une solution amiable.',
      'À défaut d\'accord amiable, tout litige sera soumis à la compétence exclusive des tribunaux français, nonobstant pluralité de défendeurs ou appel en garantie.',
      'Conformément aux articles L.611-1 et suivants du Code de la consommation, le consommateur peut recourir à un médiateur de la consommation. Toute demande de médiation peut être adressée via le site http://ec.europa.eu/consumers/odr.',
    ],
  },
]

export default function CGVPage() {
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
            Conditions Générales de Vente
          </h1>
          <p className="text-sm text-accent-off">
            Dernière mise à jour : janvier 2025
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {articles.map((article) => (
            <article key={article.number} className="flex flex-col gap-3">
              <h2 className="font-[Outfit] font-semibold text-lg text-[#E8F4FA]">
                Article {article.number} — {article.title}
              </h2>
              {Array.isArray(article.content) ? (
                <div className="flex flex-col gap-2">
                  {article.content.map((paragraph, i) => (
                    <p key={i} className="text-sm text-accent-off leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-accent-off leading-relaxed">{article.content}</p>
              )}
            </article>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-accent/10 flex flex-wrap gap-4 text-sm text-accent-off">
          <Link href="/legal/privacy" className="hover:text-accent transition-colors">
            Politique de confidentialité
          </Link>
          <Link href="/" className="hover:text-accent transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  )
}
