import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { PricingSection } from '@/components/home/PricingSection'
import { ReferralSection } from '@/components/home/ReferralSection'
import { TutorialSection } from '@/components/home/TutorialSection'

export default function HomePage() {
  return (
    <>
      {/* Noise texture overlay */}
      <div className="noise-bg" aria-hidden="true" />

      <Navbar />
      <HeroSection />
      <PricingSection id="tarifs" />
      <TutorialSection id="tutoriels" />
      <ReferralSection id="parrainage" />
      <Footer />
    </>
  )
}
