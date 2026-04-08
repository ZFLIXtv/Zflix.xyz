import React from 'react'

const ShareIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
)

const PersonPlusIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
)

const GiftIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    />
  </svg>
)

interface Step {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Partagez votre code unique',
    description:
      "Accédez à votre espace personnel et copiez votre code de parrainage. Partagez-le avec vos proches.",
    icon: <ShareIcon />,
  },
  {
    number: 2,
    title: "Votre ami s'inscrit",
    description:
      "Votre filleul crée son compte ZFlix en renseignant votre code lors de l'inscription.",
    icon: <PersonPlusIcon />,
  },
  {
    number: 3,
    title: 'Recevez 1 mois offert',
    description:
      "Dès que votre filleul valide son compte, 30 jours d'abonnement sont automatiquement ajoutés au vôtre.",
    icon: <GiftIcon />,
  },
]

interface ReferralSectionProps {
  id?: string
}

export function ReferralSection({ id }: ReferralSectionProps) {
  return (
    <section id={id} className="py-20 md:py-28 bg-darkest" aria-labelledby="parrainage-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* En-tête */}
        <div className="text-center mb-12 md:mb-16">
          <h2 id="parrainage-heading" className="font-bold text-2xl sm:text-3xl md:text-4xl text-[#E8F4FA] mb-4">
            Partagez, gagnez
          </h2>
          <p className="text-accent-off text-base max-w-xl mx-auto">
            Chaque filleul vous offre{' '}
            <span className="text-accent font-semibold">30 jours d'abonnement gratuit</span>
          </p>
        </div>

        {/* Étapes */}
        <div className="relative flex flex-col md:flex-row items-start md:items-stretch gap-8 md:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex-1 flex flex-col md:items-center">
              {/* Ligne pointillée de connexion (desktop uniquement) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-10 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px"
                  style={{ borderTop: '1.5px dashed rgba(189,230,251,0.20)' }}
                  aria-hidden="true"
                />
              )}

              {/* Contenu de l'étape */}
              <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-5 text-left md:text-center px-0 md:px-6">
                {/* Icône avec numéro */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-dark-apparent border border-accent/15 flex items-center justify-center text-accent transition-colors duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-darkest text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                </div>

                {/* Texte */}
                <div className="flex flex-col gap-2 flex-1 md:flex-none">
                  <h3 className="font-semibold text-base text-[#E8F4FA] leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-accent-off leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Appel à l'action */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent/8 border border-accent/20 text-accent text-sm font-medium">
            <GiftIcon />
            <span>Disponible dans votre espace après l'inscription</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReferralSection
