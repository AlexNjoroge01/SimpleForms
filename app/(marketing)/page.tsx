import Link from "next/link"
import {
  RiBuildingLine,
  RiCalendarEventLine,
  RiHandHeartLine,
  RiLayoutGridLine,
  RiQrCodeLine,
  RiSchoolLine,
  RiSmartphoneLine,
  RiStore2Line,
} from "@remixicon/react"

import { CardGrid, CTABanner, FeatureCard, StepCard } from "@/components/site/cards"
import { PhoneMockup } from "@/components/site/phone-mockup"
import { DarkSection, Section, SectionHeading } from "@/components/site/section"
import { Button } from "@/components/ui/button"
import { TEMPLATES } from "@/lib/templates"

const USE_CASES = [
  { icon: RiCalendarEventLine, label: "Events" },
  { icon: RiHandHeartLine, label: "Churches" },
  { icon: RiSchoolLine, label: "Schools" },
  { icon: RiStore2Line, label: "Shops" },
  { icon: RiBuildingLine, label: "Businesses" },
]

// Landing (§9.1): static and fully server-rendered, no client JavaScript.
export default function LandingPage() {
  return (
    <>
      <Section className="pt-8 md:pt-12">
        <div className="container-site grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <SectionHeading
              as="h1"
              eyebrow="Kenyan-first form builder"
              title="Beautiful forms, ready in minutes."
              intro="Start blank or from a Kenyan template, share by link or QR code, and export every response to CSV. +254 phones, KES amounts and all 47 counties built in."
            />

            <div className="flex flex-wrap items-center gap-6">
              <Button asChild size="lg">
                <Link href="/signup">Create a free form</Link>
              </Button>
              <Button asChild variant="arrow">
                <Link href="#templates">Browse templates</Link>
              </Button>
            </div>
            <p className="footnote -mt-4">Free while in beta · no card needed</p>
          </div>

          <PhoneMockup />
        </div>
      </Section>

      <Section id="features" className="pt-0 md:pt-0">
        <div className="container-site flex flex-col gap-12">
          <SectionHeading
            eyebrow="Why SimpleForms"
            title="Everything a Kenyan form needs"
            intro="From a Nairobi meetup to a school admission, forms that look great and work on every phone."
          />
          <CardGrid>
            <FeatureCard icon={RiLayoutGridLine} title="Ready-made templates">
              Ten Kenyan templates — events, orders, schools and more — or start blank and drag questions into place.
            </FeatureCard>
            <FeatureCard icon={RiSmartphoneLine} title="Beautiful on mobile">
              Fast, thumb-friendly forms with big tap targets, +254 phone formatting and KES amounts.
            </FeatureCard>
            <FeatureCard icon={RiQrCodeLine} title="Share anywhere">
              Copy a link, share on WhatsApp, or print a QR code for your event poster.
            </FeatureCard>
          </CardGrid>
          <ul className="flex flex-wrap justify-center gap-3" aria-label="Who uses SimpleForms">
            {USE_CASES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-pill bg-surface px-5 py-2.5 text-[15px] font-semibold text-ink shadow-card">
                <Icon className="size-[18px] text-brand" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
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
            <StepCard step={1} title="Pick a template or start blank">
              Start from one of ten Kenyan templates, or a blank form.
            </StepCard>
            <StepCard step={2} title="Publish and share">
              Get a short link and QR code the moment you publish.
            </StepCard>
            <StepCard step={3} title="Collect and export">
              Watch responses arrive and export them to Excel-ready CSV.
            </StepCard>
          </CardGrid>
        </div>
      </DarkSection>

      <Section id="templates">
        <div className="container-site flex flex-col gap-12">
          <SectionHeading
            eyebrow="Templates"
            title="Ten Kenyan templates, ready to go"
            intro="Event registration, order forms with M-Pesa, school admissions and more. Edit anything after."
          />
          <CardGrid>
            {TEMPLATES.slice(0, 6).map((t) => (
              <FeatureCard key={t.key} icon={t.icon} title={t.title}>
                {t.description}
              </FeatureCard>
            ))}
          </CardGrid>
        </div>
      </Section>

      <div className="container-site pb-24">
        <CTABanner href="/signup" cta="Create your first form">
          Free while in beta. Build your first form in under a minute.
        </CTABanner>
      </div>
    </>
  )
}
