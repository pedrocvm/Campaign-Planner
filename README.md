# 📊 Campaign Budget Optimizer

A full-stack application that helps campaign managers optimize their advertising budget distribution across multiple channels to maximize reach and engagement.

![Tech Stack](https://img.shields.io/badge/Backend-NestJS-red?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Frontend-Angular%2017-purple?style=flat-square)
![Tech Stack](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20.x)
- npm 9+

### Running the Application

**1. Clone and navigate to the project:**

```bash
cd campaign-budget-optimizer
```

**2. Start the Backend (NestJS):**

```bash
cd backend
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api/docs`

**3. Start the Frontend (Angular):**

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:4200`

---

## 📋 Features

- **Budget Input Form**: Enter total budget, campaign duration, and optimization goal
- **Three Optimization Goals**: Reach, Engagement, or Balanced
- **Real-time Calculation**: Instant budget distribution across Video, Display, and Social channels
- **Detailed Metrics**: Estimated impressions, reach, CPM, and daily breakdown
- **Channel Insights**: Contextual recommendations for each channel
- **Dark/Light Theme Toggle**: Switch between dark and light modes with preference persistence
- **User-Friendly Language**: Designed for marketing professionals, not developers
- **Responsive Design**: Works on desktop and mobile devices
- **Copy & Print**: Export results to clipboard or print

---

## 🎯 Assumptions Made

### Business Assumptions

| Assumption | Rationale |
|------------|-----------|
| **3 fixed channels** (Video, Display, Social) | Based on the problem description. Extensible architecture allows adding more. |
| **CPM values are fixed** | Used industry-average CPMs: Video ($20), Display ($7.50), Social ($5). In production, these would be configurable or fetched from real inventory systems. |
| **Reach factor applied** | Impressions ≠ unique users. Applied reach factors (65%, 45%, 55%) to estimate unique reach from impressions. |
| **No authentication required** | MVP focused on functionality. Campaign managers need quick access during client calls. |
| **Stateless calculations** | No persistence required for MVP. Each calculation is independent. |

### Technical Assumptions

| Assumption | Rationale |
|------------|-----------|
| **Single-tenant design** | Simplified for demo. Production would need multi-tenancy. |
| **No historical data** | Algorithm uses static CPM values. Production would use historical campaign performance. |
| **Browser-based only** | No mobile app or desktop client needed for this use case. |

---

## 🔧 Design Decisions

### Algorithm: Efficiency-Based Distribution

The budget distribution algorithm uses a **weighted efficiency scoring** approach:

```
For each channel:
  1. Calculate base efficiency = (1000 / CPM) × reach_factor
  2. Apply goal-based weights:
     - REACH: weight × reach_efficiency
     - ENGAGEMENT: weight × engagement_quality
     - BALANCED: average of both
  3. Normalize scores to percentages
  4. Apply min/max constraints (default: 10-60%)
  5. Redistribute excess proportionally
```

**Why this approach?**
- Simple and explainable (important for stakeholder buy-in)
- Predictable results (same inputs = same outputs)
- Configurable via goal selection
- No ML complexity for MVP

### API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns/calculate` | POST | Calculate budget distribution |
| `/api/campaigns/channels` | GET | Get available channel info |
| `/api/campaigns/health` | GET | Health check |

**Why POST for calculate?**
- Complex input parameters
- Easier to extend with additional fields
- Follows REST conventions for operations

### Frontend Architecture

- **Standalone Components** (Angular 17): Modern approach, smaller bundle size
- **Reactive Forms**: Better validation, type safety
- **RxJS State Management**: Simple BehaviorSubjects instead of NgRx (appropriate for this scale)
- **CSS Variables**: Consistent theming, easy to customize

---

## 🚧 Decisions Postponed / Left Flexible

| Decision | Current State | Future Consideration |
|----------|---------------|----------------------|
| **Database** | None (stateless) | PostgreSQL/MongoDB for campaign history |
| **Authentication** | None | OAuth2/JWT with role-based access |
| **Dynamic CPMs** | Static values | Real-time inventory pricing API |
| **Channel Config** | Hardcoded | Admin UI for channel management |
| **Caching** | None | Redis for frequently accessed data |
| **Testing** | Minimal | Full unit/integration test coverage |

---

## 🔮 Production Improvements

### Architecture Changes

1. **Add Database Layer**
   - Store campaign calculations for historical analysis
   - Track actual vs. predicted performance
   - PostgreSQL with TypeORM/Prisma

2. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access (admin, manager, viewer)
   - Audit logging

3. **Real-time Pricing**
   - Integration with DSP APIs for live CPM data
   - Dynamic channel availability
   - Inventory forecasting

### Technical Improvements

1. **Testing Suite**
   - Unit tests for algorithm edge cases
   - E2E tests with Cypress/Playwright
   - API contract testing

2. **Performance**
   - Response caching (Redis)
   - Rate limiting
   - Request queuing for heavy calculations

3. **Monitoring & Observability**
   - Structured logging (Winston)
   - APM integration (DataDog, New Relic)
   - Custom metrics (calculation time, accuracy tracking)

4. **Deployment**
   - Docker containers
   - Kubernetes orchestration
   - CI/CD pipeline (GitHub Actions)
   - Environment-based configuration

### Feature Enhancements

1. **Advanced Algorithm**
   - ML-based optimization using historical performance
   - A/B testing recommendations
   - Seasonal adjustment factors

2. **Collaboration Features**
   - Save and share calculations
   - Comments and annotations
   - Team workspaces

3. **Reporting**
   - Export to PDF/Excel
   - Scheduled reports
   - Performance tracking dashboard

---

## 📁 Project Structure

```
campaign-budget-optimizer/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── campaign/           # Campaign module
│   │   │   ├── dto/            # Data transfer objects
│   │   │   ├── campaign.controller.ts
│   │   │   ├── campaign.service.ts
│   │   │   └── campaign.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # UI components
│   │   │   ├── models/         # TypeScript interfaces
│   │   │   ├── services/       # API services
│   │   │   └── app.component.ts
│   │   ├── styles.css          # Global styles
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
└── README.md
```

---

## 🧪 API Examples

### Calculate Budget Distribution

**Request:**
```bash
curl -X POST http://localhost:3000/api/campaigns/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 10000,
    "durationDays": 30,
    "goal": "balanced"
  }'
```

**Response:**
```json
{
  "allocations": [
    {
      "channel": "Video Ads",
      "budget": 2800,
      "percentage": 28,
      "cpm": 20,
      "estimatedImpressions": 140000,
      "estimatedReach": 91000,
      "dailyBudget": 93.33,
      "dailyImpressions": 4667,
      "efficiencyScore": 3,
      "insight": "Significant investment in Video Ads. Good balance with other channels."
    },
    ...
  ],
  "summary": {
    "totalBudget": 10000,
    "durationDays": 30,
    "totalImpressions": 1200000,
    "totalReach": 650000,
    "averageCpm": 8.33,
    "dailyBudget": 333.33,
    "goal": "balanced",
    "recommendation": "Balanced distribution across channels..."
  },
  "calculatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🎨 Design Philosophy

The UI follows a **dark theme financial dashboard** aesthetic:
- High contrast for readability
- Color-coded channels for quick identification
- Monospace fonts for numeric data
- Subtle animations for feedback
- Mobile-responsive layout

---

## ⚠️ Known Limitations

1. **Static CPM values** - Real campaigns would need dynamic pricing
2. **No persistence** - Calculations are not saved
3. **Limited channels** - Only 3 channels supported
4. **No validation against real inventory** - Assumes unlimited inventory
5. **No currency localization** - USD only

---

## 📝 Notes for Reviewers

### What I prioritized:
1. **Clean, working code** over extensive features
2. **Explainable algorithm** over complex ML
3. **User experience** with immediate feedback
4. **Type safety** throughout the stack
5. **Documented assumptions** for transparency

### Time investment areas:
- Algorithm design and documentation (~30%)
- API structure and validation (~25%)
- Frontend UX and styling (~35%)
- Documentation and README (~10%)

---

## 📄 License

MIT License - Feel free to use this as a starting point for similar projects.

