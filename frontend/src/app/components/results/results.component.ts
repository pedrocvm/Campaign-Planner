import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { BudgetResult, ChannelAllocation } from '../../models/campaign.models';
import { PlannerResult, PlannerInsight } from '../../models/planner.models';
import { VideoDisplaySliderComponent } from '../video-display-slider/video-display-slider.component';
import { WarningsComponent } from '../warnings/warnings.component';
import { HowWeCalculateModalComponent } from '../how-we-calculate-modal/how-we-calculate-modal.component';
import { CompareModalComponent } from '../compare-modal/compare-modal.component';

export type ViewPeriod = 'daily' | 'weekly' | 'monthly' | 'total';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DecimalPipe,
    VideoDisplaySliderComponent,
    WarningsComponent,
    HowWeCalculateModalComponent,
    CompareModalComponent,
  ],
  template: `
    <!-- Loading State -->
    <div class="loading-state" *ngIf="loading">
      <div class="card">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <h3>Analyzing your campaign...</h3>
          <p>Calculating the best distribution for your investment</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div class="error-state" *ngIf="error && !loading">
      <div class="card error-card">
        <div class="error-icon">😕</div>
        <h3>Oops! Something went wrong</h3>
        <p>{{ getErrorMessage(error) }}</p>
        <button class="retry-btn" (click)="dismissError()">Try again</button>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!result && !loading && !error">
      <div class="card empty-card">
        <div class="empty-illustration">
          <span class="empty-icon">🎯</span>
        </div>
        <h3>Ready to get started!</h3>
        <p>
          Fill in your campaign details on the left and click "Calculate" to see
          how to best distribute your budget.
        </p>

        <div class="channels-preview">
          <h4>Your ads can appear on:</h4>
          <div class="channel-list">
            <div class="channel-preview">
              <span class="channel-emoji">🎬</span>
              <div class="channel-info">
                <strong>Video</strong>
                <span>YouTube, Streaming</span>
              </div>
            </div>
            <div class="channel-preview">
              <span class="channel-emoji">🖼️</span>
              <div class="channel-info">
                <strong>Display</strong>
                <span>Websites & Apps</span>
              </div>
            </div>
            <div class="channel-preview">
              <span class="channel-emoji">📱</span>
              <div class="channel-info">
                <strong>Social</strong>
                <span>Facebook, Instagram</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="results" *ngIf="(result || plannerResult) && !loading">
      <!-- Success Header -->
      <div class="success-header">
        <span class="success-icon">✅</span>
        <div class="success-text">
          <h2>Here's your media plan!</h2>
          <p>
            Based on your budget and goals, this is the optimal distribution
          </p>
        </div>
      </div>

      <!-- View Period Selector -->
      <div class="card period-selector-card">
        <div class="period-header">
          <h3>📅 View By Period</h3>
          <p class="period-subtitle">
            Choose how you want to see your budget breakdown
          </p>
        </div>
        <div class="period-tabs">
          <button
            class="period-tab"
            [class.active]="selectedPeriod === 'daily'"
            (click)="selectPeriod('daily')"
          >
            <span class="tab-icon">📆</span>
            <span class="tab-label">Daily</span>
          </button>
          <button
            class="period-tab"
            [class.active]="selectedPeriod === 'weekly'"
            (click)="selectPeriod('weekly')"
          >
            <span class="tab-icon">🗓️</span>
            <span class="tab-label">Weekly</span>
          </button>
          <button
            class="period-tab"
            [class.active]="selectedPeriod === 'monthly'"
            (click)="selectPeriod('monthly')"
          >
            <span class="tab-icon">📅</span>
            <span class="tab-label">Monthly</span>
          </button>
          <button
            class="period-tab"
            [class.active]="selectedPeriod === 'total'"
            (click)="selectPeriod('total')"
          >
            <span class="tab-icon">📊</span>
            <span class="tab-label">Total</span>
          </button>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="card summary-card">
        <div class="summary-header-row">
          <h3>📊 {{ getPeriodTitle() }}</h3>
          <span class="period-badge">{{ getPeriodBadge() }}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-item main">
            <span class="summary-label">{{ getBudgetLabel() }}</span>
            <span class="summary-value big">{{
              getPeriodBudget() | currency : 'USD' : 'symbol' : '1.0-0'
            }}</span>
          </div>
          <div class="summary-item" *ngIf="selectedPeriod !== 'total'">
            <span class="summary-label">{{ getPeriodsLabel() }}</span>
            <span class="summary-value">{{ getPeriodsCount() }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Campaign Duration</span>
            <span class="summary-value">{{ summary?.durationDays }} days</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="reach-highlight">
          <div class="reach-item">
            <span class="reach-icon">👁️</span>
            <div class="reach-info">
              <span class="reach-label">{{ getImpressionsLabel() }}</span>
              <span class="reach-value"
                >{{ formatBigNumber(getPeriodImpressions()) }} impressions</span
              >
            </div>
          </div>
          <div class="reach-item">
            <span class="reach-icon">👥</span>
            <div class="reach-info">
              <span class="reach-label">{{ getReachLabel() }}</span>
              <span class="reach-value"
                >{{ formatBigNumber(getPeriodReach()) }} people</span
              >
            </div>
          </div>
        </div>

        <div class="period-comparison" *ngIf="selectedPeriod !== 'total'">
          <div class="comparison-note">
            <span class="note-icon">💡</span>
            <p>
              Total campaign:
              {{ summary?.totalBudget | currency : 'USD' : 'symbol' : '1.0-0' }}
              over {{ summary?.durationDays }} days
            </p>
          </div>
        </div>
      </div>

      <!-- Distribution Visual -->
      <div class="card distribution-card">
        <h3>📈 How your budget will be split</h3>
        <p class="distribution-subtitle">
          Each channel receives a portion of your investment
        </p>

        <div class="distribution-bar">
          <div
            *ngFor="let alloc of allocations; let i = index"
            class="bar-segment"
            [style.width.%]="alloc.percentage"
            [style.background]="getChannelColor(i)"
          >
            <span class="bar-label" *ngIf="alloc.percentage > 15"
              >{{ alloc.percentage | number : '1.0-0' }}%</span
            >
          </div>
        </div>

        <div class="distribution-legend">
          <div
            *ngFor="let alloc of allocations; let i = index"
            class="legend-item"
          >
            <span
              class="legend-dot"
              [style.background]="getChannelColor(i)"
            ></span>
            <span class="legend-channel">{{
              getChannelLabel(alloc.channel)
            }}</span>
            <span class="legend-percent"
              >{{ alloc.percentage | number : '1.0-0' }}%</span
            >
            <span class="legend-amount">{{
              getChannelPeriodBudget(alloc)
                | currency : 'USD' : 'symbol' : '1.0-0'
            }}</span>
            <span class="legend-period" *ngIf="selectedPeriod !== 'total'"
              >/ {{ getPeriodShortLabel() }}</span
            >
          </div>
        </div>
      </div>

      <!-- Channel Cards -->
      <div class="channels-section">
        <h3>🎯 Channel Details</h3>

        <div class="channels-grid">
          <div
            *ngFor="let alloc of allocations; let i = index"
            class="card channel-card"
          >
            <div
              class="channel-header"
              [style.background]="getChannelGradient(i)"
            >
              <span class="channel-emoji-big">{{
                getChannelEmoji(alloc.channel)
              }}</span>
              <div class="channel-title">
                <h4>{{ getChannelLabel(alloc.channel) }}</h4>
                <span class="channel-type">{{
                  getChannelType(alloc.channel)
                }}</span>
              </div>
              <div class="channel-investment">
                <span class="investment-amount">{{
                  getChannelPeriodBudget(alloc)
                    | currency : 'USD' : 'symbol' : '1.0-0'
                }}</span>
                <span class="investment-percent"
                  >{{ alloc.percentage | number : '1.0-0' }}% •
                  {{ getPeriodShortLabel() }}</span
                >
              </div>
            </div>

            <div class="channel-body">
              <div class="metrics-grid">
                <div class="metric">
                  <span class="metric-icon">👁️</span>
                  <div class="metric-content">
                    <span class="metric-value">{{
                      formatBigNumber(getChannelPeriodImpressions(alloc))
                    }}</span>
                    <span class="metric-label"
                      >impressions / {{ getPeriodShortLabel() }}</span
                    >
                  </div>
                </div>
                <div class="metric">
                  <span class="metric-icon">👥</span>
                  <div class="metric-content">
                    <span class="metric-value">{{
                      formatBigNumber(getChannelPeriodReach(alloc))
                    }}</span>
                    <span class="metric-label"
                      >reach / {{ getPeriodShortLabel() }}</span
                    >
                  </div>
                </div>
                <div class="metric">
                  <span class="metric-icon">📅</span>
                  <div class="metric-content">
                    <span class="metric-value">{{
                      alloc.dailyBudget | currency : 'USD' : 'symbol' : '1.0-0'
                    }}</span>
                    <span class="metric-label">per day</span>
                  </div>
                </div>
                <div class="metric">
                  <span class="metric-icon">💵</span>
                  <div class="metric-content">
                    <span class="metric-value">{{
                      alloc.cpm | currency : 'USD' : 'symbol' : '1.2-2'
                    }}</span>
                    <span class="metric-label">per 1,000 views</span>
                  </div>
                </div>
              </div>

              <div class="quality-indicator">
                <span class="quality-label">Cost-efficiency:</span>
                <div class="quality-bar">
                  <div
                    class="quality-fill"
                    [style.width.%]="alloc.efficiencyScore * 10"
                  ></div>
                </div>
                <span class="quality-text">{{
                  getEfficiencyLabel(alloc.efficiencyScore)
                }}</span>
              </div>

              <div class="channel-insight">
                <span class="insight-icon">💡</span>
                <p>{{ getInsight(alloc) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Video/Display Slider -->
      <app-video-display-slider
        *ngIf="showSlider"
        [value]="videoDisplayBias"
        (valueChange)="onSliderChange($event)"
      ></app-video-display-slider>

      <!-- Insights/Warnings -->
      <app-warnings
        *ngIf="plannerResult?.insights"
        [insights]="plannerResult?.insights || []"
      ></app-warnings>

      <!-- Recommendation Card -->
      <div class="card recommendation-card">
        <div class="recommendation-header">
          <span class="rec-icon">🎓</span>
          <h3>Our Recommendation</h3>
          <button class="how-link" (click)="openHowWeCalculate()">
            How we calculate
          </button>
        </div>
        <p class="recommendation-text">{{ getRecommendation(summary) }}</p>

        <div class="action-buttons">
          <button class="action-btn primary" (click)="copyToClipboard()">
            <span>📋</span> Copy Summary
          </button>
          <button class="action-btn secondary" (click)="copyShareableLink()">
            <span>🔗</span> Copy Link
          </button>
          <button class="action-btn secondary" (click)="saveScenario()">
            <span>💾</span> Save Scenario
          </button>
          <button class="action-btn secondary" (click)="openCompare()">
            <span>📊</span> Compare
            <span class="btn-badge" *ngIf="hasSavedScenario">{{
              savedScenarioCount
            }}</span>
          </button>
          <button class="action-btn secondary" (click)="printResults()">
            <span>🖨️</span> Print
          </button>
        </div>
      </div>

      <!-- Modals -->
      <app-how-we-calculate-modal
        [isOpen]="showHowWeCalculate"
        (closeModal)="closeHowWeCalculate()"
      ></app-how-we-calculate-modal>

      <app-compare-modal
        [isOpen]="showCompare"
        [currentResult]="plannerResult"
        [savedResult]="savedScenario"
        [savedScenarios]="savedScenarios"
        (selectScenarioIndex)="selectScenarioToCompare($event)"
        (closeModal)="closeCompare()"
        (clearSavedScenario)="clearSavedScenario()"
      ></app-compare-modal>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <p>
          ⚠️ These values are estimates based on market averages. Actual results
          may vary depending on targeting, creative quality, and other factors.
        </p>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      class="toast"
      *ngIf="toastMessage"
      [class.show]="toastVisible"
      [class]="'toast ' + toastType"
    >
      <span class="toast-icon">{{ getToastIcon() }}</span>
      <span class="toast-message">{{ toastMessage }}</span>
    </div>
  `,
  styles: [
    `
      /* Card Base */
      .card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        margin-bottom: var(--space-lg);
      }

      /* Loading State */
      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-2xl);
        text-align: center;
      }

      .loading-content h3 {
        margin: 0;
        font-size: 1.25rem;
      }

      .loading-content p {
        margin: 0;
        color: var(--text-secondary);
      }

      .loading-spinner {
        width: 56px;
        height: 56px;
        border: 4px solid var(--border-color);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Error State */
      .error-card {
        text-align: center;
        border-color: var(--accent-danger);
        background: rgba(239, 68, 68, 0.05);
        padding: var(--space-2xl);
      }

      .error-icon {
        font-size: 4rem;
        margin-bottom: var(--space-md);
      }

      .error-card h3 {
        color: var(--accent-danger);
        margin: 0 0 var(--space-sm) 0;
      }

      .error-card p {
        color: var(--text-secondary);
        margin: 0 0 var(--space-lg) 0;
      }

      .retry-btn {
        padding: var(--space-sm) var(--space-lg);
        background: var(--accent-danger);
        color: white;
        border-radius: var(--radius-md);
        font-weight: 500;
      }

      /* Empty State */
      .empty-card {
        text-align: center;
        padding: var(--space-2xl);
      }

      .empty-illustration {
        margin-bottom: var(--space-lg);
      }

      .empty-icon {
        font-size: 5rem;
      }

      .empty-card h3 {
        margin: 0 0 var(--space-sm) 0;
        font-size: 1.5rem;
      }

      .empty-card > p {
        color: var(--text-secondary);
        max-width: 400px;
        margin: 0 auto var(--space-xl);
        font-size: 1rem;
        line-height: 1.6;
      }

      .channels-preview {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
      }

      .channels-preview h4 {
        margin: 0 0 var(--space-md) 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .channel-list {
        display: flex;
        justify-content: center;
        gap: var(--space-xl);
        flex-wrap: wrap;
      }

      .channel-preview {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .channel-emoji {
        font-size: 2rem;
      }

      .channel-info {
        text-align: left;
      }

      .channel-info strong {
        display: block;
        font-size: 0.9rem;
      }

      .channel-info span {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      /* Success Header */
      .success-header {
        display: flex;
        align-items: center;
        gap: var(--space-lg);
        padding: var(--space-lg);
        background: linear-gradient(
          135deg,
          rgba(16, 185, 129, 0.1),
          rgba(59, 130, 246, 0.1)
        );
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-lg);
      }

      .success-icon {
        font-size: 3rem;
      }

      .success-text h2 {
        margin: 0 0 var(--space-xs) 0;
        font-size: 1.5rem;
      }

      .success-text p {
        margin: 0;
        color: var(--text-secondary);
      }

      /* Summary Card */
      .summary-card h3 {
        margin: 0 0 var(--space-lg) 0;
        font-size: 1.1rem;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: var(--space-md);
      }

      @media (max-width: 600px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }

      .summary-item {
        padding: var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        text-align: center;
      }

      .summary-item.main {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.15),
          rgba(139, 92, 246, 0.1)
        );
      }

      .summary-label {
        display: block;
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-xs);
      }

      .summary-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        font-family: var(--font-mono);
      }

      .summary-value.big {
        font-size: 1.75rem;
        color: var(--accent-primary);
      }

      .divider {
        height: 1px;
        background: var(--border-color);
        margin: var(--space-lg) 0;
      }

      .reach-highlight {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-lg);
      }

      @media (max-width: 600px) {
        .reach-highlight {
          grid-template-columns: 1fr;
        }
      }

      .reach-item {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .reach-icon {
        font-size: 2rem;
      }

      .reach-info {
        display: flex;
        flex-direction: column;
      }

      .reach-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .reach-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--accent-success);
      }

      /* Distribution Card */
      .distribution-card h3 {
        margin: 0 0 var(--space-xs) 0;
        font-size: 1.1rem;
      }

      .distribution-subtitle {
        margin: 0 0 var(--space-lg) 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .distribution-bar {
        display: flex;
        height: 40px;
        border-radius: var(--radius-md);
        overflow: hidden;
        margin-bottom: var(--space-lg);
        box-shadow: var(--shadow-sm);
      }

      .bar-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        transition: width var(--transition-slow);
      }

      .bar-label {
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .distribution-legend {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .legend-dot {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .legend-channel {
        flex: 1;
        font-weight: 500;
      }

      .legend-percent {
        font-weight: 600;
        font-family: var(--font-mono);
        min-width: 45px;
        text-align: right;
      }

      .legend-amount {
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: 0.9rem;
        min-width: 80px;
        text-align: right;
      }

      /* Channels Section */
      .channels-section {
        margin-bottom: var(--space-lg);
      }

      .channels-section > h3 {
        margin: 0 0 var(--space-lg) 0;
        font-size: 1.1rem;
      }

      .channels-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--space-lg);
      }

      .channel-card {
        padding: 0;
        overflow: hidden;
      }

      .channel-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-lg);
      }

      .channel-emoji-big {
        font-size: 2.5rem;
      }

      .channel-title {
        flex: 1;
      }

      .channel-title h4 {
        margin: 0;
        font-size: 1.1rem;
        color: white;
      }

      .channel-type {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
      }

      .channel-investment {
        text-align: right;
      }

      .investment-amount {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
        font-family: var(--font-mono);
      }

      .investment-percent {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
      }

      .channel-body {
        padding: var(--space-lg);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-md);
        margin-bottom: var(--space-lg);
      }

      .metric {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        padding: var(--space-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .metric-icon {
        font-size: 1.25rem;
      }

      .metric-content {
        display: flex;
        flex-direction: column;
      }

      .metric-value {
        font-weight: 600;
        font-family: var(--font-mono);
        font-size: 0.95rem;
      }

      .metric-label {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .quality-indicator {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
      }

      .quality-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      .quality-bar {
        flex: 1;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
      }

      .quality-fill {
        height: 100%;
        background: linear-gradient(
          90deg,
          var(--accent-warning),
          var(--accent-success)
        );
        border-radius: 4px;
        transition: width var(--transition-slow);
      }

      .quality-text {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--accent-success);
        white-space: nowrap;
      }

      .channel-insight {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        padding: var(--space-md);
        background: rgba(59, 130, 246, 0.08);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent-primary);
      }

      .insight-icon {
        font-size: 1rem;
      }

      .channel-insight p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      /* Recommendation Card */
      .recommendation-card {
        background: linear-gradient(
          135deg,
          rgba(139, 92, 246, 0.1),
          rgba(59, 130, 246, 0.08)
        );
        border-color: rgba(139, 92, 246, 0.3);
      }

      .recommendation-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
      }

      .rec-icon {
        font-size: 1.75rem;
      }

      .recommendation-header h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .how-link {
        margin-left: auto;
        padding: 4px 12px;
        background: transparent;
        border: 1px solid var(--accent-primary);
        border-radius: var(--radius-sm);
        color: var(--accent-primary);
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .how-link:hover {
        background: var(--accent-primary);
        color: white;
      }

      .recommendation-text {
        margin: 0 0 var(--space-lg) 0;
        font-size: 1rem;
        line-height: 1.6;
        color: var(--text-secondary);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-md);
        flex-wrap: wrap;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-md);
        font-weight: 500;
        font-size: 0.9rem;
        transition: all var(--transition-fast);
      }

      .action-btn.primary {
        background: var(--accent-primary);
        color: white;
      }

      .action-btn.primary:hover {
        background: var(--accent-secondary);
      }

      .action-btn.secondary {
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
      }

      .action-btn.secondary:hover {
        border-color: var(--accent-primary);
      }

      .btn-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        background: linear-gradient(135deg, #7c3aed, #6366f1) !important;
        color: #ffffff !important;
        border-radius: 11px;
        font-size: 0.8rem;
        font-weight: 700;
        margin-left: 8px;
        box-shadow: 0 2px 10px rgba(124, 58, 237, 0.5) !important;
        border: none !important;
      }

      /* Disclaimer */
      .disclaimer {
        padding: var(--space-md);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent-warning);
      }

      .disclaimer p {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      /* Period Selector */
      .period-selector-card {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.08),
          rgba(139, 92, 246, 0.08)
        );
        border-color: rgba(59, 130, 246, 0.2);
      }

      .period-header {
        text-align: center;
        margin-bottom: var(--space-lg);
      }

      .period-header h3 {
        margin: 0 0 var(--space-xs) 0;
        font-size: 1.1rem;
      }

      .period-subtitle {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .period-tabs {
        display: flex;
        gap: var(--space-sm);
        justify-content: center;
        flex-wrap: wrap;
      }

      .period-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
        padding: var(--space-md) var(--space-lg);
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        min-width: 90px;
        color: var(--text-primary);
      }

      .period-tab:hover {
        border-color: var(--accent-primary);
        transform: translateY(-2px);
        background: var(--bg-secondary);
      }

      .period-tab.active {
        background: linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );
        border-color: transparent;
        color: white;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      }

      .period-tab.active .tab-label,
      .period-tab.active .tab-icon {
        color: white;
      }

      .tab-icon {
        font-size: 1.5rem;
      }

      .tab-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: inherit;
      }

      /* Summary Header Row */
      .summary-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-lg);
      }

      .summary-header-row h3 {
        margin: 0;
      }

      .period-badge {
        padding: var(--space-xs) var(--space-md);
        background: linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );
        color: white;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Period Comparison Note */
      .period-comparison {
        margin-top: var(--space-lg);
        padding-top: var(--space-md);
        border-top: 1px solid var(--border-color);
      }

      .comparison-note {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .note-icon {
        font-size: 1rem;
      }

      .comparison-note p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      /* Legend Period Label */
      .legend-period {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-left: -4px;
      }

      /* Toast Notification */
      .toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        background: var(--bg-card);
        border-radius: var(--radius-md);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
      }

      .toast.show {
        transform: translateY(0);
        opacity: 1;
      }

      .toast.success {
        border-left: 4px solid var(--accent-success);
      }

      .toast.warning {
        border-left: 4px solid var(--accent-warning);
      }

      .toast.info {
        border-left: 4px solid var(--accent-primary);
      }

      .toast-icon {
        font-size: 1.25rem;
      }

      .toast-message {
        font-size: 0.9rem;
        font-weight: 500;
      }
    `,
  ],
})
export class ResultsComponent implements OnInit {
  @Input() result: BudgetResult | null = null;
  @Input() plannerResult: PlannerResult | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() videoDisplayBias = 0;
  @Input() showSlider = true;

  @Output() biasChange = new EventEmitter<number>();
  @Output() shareLinkRequested = new EventEmitter<void>();

  selectedPeriod: ViewPeriod = 'total';
  showHowWeCalculate = false;
  showCompare = false;
  toastMessage = '';
  toastVisible = false;
  toastType: 'success' | 'warning' | 'info' = 'success';
  savedScenarios: Array<{
    name: string;
    result: PlannerResult;
    savedAt: Date;
  }> = [];
  selectedSavedIndex = 0;

  private readonly STORAGE_KEY = 'campaignPlanner:savedScenarios';

  private channelColors = [
    'var(--channel-video)',
    'var(--channel-display)',
    'var(--channel-social)',
  ];

  get allocations(): any[] {
    if (this.plannerResult) {
      return this.plannerResult.allocations.map((a) => ({
        channel: this.getChannelLabelById(a.channelId),
        budget: a.budget,
        percentage: a.percentage,
        cpm: a.cpmUsed,
        estimatedImpressions: a.impressions,
        estimatedReach: a.reach,
        dailyBudget: a.dailyBudget,
        dailyImpressions: a.dailyImpressions,
        efficiencyScore: a.score * 10,
        insight: '',
      }));
    }
    return this.result?.allocations || [];
  }

  get summary(): any {
    if (this.plannerResult) {
      return {
        totalBudget: this.plannerResult.summary.totalBudget,
        durationDays: this.plannerResult.summary.durationDays,
        totalImpressions: this.plannerResult.summary.totalImpressions,
        totalReach: this.plannerResult.summary.totalReach,
        averageCpm: this.plannerResult.summary.averageCPM,
        dailyBudget: this.plannerResult.summary.dailyBudget,
        goal: this.plannerResult.summary.goal,
      };
    }
    return this.result?.summary || null;
  }

