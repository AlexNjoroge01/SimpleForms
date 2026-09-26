import {
  RiBriefcaseLine,
  RiCalendarCheckLine,
  RiChatSmile2Line,
  RiContactsBookLine,
  RiIdCardLine,
  RiLineChartLine,
  RiMailLine,
  RiSchoolLine,
  RiShoppingBag3Line,
  RiSurveyLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { assignIds, type FieldInput } from "@/lib/fields/assign-ids"
import type { Field, FieldConfig, FieldType, FormSettings } from "@/lib/fields/types"

// Ten Kenyan templates (Blueprint §8). Static definitions; using one clones it
// into a new DRAFT with fresh field ids.

export type Template = {
  key: string
  title: string
  description: string
  icon: RemixiconComponentType
  fields: FieldInput[]
  settings?: Partial<Pick<FormSettings, "submitButtonText" | "successMessage">>
}

type Extra = { placeholder?: string; description?: string; config?: FieldConfig; options?: string[] }

function q(type: FieldType, label: string, required: boolean, extra: Extra = {}): FieldInput {
  const { options, ...rest } = extra
  return { type, label, required, ...rest, ...(options ? { options: options.map((label) => ({ label })) } : {}) }
}

// Common questions with Kenyan defaults.
const fullName = (label = "Full name") => q("short_text", label, true, { placeholder: "e.g. John Kamau" })
const email = (required = true) => q("email", "Email address", required, { placeholder: "john@example.co.ke" })
const phone = (label = "Phone number", required = true) =>
  q("phone", label, required, { placeholder: "712 345 678", config: { defaultCountry: "KE" } })
const county = (label = "County", required = true) =>
  q("dropdown", label, required, { placeholder: "Select your county", config: { preset: "kenya_counties" } })

export const TEMPLATES: Template[] = [
  {
    key: "event-registration",
    title: "Event registration",
    description: "Sign-ups for meetups, conferences, church events and workshops.",
    icon: RiCalendarCheckLine,
    fields: [
      fullName(),
      email(),
      phone(),
      q("short_text", "Organisation", false, { placeholder: "Company, school or church" }),
      county("Where are you coming from?", false),
      q("single_choice", "Ticket type", true, { options: ["Regular", "VIP", "Student"] }),
      q("multiple_choice", "How did you hear about us?", false, {
        options: ["WhatsApp", "X (Twitter)", "Facebook", "Instagram", "A friend"],
        config: { allowOther: true },
      }),
      q("long_text", "Dietary or accessibility needs", false, { placeholder: "Let us know how we can help" }),
    ],
    settings: { submitButtonText: "Register", successMessage: "You’re registered! We’ll send event details to your email." },
  },
  {
    key: "customer-feedback",
    title: "Customer feedback",
    description: "Hear what customers think about your shop, restaurant or service.",
    icon: RiChatSmile2Line,
    fields: [
      q("short_text", "Your name", false, { placeholder: "Optional" }),
      q("single_choice", "How was your experience today?", true, { options: ["Excellent", "Good", "Average", "Poor"] }),
      q("multiple_choice", "What did you like?", false, {
        options: ["Service", "Quality", "Price", "Speed", "Cleanliness"],
        config: { allowOther: true },
      }),
      q("long_text", "What could we do better?", false),
      q("yes_no", "Would you recommend us to a friend?", true),
      q("yes_no", "May we contact you about your feedback?", false),
      phone("Phone number (if we may contact you)", false),
    ],
    settings: { submitButtonText: "Send feedback", successMessage: "Asante! Your feedback helps us serve you better." },
  },
  {
    key: "job-application",
    title: "Job application",
    description: "Collect applications with contact details, experience and a CV upload.",
    icon: RiBriefcaseLine,
    fields: [
      fullName(),
      email(),
      phone(),
      county("County of residence"),
      q("short_text", "Position applied for", true, { placeholder: "e.g. Sales Executive" }),
      q("number", "Years of relevant experience", true, { placeholder: "0", config: { min: 0, max: 50 } }),
      q("number", "Expected monthly salary", false, { placeholder: "50,000", config: { currency: "KES", min: 0 } }),
      q("date", "Earliest start date", false),
      q("file_upload", "Upload your CV", true, { description: "PDF only, up to 5 MB.", config: { accept: "pdf", maxSizeMB: 5 } }),
      q("long_text", "Why are you a good fit for this role?", false, { config: { maxLength: 2000 } }),
    ],
    settings: { submitButtonText: "Submit application", successMessage: "Thank you for applying. We’ll be in touch if you’re shortlisted." },
  },
  {
    key: "order-form",
    title: "Order form",
    description: "Take orders with quantities, KES amounts, county and delivery notes.",
    icon: RiShoppingBag3Line,
    fields: [
      fullName(),
      phone(),
      q("dropdown", "Product", true, {
        placeholder: "Choose a product",
        options: ["Maize flour 2kg", "Cooking oil 1L", "Sugar 2kg", "Rice 5kg", "Tea leaves 500g"],
      }),
      q("number", "Quantity", true, { placeholder: "1", config: { min: 1, max: 1000 } }),
      q("number", "Amount paid", false, { placeholder: "1,500", description: "If you’ve already paid.", config: { currency: "KES", min: 0 } }),
      q("single_choice", "Payment method", true, { options: ["M-Pesa", "Cash on delivery", "Bank transfer"] }),
      county("Delivery county"),
      q("short_text", "Delivery location", true, { placeholder: "Estate, street or landmark" }),
      q("date", "Preferred delivery date", false),
      q("long_text", "Delivery notes", false, { placeholder: "Gate code, best time to call, etc." }),
    ],
    settings: { submitButtonText: "Place order", successMessage: "Order received! We’ll call you to confirm delivery." },
  },
  {
    key: "contact-form",
    title: "Contact form",
    description: "A simple way for people to reach you.",
    icon: RiMailLine,
    fields: [
      fullName("Your name"),
      email(),
      phone("Phone number", false),
      q("dropdown", "Subject", true, { options: ["General enquiry", "Support", "Partnership", "Media"] }),
      q("long_text", "Message", true, { placeholder: "How can we help?" }),
    ],
    settings: { submitButtonText: "Send message", successMessage: "Thanks for reaching out — we’ll reply within one working day." },
  },
  {
    key: "school-registration",
    title: "School registration",
    description: "Admissions for learners, with class, parent phone and county.",
    icon: RiSchoolLine,
    fields: [
      fullName("Learner’s full name"),
      q("date", "Date of birth", true),
      q("single_choice", "Gender", true, { options: ["Female", "Male"] }),
      q("dropdown", "Class joining", true, {
        options: ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      }),
      q("short_text", "Previous school", false),
      fullName("Parent or guardian name"),
      phone("Parent or guardian phone"),
      email(false),
      county("County of residence"),
      q("yes_no", "Will the learner need school transport?", true),
      q("long_text", "Medical conditions or allergies", false, { placeholder: "Leave blank if none" }),
    ],
    settings: { submitButtonText: "Register learner", successMessage: "Registration received. The school office will contact you." },
  },
  {
    key: "service-booking",
    title: "Service booking",
    description: "Appointments for salons, clinics, garages and home services.",
    icon: RiContactsBookLine,
    fields: [
      fullName(),
      phone(),
      q("single_choice", "Service", true, { options: ["Haircut", "Braiding", "Manicure", "Pedicure", "Massage"] }),
      q("date", "Preferred date", true),
      q("dropdown", "Preferred time", true, { options: ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Evening (4pm – 7pm)"] }),
      q("yes_no", "Is this your first visit?", false),
      q("long_text", "Anything we should know?", false),
    ],
    settings: { submitButtonText: "Book now", successMessage: "Booking received! We’ll send a confirmation by SMS." },
  },
  {
    key: "employee-information",
    title: "Employee information",
    description: "Onboard staff: ID, KRA PIN, statutory numbers and next of kin.",
    icon: RiIdCardLine,
    fields: [
      fullName(),
      q("short_text", "National ID number", true, { placeholder: "12345678", config: { maxLength: 10 } }),
      q("short_text", "KRA PIN", true, { placeholder: "A012345678Z", config: { maxLength: 11 } }),
      email(),
      phone(),
      q("date", "Date of birth", true),
      q("short_text", "Job title", true),
      q("date", "Start date", true),
      q("short_text", "SHA number", false),
      q("short_text", "NSSF number", false),
      county("County of residence"),
      fullName("Next of kin name"),
      phone("Next of kin phone"),
    ],
    settings: { submitButtonText: "Submit details", successMessage: "Thank you. HR has received your details." },
  },
  {
    key: "product-survey",
    title: "Product survey",
    description: "Understand how people use your product and what they’d pay.",
    icon: RiSurveyLine,
    fields: [
      q("single_choice", "How often do you use our product?", true, { options: ["Daily", "Weekly", "Monthly", "Rarely"] }),
      q("multiple_choice", "What matters most to you?", true, {
        options: ["Price", "Quality", "Availability", "Packaging", "Customer service"],
        config: { maxSelect: 3 },
      }),
      q("single_choice", "How satisfied are you overall?", true, {
        options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      }),
      q("number", "What’s a fair price for it?", false, { placeholder: "500", config: { currency: "KES", min: 0 } }),
      county("Where do you live?", false),
      q("long_text", "Any suggestions?", false),
      email(false),
    ],
    settings: { submitButtonText: "Submit survey", successMessage: "Asante sana for taking part!" },
  },
  {
    key: "lead-generation",
    title: "Lead generation",
    description: "Capture interested prospects and how they’d like to be contacted.",
    icon: RiLineChartLine,
    fields: [
      fullName(),
      q("short_text", "Company", false),
      email(),
      phone(),
      q("multiple_choice", "What are you interested in?", true, { options: ["Product demo", "Pricing", "Partnership", "Support"] }),
      q("dropdown", "Budget", false, {
        options: ["Below KES 50,000", "KES 50,000 – 200,000", "KES 200,000 – 1M", "Above KES 1M"],
      }),
      q("single_choice", "Best way to reach you", true, { options: ["Phone call", "WhatsApp", "Email"] }),
      county("County", false),
    ],
    settings: { submitButtonText: "Get in touch", successMessage: "Thanks! Someone from our team will contact you shortly." },
  },
]

export function getTemplate(key: string) {
  return TEMPLATES.find((t) => t.key === key)
}

/** A fresh copy of the template's fields with new ids. */
export function instantiateTemplate(t: Template): Field[] {
  return assignIds(structuredClone(t.fields))
}
