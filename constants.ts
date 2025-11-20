
import { BrandProfile, SlideContent } from './types';

export const MOCK_BRAND_PROFILE: BrandProfile = {
  name: "Atlassian",
  primaryColor: "#0052CC", // Atlassian Blue
  secondaryColor: "#253858", // Neutral Dark
  fontFamily: "sans-serif",
  logoStyle: "modern",
  keywords: ["Agile", "Teamwork", "Open", "Blue"]
};

// Updated messaging for Sales/Presales context - adapting EXISTING assets
export const DEMO_PROMPT = "tailor our sales deck for the upcoming meeting with Atlassion";

export const PLAN_STEPS = [
  {
    title: "Indexing Internal Library",
    description: "Scanning 400+ slides in 'Q3_Master_Deck.pptx' for layouts."
  },
  {
    title: "Injecting Prospect Context",
    description: "Connecting Salesforce opportunity 'Atlassian' (Stage: Security Review)."
  },
  {
    title: "Extracting Brand Tokens",
    description: "Enforcing 'Atlassian Sans' and primary color #0052CC."
  },
  {
    title: "Adapting Architecture Slide",
    description: "Reflowing 'Slide 12' to highlight data ingestion."
  },
  {
    title: "Synthesizing Pain Points",
    description: "Mapping discovery notes to solution pillars."
  },
  {
    title: "Visualizing Trust",
    description: "Transforming text requirements into Compliance Grids."
  }
];

export const INITIAL_SLIDES: SlideContent[] = [
  {
    title: "System Architecture",
    type: "architecture",
    content: [
      "Data Ingestion",
      "Processing Layer", 
      "Analytics Output"
    ] 
  },
  {
    title: "Operational Impact",
    type: "impact",
    content: [
      "Problem: Fragmented data silos across Jira & Confluence",
      "Latency: 24-48 hour delay in executive reporting",
      "Overhead: 20hrs/week manual data consolidation"
    ]
  },
  {
    title: "Enterprise Security",
    type: "security",
    content: [
      "SOC2 Type II Compliance",
      "ISO 27001 Certified",
      "GDPR Ready",
      "End-to-End Encryption"
    ]
  }
];