  private getChannelLabelById(id: string): string {
    const labels: Record<string, string> = {
      video: 'Video Ads',
      display: 'Display Ads',
      social: 'Social Ads',
    };
    return labels[id] || id;
  }

  private channelGradients = [
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #06b6d4, #0284c7)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
  ];

  getChannelColor(index: number): string {
    return this.channelColors[index % this.channelColors.length];
  }

  getChannelGradient(index: number): string {
    return this.channelGradients[index % this.channelGradients.length];
  }

  getChannelEmoji(channel: string): string {
    const emojis: Record<string, string> = {
      'Video Ads': '🎬',
      'Display Ads': '🖼️',
      'Social Ads': '📱',
    };
    return emojis[channel] || '📊';
  }

  getChannelLabel(channel: string): string {
    const labels: Record<string, string> = {
      'Video Ads': 'Video Ads',
      'Display Ads': 'Display & Banners',
      'Social Ads': 'Social Media',
    };
    return labels[channel] || channel;
  }

  getChannelType(channel: string): string {
    const types: Record<string, string> = {
      'Video Ads': 'YouTube, Streaming, Online TV',
      'Display Ads': 'Websites, Portals, Apps',
      'Social Ads': 'Facebook, Instagram, TikTok',
    };
    return types[channel] || '';
  }

