# Smart Civic Engagement Desk — Wireframe Prototype

Plain HTML / CSS / vanilla JavaScript wireframe for a local government civic engagement and loyalty platform.

## File Structure

```
CitizenApp/
├── index.html                     # Login / entry page
├── pages/
│   ├── agent-dashboard.html
│   ├── citizen-profile.html
│   ├── citizen-dashboard.html
│   ├── engagement-history.html
│   ├── programs.html
│   ├── insights.html
│   ├── knowledge-base.html
│   ├── cases.html
│   └── settings.html
├── styles/
│   ├── main.css                   # Tokens, resets, typography
│   ├── layout.css                 # App shell: header, sidebar, grid
│   └── components.css             # Cards, tables, modals, forms, badges
├── scripts/
│   ├── app.js                     # Bootstraps shared layout (header/sidebar inject)
│   ├── navigation.js              # Sidebar active state, mobile toggle
│   ├── modals.js                  # Generic modal open/close
│   ├── mock-data.js               # Mock citizens, cases, programs, etc.
│   ├── services.js                # Async mock service functions (API stubs)
│   ├── dashboard.js               # Agent dashboard page logic
│   ├── profile.js                 # Citizen profile page logic
│   ├── citizen-dashboard.js
│   ├── engagement.js
│   ├── programs.js
│   ├── insights.js
│   ├── knowledge.js
│   └── cases.js
└── assets/
    ├── icons/
    └── images/
```

## Run

Open `index.html` in a browser, or serve the folder with any static server:

```powershell
npx serve .
```

## Extension points

Search the codebase for `TODO:` markers — each indicates where to wire a real
backend service (auth, citizen profile, engagement, loyalty, programs, cases,
feedback, knowledge base).
