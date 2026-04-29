/* =========================================================
   Mock data — civic engagement domain
   Replace with real API responses once backend is wired up.
   ========================================================= */

window.MOCK = (function () {
  const citizens = [
    {
      id: "C-10293",
      name: "Maria Alvarez",
      email: "maria.alvarez@example.com",
      phone: "(555) 218-4477",
      address: "412 Oak St, District 4",
      tier: "gold",
      points: 2840,
      since: "2022-03-14",
      preferredChannel: "Email",
      languages: ["English", "Spanish"],
      satisfaction: 4.6,
      tags: ["Volunteer", "Parks Program"],
      badges: ["Volunteer Champion", "Feedback Contributor", "3-Year Member"],
    },
    {
      id: "C-10488",
      name: "Daniel Okafor",
      email: "d.okafor@example.com",
      phone: "(555) 882-1109",
      address: "88 Lincoln Ave, District 2",
      tier: "silver",
      points: 1240,
      since: "2023-07-02",
      preferredChannel: "SMS",
      languages: ["English"],
      satisfaction: 4.1,
      tags: ["Recycling Program"],
      badges: ["Eco Steward"],
    },
    {
      id: "C-10551",
      name: "Priya Natarajan",
      email: "priya.n@example.com",
      phone: "(555) 661-7421",
      address: "27 Maple Ct, District 7",
      tier: "platinum",
      points: 5320,
      since: "2020-11-19",
      preferredChannel: "Phone",
      languages: ["English", "Tamil"],
      satisfaction: 4.9,
      tags: ["Civic Council", "Mentor"],
      badges: ["Civic Leader", "Mentor", "5-Year Member"],
    },
    {
      id: "C-10612",
      name: "James Whitaker",
      email: "j.whitaker@example.com",
      phone: "(555) 240-9988",
      address: "904 Elm Pl, District 1",
      tier: "bronze",
      points: 320,
      since: "2025-01-08",
      preferredChannel: "Email",
      languages: ["English"],
      satisfaction: 3.4,
      tags: ["New Resident"],
      badges: ["New Resident"],
    },
  ];

  // Loyalty tier thresholds (used for progress bars and tier-up logic)
  const tiers = [
    { id: "bronze",   label: "Bronze",   min: 0,    next: 1000 },
    { id: "silver",   label: "Silver",   min: 1000, next: 2500 },
    { id: "gold",     label: "Gold",     min: 2500, next: 4000 },
    { id: "platinum", label: "Platinum", min: 4000, next: null },
  ];

  const engagementEvents = [
    { id: "E-9001", citizenId: "C-10293", date: "2026-04-22", type: "Volunteer", channel: "In-person", points: 120, description: "Park cleanup — Riverside" },
    { id: "E-9002", citizenId: "C-10293", date: "2026-04-10", type: "Feedback",  channel: "Web",       points: 30,  description: "Submitted survey on transit" },
    { id: "E-9003", citizenId: "C-10293", date: "2026-03-28", type: "Program",   channel: "In-person", points: 200, description: "Joined Adult Literacy Program" },
    { id: "E-9004", citizenId: "C-10293", date: "2026-03-15", type: "Service",   channel: "Phone",     points: 10,  description: "Pothole report resolved" },
    { id: "E-9005", citizenId: "C-10488", date: "2026-04-18", type: "Program",   channel: "Web",       points: 150, description: "Enrolled in Recycling Rewards" },
    { id: "E-9006", citizenId: "C-10551", date: "2026-04-25", type: "Volunteer", channel: "In-person", points: 250, description: "Mentor session — Youth Council" },
  ];

  const interactions = [
    { id: "I-1", citizenId: "C-10293", agent: "S. Park", channel: "Phone",   date: "2026-04-26 10:14", topic: "Program inquiry",          status: "Resolved",     rated: false },
    { id: "I-2", citizenId: "C-10488", agent: "S. Park", channel: "Email",   date: "2026-04-26 09:42", topic: "Account update",           status: "In progress",  rated: false },
    { id: "I-3", citizenId: "C-10612", agent: "M. Liu",  channel: "Walk-in", date: "2026-04-25 16:05", topic: "New resident services",    status: "Resolved",     rated: false },
    { id: "I-4", citizenId: "C-10551", agent: "S. Park", channel: "Phone",   date: "2026-04-25 14:21", topic: "Volunteer scheduling",     status: "Resolved",     rated: true  },
  ];

  const ratings = [
    { id: "RT-1", citizenId: "C-10293", agent: "S. Park", date: "2026-04-22", channel: "Survey", score: 5, comment: "Friendly and quick — thank you!" },
    { id: "RT-2", citizenId: "C-10488", agent: "M. Liu",  date: "2026-04-15", channel: "IVR",    score: 3, comment: "Took longer than expected." },
    { id: "RT-3", citizenId: "C-10551", agent: "S. Park", date: "2026-04-10", channel: "Survey", score: 5, comment: "Excellent program experience." },
    { id: "RT-4", citizenId: "C-10612", agent: "K. Diaz", date: "2026-04-08", channel: "Email",  score: 2, comment: "Confusing forms during sign-up." },
  ];

  const cases = [
    { id: "CASE-2041", citizenId: "C-10488", title: "Missed recycling pickup",      priority: "Medium", status: "Open",       opened: "2026-04-22", assignedTo: "S. Park" },
    { id: "CASE-2039", citizenId: "C-10612", title: "Address change verification",  priority: "Low",    status: "In review",  opened: "2026-04-21", assignedTo: "M. Liu" },
    { id: "CASE-2032", citizenId: "C-10293", title: "Program scholarship request",  priority: "High",   status: "Escalated",  opened: "2026-04-18", assignedTo: "Supervisor" },
    { id: "CASE-2025", citizenId: "C-10551", title: "Civic council nomination",     priority: "Low",    status: "Resolved",   opened: "2026-04-12", assignedTo: "S. Park" },
  ];

  const programs = [
    { id: "P-01", name: "Adult Literacy Program",     category: "Education", points: 200, eligibility: "All residents 18+", description: "Weekly evening classes at branch libraries." },
    { id: "P-02", name: "Park Stewardship Volunteer", category: "Environment", points: 150, eligibility: "All residents",   description: "Monthly cleanup and tree-planting events." },
    { id: "P-03", name: "Youth Mentor Network",       category: "Community", points: 250, eligibility: "Background check required", description: "Mentor youth ages 12–17 in academic and life skills." },
    { id: "P-04", name: "Recycling Rewards",          category: "Environment", points: 100, eligibility: "Residential utility account", description: "Earn points for verified curbside recycling." },
    { id: "P-05", name: "Citizen Budget Workshops",   category: "Civic", points: 80, eligibility: "All residents",          description: "Quarterly workshops on the city budget cycle." },
    { id: "P-06", name: "Senior Wellness Check-ins",  category: "Health", points: 120, eligibility: "Residents 65+ or caregivers", description: "Phone-based wellness program with monthly outreach." },
  ];

  const recommendations = [
    { id: "R-1", citizenId: "C-10293", title: "Invite to Youth Mentor Network", why: "Active volunteer with 3+ events; matches mentor profile.", action: "Enroll" },
    { id: "R-2", citizenId: "C-10293", title: "Send loyalty milestone thank-you", why: "Reached 2,500 points this quarter.", action: "Send Recognition" },
    { id: "R-3", citizenId: "C-10488", title: "Offer service credit",          why: "Open case > 3 days; satisfaction trending down.", action: "Apply Credit" },
  ];

  const ratings_REMOVED = null;

  const knowledgeArticles = [
    { id: "KB-101", title: "Loyalty tiers — eligibility & benefits", category: "Loyalty",   updated: "2026-04-01", excerpt: "Explains Bronze through Platinum requirements and perks." },
    { id: "KB-102", title: "How to enroll a citizen in a program",  category: "Process",   updated: "2026-03-12", excerpt: "Step-by-step enrollment workflow including consent capture." },
    { id: "KB-103", title: "Escalation policy for service issues",  category: "Policy",    updated: "2026-02-28", excerpt: "When and how to route cases to supervisors." },
    { id: "KB-104", title: "Recycling Rewards — common questions",  category: "Programs",  updated: "2026-04-18", excerpt: "FAQ for the curbside recycling rewards program." },
    { id: "KB-105", title: "Recognizing loyalty milestones",        category: "Loyalty",   updated: "2026-03-30", excerpt: "Templates and best practices for thank-you messages." },
  ];

  const insights = {
    activeCitizens: 12480,
    avgSatisfaction: 4.3,
    avgResolutionHours: 18.6,
    repeatParticipationRate: 0.62,
    lowSatisfactionAlerts: [
      { citizenId: "C-10612", lastScore: 2, channel: "Email" },
      { citizenId: "C-10488", lastScore: 3, channel: "IVR" },
    ],
    agentPerformance: [
      { agent: "S. Park", handled: 142, avgRating: 4.6, escalations: 3 },
      { agent: "M. Liu",  handled: 118, avgRating: 4.2, escalations: 6 },
      { agent: "K. Diaz", handled: 96,  avgRating: 3.9, escalations: 9 },
    ],
  };

  return {
    citizens,
    tiers,
    engagementEvents,
    interactions,
    cases,
    programs,
    recommendations,
    ratings,
    knowledgeArticles,
    insights,
    // recognitions sent to citizens (e.g., thank-yous, milestone messages)
    recognitions: [
      { id: "REC-1", citizenId: "C-10293", date: "2026-04-23", from: "S. Park", channel: "Email",
        message: "Thank you for reaching 2,500+ points and joining the Adult Literacy Program." },
      { id: "REC-2", citizenId: "C-10551", date: "2026-04-12", from: "Mayor's Office", channel: "Mailed letter",
        message: "Recognition of 5 years of civic mentorship." },
    ],
  };
})();