  getEfficiencyLabel(score: number): string {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Very Good';
    if (score >= 4) return 'Good';
    return 'Fair';
  }

  formatBigNumber(num: number): string {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(0) + 'K';
    }
    return num.toFixed(0);
  }

  getErrorMessage(error: string): string {
    if (error.includes('Unable to connect')) {
      return 'Could not connect to the server. Please check your connection and try again.';
    }
    if (error.includes('Invalid')) {
      return 'Some of the data entered is not valid. Please review and try again.';
    }
    return 'An unexpected error occurred. Please try again in a few moments.';
  }

  getInsight(alloc: any): string {
    const channel = alloc.channel;
    const percentage = alloc.percentage;

    if (percentage >= 40) {
      if (channel === 'Video Ads') {
        return 'Video is your primary channel. Great for creating impact and driving emotional connection with your audience.';
      }
      if (channel === 'Social Ads') {
        return 'Social media is your main focus. Excellent for reaching a broad audience with precise targeting.';
      }
      return 'Display ads are your primary channel. Good for maintaining constant brand presence across the web.';
    }
    if (percentage >= 25) {
      return `Solid investment in ${this.getChannelLabel(
        channel
      )}. Will complement your other channels nicely.`;
    }
    if (percentage >= 15) {
      return `Moderate allocation to ${this.getChannelLabel(
        channel
      )}. Helps diversify your campaign reach.`;
    }
    return `Smaller investment in ${this.getChannelLabel(
      channel
    )}. Consider increasing if your audience is active on this channel.`;
  }

  getRecommendation(summary: any): string {
    if (!summary) return '';
    const dailyBudget = summary.dailyBudget || 0;
    const goal = summary.goal || 'balanced';

    let recommendation = '';

    if (dailyBudget < 100) {
      recommendation =
        'Your daily budget is on the leaner side. We recommend focusing on fewer channels for greater impact. ';
    } else if (dailyBudget > 1000) {
      recommendation =
        'Your budget allows for strong presence across all channels. ';
    } else {
      recommendation =
        'Your budget is well-positioned for a balanced multi-channel approach. ';
    }

    if (goal === 'reach') {
      recommendation +=
        'We prioritized channels that reach more people, like Social Media and Display ads.';
    } else if (goal === 'engagement') {
      recommendation +=
        'We prioritized Video ads, which generate higher engagement and emotional connection.';
    } else {
      recommendation +=
        'The balanced distribution ensures you get both reach and engagement opportunities.';
    }

    return recommendation;
  }

  dismissError(): void {
    this.error = null;
  }

  copyToClipboard(): void {
    if (!this.summary) return;

    let text = `📊 MEDIA PLAN\n\n`;
    text += `💰 Investment: $${this.summary.totalBudget.toLocaleString()}\n`;
    text += `📅 Duration: ${this.summary.durationDays} days\n\n`;
    text += `DISTRIBUTION:\n`;

    this.allocations.forEach((alloc) => {
      text += `• ${this.getChannelLabel(
        alloc.channel
      )}: $${alloc.budget.toLocaleString()} (${alloc.percentage.toFixed(
        0
      )}%)\n`;
    });

    text += `\n📈 Estimates:\n`;
    text += `• Impressions: ${this.formatBigNumber(
      this.summary.totalImpressions
    )}\n`;
    text += `• People reached: ${this.formatBigNumber(
      this.summary.totalReach
    )}`;

    navigator.clipboard.writeText(text);
    this.showToast('Summary copied to clipboard!', 'success');
  }

  printResults(): void {
    window.print();
  }

  ngOnInit(): void {
    this.loadSavedScenarios();
  }

  onSliderChange(value: number): void {
    this.videoDisplayBias = value;
    this.biasChange.emit(value);
  }

  openHowWeCalculate(): void {
    this.showHowWeCalculate = true;
  }

  closeHowWeCalculate(): void {
    this.showHowWeCalculate = false;
  }

  closeCompare(): void {
    this.showCompare = false;
  }

  showToast(
    message: string,
    type: 'success' | 'warning' | 'info' = 'success'
  ): void {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
      setTimeout(() => {
        this.toastMessage = '';
      }, 300);
    }, 3000);
  }

  getToastIcon(): string {
    switch (this.toastType) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return '💡';
    }
  }

  saveScenario(): void {
    const dataToSave =
      this.plannerResult || this.createPlannerResultFromResult();
    if (dataToSave) {
      const scenarioName = `Scenario ${this.savedScenarios.length + 1}`;
      this.savedScenarios.push({
        name: scenarioName,
        result: dataToSave,
        savedAt: new Date(),
      });
      if (this.savedScenarios.length > 5) {
        this.savedScenarios.shift();
      }
      this.persistScenarios();
      this.showToast(
        `"${scenarioName}" saved! (${this.savedScenarios.length} total)`,
        'success'
      );
    } else {
      this.showToast('No data to save. Calculate first.', 'warning');
    }
  }

  private createPlannerResultFromResult(): PlannerResult | null {
    if (!this.result) return null;
    return {
      allocations: this.result.allocations.map((a) => ({
        channelId: a.channel.toLowerCase().replace(' ads', ''),
        percentage: a.percentage,
        budget: a.budget,
        dailyBudget: a.dailyBudget,
        cpmUsed: a.cpm,
        frequencyUsed: 4,
        impressions: a.estimatedImpressions,
        reach: a.estimatedReach,
        dailyImpressions: a.dailyImpressions,
        isConstrained: 'none' as const,
        score: a.efficiencyScore,
      })),
      summary: {
        totalBudget: this.result.summary.totalBudget,
        durationDays: this.result.summary.durationDays,
        dailyBudget: this.result.summary.dailyBudget,
        totalImpressions: this.result.summary.totalImpressions,
        totalReach: this.result.summary.totalReach,
        averageCPM: this.result.summary.averageCpm,
        goal: this.result.summary.goal as any,
      },
      insights: [],
      calculatedAt: new Date(),
    };
  }

  private loadSavedScenarios(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.savedScenarios = JSON.parse(saved);
      } catch {
        this.savedScenarios = [];
      }
    }
  }

  private persistScenarios(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedScenarios));
  }

  clearSavedScenario(): void {
    if (this.savedScenarios.length > 0) {
      this.savedScenarios.pop();
      this.persistScenarios();
      if (this.savedScenarios.length === 0) {
        this.showCompare = false;
      }
      this.showToast(
        `Scenario removed. ${this.savedScenarios.length} remaining.`,
        'info'
      );
    }
  }

  clearAllScenarios(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.savedScenarios = [];
    this.showCompare = false;
    this.showToast('All saved scenarios cleared.', 'info');
  }

  get hasSavedScenario(): boolean {
    return this.savedScenarios.length > 0;
  }

  get savedScenarioCount(): number {
    return this.savedScenarios.length;
  }

  get savedScenario(): PlannerResult | null {
    if (this.savedScenarios.length === 0) return null;
    return (
      this.savedScenarios[this.selectedSavedIndex]?.result ||
      this.savedScenarios[0]?.result
    );
  }

  selectScenarioToCompare(index: number): void {
    this.selectedSavedIndex = index;
  }

  openCompare(): void {
    if (!this.hasSavedScenario) {
      this.showToast('No saved scenario yet. Save one first!', 'warning');
      return;
    }
    this.showCompare = true;
  }

  copyShareableLink(): void {
    this.shareLinkRequested.emit();
    this.showToast('Link copied to clipboard!', 'success');
  }

  selectPeriod(period: ViewPeriod): void {
    this.selectedPeriod = period;
  }

  getPeriodDivisor(): number {
    if (!this.summary) return 1;
    const days = this.summary.durationDays;
    switch (this.selectedPeriod) {
      case 'daily':
        return days;
      case 'weekly':
        return Math.max(1, days / 7);
      case 'monthly':
        return Math.max(1, days / 30);
      case 'total':
        return 1;
    }
  }

  getPeriodTitle(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Daily Breakdown';
      case 'weekly':
        return 'Weekly Breakdown';
      case 'monthly':
        return 'Monthly Breakdown';
      case 'total':
        return 'Campaign Summary';
    }
  }

  getPeriodBadge(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Per Day';
      case 'weekly':
        return 'Per Week';
      case 'monthly':
        return 'Per Month';
      case 'total':
        return 'Full Campaign';
    }
  }

  getPeriodShortLabel(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'day';
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      case 'total':
        return 'total';
    }
  }

  getBudgetLabel(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Daily Budget';
      case 'weekly':
        return 'Weekly Budget';
      case 'monthly':
        return 'Monthly Budget';
      case 'total':
        return 'Total Investment';
    }
  }

  getPeriodsLabel(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Total Days';
      case 'weekly':
        return 'Total Weeks';
      case 'monthly':
        return 'Total Months';
      default:
        return '';
    }
  }

  getPeriodsCount(): string {
    if (!this.summary) return '0';
    const days = this.summary.durationDays;
    switch (this.selectedPeriod) {
      case 'daily':
        return `${days}`;
      case 'weekly':
        return `${(days / 7).toFixed(1)}`;
      case 'monthly':
        return `${(days / 30).toFixed(1)}`;
      default:
        return '';
    }
  }

  getImpressionsLabel(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Daily impressions';
      case 'weekly':
        return 'Weekly impressions';
      case 'monthly':
        return 'Monthly impressions';
      case 'total':
        return 'How many times your ad will appear';
    }
  }

  getReachLabel(): string {
    switch (this.selectedPeriod) {
      case 'daily':
        return 'Daily reach';
      case 'weekly':
        return 'Weekly reach';
      case 'monthly':
        return 'Monthly reach';
      case 'total':
        return 'Different people who will see it';
    }
  }

  getPeriodBudget(): number {
    if (!this.summary) return 0;
    return this.summary.totalBudget / this.getPeriodDivisor();
  }

  getPeriodImpressions(): number {
    if (!this.summary) return 0;
    return this.summary.totalImpressions / this.getPeriodDivisor();
  }

  getPeriodReach(): number {
    if (!this.summary) return 0;
    const divisor = this.getPeriodDivisor();
    if (divisor === 1) return this.summary.totalReach;
    const reachFactor = Math.pow(1 / divisor, 0.7);
    return this.summary.totalReach * reachFactor;
  }

  getChannelPeriodBudget(alloc: any): number {
    return alloc.budget / this.getPeriodDivisor();
  }

  getChannelPeriodImpressions(alloc: any): number {
    return alloc.estimatedImpressions / this.getPeriodDivisor();
  }

  getChannelPeriodReach(alloc: any): number {
    const divisor = this.getPeriodDivisor();
    if (divisor === 1) return alloc.estimatedReach;
    const reachFactor = Math.pow(1 / divisor, 0.7);
    return alloc.estimatedReach * reachFactor;
  }
}
