export const APP_NAME = "Drift";
export const APP_TAGLINE = "The identity & authorization mesh for AI agents";
export const APEX_AGENT_NAME = "Apex";

export const NAV_ITEMS = [
  { label: "Overview",     href: "/",             icon: "LayoutDashboard" },
  { label: "Agents",       href: "/agents",        icon: "Bot" },
  { label: "Ledger",       href: "/ledger",        icon: "ScrollText" },
  { label: "Consent",      href: "/consent",       icon: "ShieldCheck" },
  { label: "Settings",     href: "/settings",      icon: "Settings" },
] as const;

export const SCOPE_ACTIONS = ["read","write","delete","execute","charge","send","book","submit","approve"] as const;

export const DEMO_SCOPES = [
  { resource: "flights",  action: "book",   description: "Search and book flights" },
  { resource: "hotels",   action: "book",   description: "Search and book hotels" },
  { resource: "card",     action: "charge", description: "Charge corporate card" },
  { resource: "calendar", action: "read",   description: "Read calendar" },
  { resource: "email",    action: "send",   description: "Send notification emails" },
  { resource: "slack",    action: "send",   description: "Send Slack messages" },
];

export const STEP_UP_REQUIRED_SCOPES = ["card:charge", "delete:*", "submit:*"];
