'use client'

import React, { useState } from 'react'

type TabKey = 'mobile' | 'smarttv' | 'browser'

interface TabConfig {
  key: TabKey
  label: string
  icon: React.ReactNode
}

interface Step {
  title: React.ReactNode
  description?: string
  code?: string
}

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const TvIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const BrowserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const tabs: TabConfig[] = [
  { key: 'mobile', label: 'Mobile', icon: <PhoneIcon /> },
  { key: 'smarttv', label: 'Smart TV', icon: <TvIcon /> },
  { key: 'browser', label: 'Navigateur', icon: <BrowserIcon /> },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencieux
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copié !' : "Copier l'URL"}
      className={[
        'ml-2 p-1.5 rounded-md text-xs font-medium transition-all duration-200 shrink-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-accent/10 text-accent border border-accent/25 hover:bg-accent/20',
      ].join(' ')}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

function CodeBlock({ url }: { url: string }) {
  return (
    <div className="flex items-center bg-darkest border border-accent/15 rounded-xl px-4 py-3 text-sm font-mono">
      <span className="text-accent/80 select-all truncate flex-1">{url}</span>
      <CopyButton text={url} />
    </div>
  )
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <div className="shrink-0 w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold mt-0.5">
            {i + 1}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-sm text-[#E8F4FA] font-medium leading-snug">{step.title}</p>
            {step.description && (
              <p className="text-xs text-accent-off leading-relaxed">{step.description}</p>
            )}
            {step.code && <CodeBlock url={step.code} />}
          </div>
        </li>
      ))}
    </ol>
  )
}

interface TutorialSectionProps {
  id?: string
}

export function TutorialSection({ id }: TutorialSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('mobile')
  const jellyfinUrl = 'https://zflixtv.fr'

  const mobileSteps: Step[] = [
    {
      title: <>Téléchargez <span className="text-accent font-bold" style={{ textShadow: '0 0 12px rgba(var(--accent), 0.6)' }}>Jellyfin</span> sur iOS ou Android</>,
      description: "Disponible gratuitement sur l'App Store et Google Play.",
    },
    {
      title: "Entrez l'URL du serveur ZFlix",
      code: jellyfinUrl,
    },
    {
      title: 'Connectez-vous avec vos identifiants ZFlix',
      description:
        "Utilisez votre nom d'utilisateur et le mot de passe choisis lors de votre inscription.",
    },
  ]

  const smarttvSteps: Step[] = [
    {
      title: <>Recherchez <span className="text-accent font-bold" style={{ textShadow: '0 0 12px rgba(var(--accent), 0.6)' }}>&ldquo;Jellyfin&rdquo;</span> sur votre TV</>,
      description:
        'Disponible sur Samsung Smart TV, LG webOS, Android TV et Nvidia Shield.',
    },
    {
      title: 'Configurez le serveur',
      description: "Dans les paramètres de l'application, ajoutez un nouveau serveur.",
      code: jellyfinUrl,
    },
    {
      title: 'Profitez de vos contenus',
      description:
        "Connectez-vous avec vos identifiants et accédez à l'ensemble des contenus ZFlix.",
    },
  ]

  const browserSteps: Step[] = [
    {
      title: 'Ouvrez votre navigateur préféré',
      description: 'Compatible avec Chrome, Firefox, Safari et Edge.',
    },
    {
      title: "Accédez à l'interface ZFlix",
      code: jellyfinUrl,
    },
    {
      title: 'Connectez-vous et profitez',
      description:
        'Entrez vos identifiants ZFlix pour accéder immédiatement à vos contenus.',
    },
  ]

  const tabContent: Record<TabKey, Step[]> = {
    mobile: mobileSteps,
    smarttv: smarttvSteps,
    browser: browserSteps,
  }

  return (
    <section id={id} className="relative py-20 md:py-28 overflow-hidden" aria-labelledby="tutoriels-heading"
      style={{ background: 'linear-gradient(180deg, rgb(var(--darkest)) 0%, rgba(10,8,30,1) 50%, rgb(var(--darkest)) 100%)' }}
    >
      {/* Orbes lumineux d'ambiance */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 500,
          top: '-10%', left: '-10%',
          background: 'radial-gradient(circle, rgba(var(--accent-purple), 0.07) 0%, transparent 65%)',
          animation: 'orb-drift 20s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400,
          bottom: '-10%', right: '-8%',
          background: 'radial-gradient(circle, rgba(var(--accent), 0.06) 0%, transparent 65%)',
          animation: 'orb-drift 25s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 grid-lines opacity-50 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div className="text-center mb-10 md:mb-14">

          {/* Pill glow — même style que le Hero */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide mb-6 border-glow"
            style={{ background: 'rgba(var(--accent), 0.06)', color: 'rgb(var(--accent))' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Disponible sur tous vos appareils
          </div>

          <h2 id="tutoriels-heading" className="font-bold text-2xl sm:text-3xl md:text-4xl text-[#E8F4FA] mb-4">
            Commencez en{' '}
            <span className="text-gradient">3 étapes</span>
          </h2>
          <p className="text-accent-off text-base max-w-xl mx-auto">
            Configurez Jellyfin en quelques minutes et profitez de ZFlix sur tous vos écrans.
          </p>
        </div>

        {/* Onglets de plateforme */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-8 w-fit mx-auto"
          style={{
            background: 'rgba(var(--dark-apparent), 0.6)',
            border: '1px solid rgba(var(--accent), 0.12)',
            boxShadow: '0 0 30px rgba(var(--accent), 0.05)',
          }}
          role="tablist"
          aria-label="Sélectionnez votre appareil"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tab-panel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                activeTab === tab.key
                  ? 'text-accent'
                  : 'text-accent-off hover:text-[#E8F4FA] hover:bg-dark-highlight/40',
              ].join(' ')}
              style={activeTab === tab.key ? {
                background: 'rgba(var(--accent), 0.12)',
                boxShadow: '0 0 20px rgba(var(--accent), 0.15)',
              } : {}}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panneaux d'onglets */}
        {tabs.map((tab) => (
          <div
            key={tab.key}
            id={`tab-panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.key}`}
            className={activeTab !== tab.key ? 'hidden' : ''}
            style={{
              background: 'rgba(var(--dark-apparent), 0.7)',
              border: '1px solid rgba(var(--accent), 0.12)',
              borderRadius: '1rem',
              padding: '2rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 40px rgba(var(--accent), 0.06), 0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <StepList steps={tabContent[tab.key]} />
          </div>
        ))}

        {/* Conseil */}
        <div
          className="mt-8 p-4 rounded-xl flex items-start gap-3"
          style={{
            background: 'rgba(var(--accent), 0.05)',
            border: '1px solid rgba(var(--accent), 0.18)',
            boxShadow: '0 0 20px rgba(var(--accent), 0.06)',
          }}
        >
          <svg
            className="w-5 h-5 text-accent shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-accent-off leading-relaxed">
            Vos identifiants Jellyfin sont identiques à ceux de votre compte ZFlix.
            En cas de problème, contactez-nous via votre espace client.
          </p>
        </div>
      </div>
    </section>
  )
}

export default TutorialSection
