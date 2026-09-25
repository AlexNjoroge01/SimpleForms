import Link from "next/link"
import { RiMagicLine, RiQrCodeLine, RiSmartphoneLine } from "@remixicon/react"

import { CardGrid, CTABanner, FeatureCard, StepCard } from "@/components/site/cards"
import { DarkPanel } from "@/components/site/dark-form"
import { DarkSection, Section, SectionHeading } from "@/components/site/section"
import { Button } from "@/components/ui/button"

// Phase 0 landing shell — the full landing (§9.1) is built in Phase 9.
export default function LandingPage() {
  return (
    <>
      <Section className="pt-12 md:pt-16">
        <div className="container-site">
          <SectionHeading
            as="h1"
            eyebrow="Kenyan-first form builder"
            title="Describe your form. We’ll build it."
            intro="Create beautiful, mobile-first forms with AI, share them by link or QR code, and export every response to CSV."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild variant="arrow">
              <Link href="#how-it-works">See how it works </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section id="features" className="pt-0 md:pt-0">
        <div className="container-site">
          <CardGrid>
            <FeatureCard icon={RiMagicLine} title="Built by AI">
              Tell us what you need and get a ready-to-share form in seconds.
            </FeatureCard>
            <FeatureCard icon={RiSmartphoneLine} title="Beautiful on mobile">
              Fast, thumb-friendly forms with +254 phone and county fields built in.
            </FeatureCard>
            <FeatureCard icon={RiQrCodeLine} title="Share anywhere">
              Copy a link, send on WhatsApp, or print a QR code for your event.
            </FeatureCard>
          </CardGrid>
        </div>
      </Section>

      <DarkSection id="how-it-works" className="section-y">
        <div className="container-site">
          <SectionHeading
            eyebrow="How it works"
            title="From idea to responses in three steps"
            intro="No design skills needed. Your forms work on every phone."
          />
          <CardGrid className="mt-12">
            <StepCard step={1} title="Describe or pick a template">
              Start with AI, one of ten Kenyan templates, or a blank form.
            </StepCard>
            <StepCard step={2} title="Publish and share">
              Get a short link and QR code the moment you publish.
            </StepCard>
            <StepCard step={3} title="Collect and export">
              Watch responses arrive and export them to Excel-ready CSV.
            </StepCard>
          </CardGrid>
          <DarkPanel className="mt-12 max-w-xl">
            <p className="form-label">Coming soon</p>
            <p className="mt-2">The AI prompt box lands here in Phase 8.</p>
          </DarkPanel>
        </div>
      </DarkSection>

      <div className="container-site relative z-10 -mt-12 pb-24">
        <CTABanner href="/signup" cta="Create your first form">
          Free while in beta. Build your first form in under a minute.
        </CTABanner>
      </div>
    </>
  )
}
