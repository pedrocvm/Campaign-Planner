# 📊 Campaign Budget Optimizer

A full-stack application that helps campaign managers optimize their advertising budget distribution across multiple channels to maximize reach and engagement.

![Tech Stack](https://img.shields.io/badge/Backend-NestJS-red?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Frontend-Angular%2017-purple?style=flat-square)
![Tech Stack](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)
![Swagger](https://img.shields.io/badge/API%20Docs-Swagger-green?style=flat-square)

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

📚 **API Documentation (Swagger):** `http://localhost:3000/api/docs`

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

### Core Features

| Feature | Description |
|---------|-------------|
| **Budget Input Form** | Enter total budget, campaign duration, and optimization goal |
| **Three Optimization Goals** | Reach, Engagement, or Balanced optimization strategies |
| **Real-time Calculation** | Instant budget distribution across Video, Display, and Social channels |
| **Detailed Metrics** | Estimated impressions, reach, CPM, and daily breakdown |
| **Channel Insights** | Contextual recommendations for each channel |

### Advanced Options (v2)

| Feature | Description |
|---------|-------------|
| **Global Limits** | Set default min/max percentage constraints for all channels |
| **Per-Channel Controls** | Fine-tune each channel individually |
| ↳ Enable/Disable | Toggle channels on/off |
| ↳ Min/Max % Override | Set custom allocation limits per channel |
| ↳ CPM Override | Use custom CPM values instead of defaults |
| ↳ Frequency Override | Adjust frequency caps per channel |
| **Real-time Validation** | Instant feedback on constraint conflicts |

### Period Views

| View | Description |
|------|-------------|
| **Daily** | See budget breakdown per day |
| **Weekly** | Aggregate view by week |
| **Monthly** | Monthly budget allocation |
| **Total** | Full campaign overview |

### Comparison & Sharing

| Feature | Description |
|---------|-------------|
| **Save Scenarios** | Save up to 5 different scenarios to localStorage |
| **Compare Scenarios** | Side-by-side comparison with visual diff |
| **Shareable Links** | Generate URL with query params to share configurations |
| **Copy Summary** | Export results to clipboard |
| **Print Support** | Print-optimized layout |

### Video ↔ Display Slider

Interactive slider to quickly adjust the balance between Video and Display channels:
- Range: -50% (more Display) to +50% (more Video)
- Respects min/max constraints
- Real-time recalculation

### Smart Insights & Warnings

Automatic detection of potential issues:
- ⚠️ **High Concentration**: Alert when any channel exceeds 70%
- ⚠️ **Goal Mismatch**: Warning when allocation conflicts with selected goal
- ⚠️ **Low Daily Spend**: Alert when daily budget per channel is too low
- ⚠️ **Constrained Allocation**: Notice when channels hit min/max limits

### "How We Calculate" Modal

Transparent explanation of the algorithm:
- Impressions formula: `(Budget / CPM) × 1000`
- Reach estimation: `Impressions / Frequency`
- Goal impact on distribution
- Effect of constraints

### User Experience

| Feature | Description |
|---------|-------------|
| **Dark/Light Theme** | Toggle with preference persistence in localStorage |
| **Toast Notifications** | Non-intrusive feedback for actions |
| **Responsive Design** | Works on desktop and mobile devices |
| **User-Friendly Language** | Designed for marketing professionals |

---

## 🔌 API Documentation

### Swagger UI

Access the interactive API documentation at: **http://localhost:3000/api/docs**

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/campaigns/calculate` | Calculate optimal budget distribution |
| `GET` | `/api/campaigns/channels` | Get available channel information |
| `GET` | `/api/campaigns/health` | Health check endpoint |

### Request Example

```bash
curl -X POST http://localhost:3000/api/campaigns/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "totalBudget": 10000,
    "durationDays": 30,
    "goal": "balanced",
    "minChannelPercentage": 10,
    "maxChannelPercentage": 60
  }'
```

### Response Example

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
    }
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

## 🎯 Assumptions Made

### Business Assumptions

| Assumption | Rationale |
|------------|-----------|
| **3 fixed channels** (Video, Display, Social) | Based on the problem description. Extensible architecture allows adding more. |
| **CPM values are configurable** | Default CPMs: Video ($15), Display ($8), Social ($12). Can be overridden per-channel. |
| **Reach factor applied** | Impressions ≠ unique users. Applied frequency factors to estimate unique reach. |
| **No authentication required** | MVP focused on functionality. Campaign managers need quick access. |
| **Stateless calculations** | No persistence required for MVP. Scenarios saved in localStorage. |

### Technical Assumptions

| Assumption | Rationale |
|------------|-----------|
| **Single-tenant design** | Simplified for demo. Production would need multi-tenancy. |
| **No historical data** | Algorithm uses static CPM values. Production would use historical performance. |
| **Browser-based only** | No mobile app or desktop client needed for this use case. |

---

## 🔧 Design Decisions

### Algorithm: Efficiency-Based Distribution

The budget distribution algorithm uses a **weighted efficiency scoring** approach:

```
For each channel:
  1. Calculate base efficiency = 1 / CPM (lower CPM = more efficient)
  2. Apply goal-based weights:
     - REACH: Prioritize low CPM channels
     - ENGAGEMENT: Factor in engagement weight per channel
     - BALANCED: 60% reach efficiency + 40% engagement weight
  3. Apply Video/Display bias from slider
  4. Apply min constraints first (guaranteed allocation)
  5. Distribute remaining budget proportionally by score
  6. Cap at max constraints, redistribute excess
  7. Normalize to ensure sum = 100%
```

**Why this approach?**
- Simple and explainable (important for stakeholder buy-in)
- Predictable results (same inputs = same outputs)
- Configurable via goal selection and per-channel settings
- No ML complexity for MVP

### Frontend Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── results/                 # Main results display
│   │   │   ├── advanced-options/        # Per-channel controls
│   │   │   ├── video-display-slider/    # Quick balance adjuster
│   │   │   ├── compare-modal/           # Scenario comparison
│   │   │   ├── how-we-calculate-modal/  # Algorithm explanation
│   │   │   └── warnings/                # Smart insights display
│   │   ├── config/
│   │   │   └── campaign-config.ts       # Channel defaults & config
│   │   ├── models/
│   │   │   ├── campaign.models.ts       # API types
│   │   │   └── planner.models.ts        # Frontend planner types
│   │   ├── services/
│   │   │   ├── campaign.service.ts      # API communication
│   │   │   └── planner-calculator.service.ts  # Frontend calculations
│   │   └── app.component.ts             # Main component
│   └── styles.css                       # Global styles & themes
```

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Standalone Components** | Angular 17 modern approach, smaller bundle |
| **Reactive Forms** | Better validation, type safety |
| **Pure Calculator Service** | Testable, reusable, no side effects |
| **CSS Variables** | Consistent theming, easy customization |
| **localStorage for Scenarios** | No backend needed, instant save/load |
| **Query Params for Sharing** | Simple, URL-based sharing without auth |

---

## 📁 Project Structure

```
campaign-budget-optimizer/
├── backend/                          # NestJS API
│   ├── src/
│   │   ├── campaign/
│   │   │   ├── dto/
│   │   │   │   ├── budget-input.dto.ts
│   │   │   │   └── budget-result.dto.ts
│   │   │   ├── campaign.controller.ts
│   │   │   ├── campaign.service.ts
│   │   │   └── campaign.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts                   # Swagger setup
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # Angular 17 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # Feature components
│   │   │   ├── config/               # Channel configuration
│   │   │   ├── models/               # TypeScript interfaces
│   │   │   ├── services/             # API & calculator services
│   │   │   └── app.component.ts
│   │   ├── styles.css                # Global styles + themes
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
└── README.md
```

---

## 🎨 Design Philosophy

### Visual Design

- **Dark Theme**: Modern financial dashboard aesthetic
- **Light Theme**: Clean, professional look for presentations
- **Color-coded Channels**: Quick visual identification
  - 🎬 Video: Pink/Magenta
  - 🖼️ Display: Blue/Teal
  - 📱 Social: Green
- **Subtle Animations**: Feedback without distraction
- **Responsive Layout**: Mobile-first approach

### UX Principles

1. **Immediate Feedback**: Real-time validation and calculation
2. **Progressive Disclosure**: Basic form → Advanced options
3. **Non-blocking Notifications**: Toast messages instead of alerts
4. **Explainable AI**: "How we calculate" modal for transparency
5. **Undo-friendly**: Save/compare scenarios for experimentation

---

## 🚧 Decisions Postponed / Left Flexible

| Decision | Current State | Future Consideration |
|----------|---------------|----------------------|
| **Database** | None (stateless) | PostgreSQL/MongoDB for campaign history |
| **Authentication** | None | OAuth2/JWT with role-based access |
| **Dynamic CPMs** | Static + overrides | Real-time inventory pricing API |
| **Channel Config** | Config file | Admin UI for channel management |
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

---

## ⚠️ Known Limitations

1. **Static CPM defaults** - Real campaigns would need dynamic pricing
2. **No server persistence** - Scenarios only saved locally
3. **Limited channels** - Only 3 channels supported
4. **No validation against real inventory** - Assumes unlimited inventory
5. **No currency localization** - USD only
6. **Max 5 saved scenarios** - localStorage limitation

---

## 📝 Notes for Reviewers

### What I prioritized:

1. **Clean, working code** over extensive features
2. **Explainable algorithm** over complex ML
3. **User experience** with immediate feedback
4. **Type safety** throughout the stack
5. **Documented assumptions** for transparency
6. **Demo-friendly features** (compare, share, explain)

### Key Demo Points:

1. **Advanced Options**: Show per-channel control granularity
2. **Video/Display Slider**: Quick adjustments during a call
3. **Compare Scenarios**: A/B testing different strategies
4. **Shareable Links**: Collaboration without login
5. **Theme Toggle**: Professional presentation ready
6. **How We Calculate**: Transparency builds trust

---

## 📄 License

MIT License - Feel free to use this as a starting point for similar projects.
