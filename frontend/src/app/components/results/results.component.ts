import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { BudgetResult, ChannelAllocation } from '../../models/campaign.models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
    <!-- Loading State -->
    <div class="loading-state" *ngIf="loading">
      <div class="card">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p>Calculating optimal distribution...</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div class="error-state" *ngIf="error && !loading">
      <div class="card error-card">
        <div class="error-icon">⚠️</div>
        <h3>Unable to Calculate</h3>
        <p>{{ error }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!result && !loading && !error">
      <div class="card empty-card">
        <div class="empty-icon">📈</div>
        <h3>Ready to Optimize</h3>
        <p>Enter your campaign parameters and click calculate to see your optimal budget distribution.</p>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">🎬</span>
            <span>Video Ads</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🖼️</span>
            <span>Display Ads</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📱</span>
            <span>Social Ads</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="results" *ngIf="result && !loading">
      <!-- Summary Card -->
      <div class="card summary-card">
        <div class="summary-header">
          <h2>Campaign Summary</h2>
          <span class="timestamp">{{ formatDate(result.calculatedAt) }}</span>
        </div>
        
        <div class="summary-metrics">
          <div class="metric">
            <span class="metric-value">{{ result.summary.totalBudget | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="metric-label">Total Budget</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ result.summary.durationDays }}</span>
            <span class="metric-label">Days</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ formatNumber(result.summary.totalImpressions) }}</span>
            <span class="metric-label">Est. Impressions</span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ formatNumber(result.summary.totalReach) }}</span>
            <span class="metric-label">Est. Reach</span>
          </div>
        </div>

        <div class="recommendation">
          <span class="rec-icon">💡</span>
          <p>{{ result.summary.recommendation }}</p>
        </div>
      </div>

      <!-- Distribution Visual -->
      <div class="card distribution-card">
        <h3>Budget Distribution</h3>
        <div class="distribution-bar">
          <div
            *ngFor="let alloc of result.allocations; let i = index"
            class="bar-segment"
            [style.width.%]="alloc.percentage"
            [style.background]="getChannelColor(i)"
            [title]="alloc.channel + ': ' + (alloc.percentage | number:'1.1-1') + '%'"
          ></div>
        </div>
        <div class="distribution-legend">
          <div *ngFor="let alloc of result.allocations; let i = index" class="legend-item">
            <span class="legend-dot" [style.background]="getChannelColor(i)"></span>
            <span class="legend-name">{{ alloc.channel }}</span>
            <span class="legend-value">{{ alloc.percentage | number:'1.1-1' }}%</span>
          </div>
        </div>
      </div>

      <!-- Channel Cards -->
      <div class="channels-grid">
        <div
          *ngFor="let alloc of result.allocations; let i = index"
          class="card channel-card"
          [style.border-top-color]="getChannelColor(i)"
        >
          <div class="channel-header">
            <span class="channel-icon">{{ getChannelIcon(alloc.channel) }}</span>
            <div class="channel-info">
              <h4>{{ alloc.channel }}</h4>
              <div class="efficiency">
                <span class="efficiency-stars">{{ getStars(alloc.efficiencyScore) }}</span>
                <span class="efficiency-label">Efficiency</span>
              </div>
            </div>
            <div class="channel-budget">
              <span class="budget-amount">{{ alloc.budget | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="budget-percent">{{ alloc.percentage | number:'1.1-1' }}%</span>
            </div>
          </div>

          <div class="channel-stats">
            <div class="stat">
              <span class="stat-value">{{ formatNumber(alloc.estimatedImpressions) }}</span>
              <span class="stat-label">Impressions</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatNumber(alloc.estimatedReach) }}</span>
              <span class="stat-label">Reach</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ alloc.dailyBudget | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="stat-label">Daily Budget</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ alloc.cpm | currency:'USD':'symbol':'1.2-2' }}</span>
              <span class="stat-label">CPM</span>
            </div>
          </div>

          <div class="channel-insight">
            <p>{{ alloc.insight }}</p>
          </div>
        </div>
      </div>

      <!-- Daily Breakdown -->
      <div class="card daily-card">
        <h3>Daily Budget Breakdown</h3>
        <div class="daily-stats">
          <div class="daily-item">
            <span class="daily-label">Daily Budget</span>
            <span class="daily-value">{{ result.summary.dailyBudget | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div class="daily-item">
            <span class="daily-label">Daily Impressions</span>
            <span class="daily-value">{{ formatNumber(result.summary.totalImpressions / result.summary.durationDays) }}</span>
          </div>
          <div class="daily-item">
            <span class="daily-label">Avg. CPM</span>
            <span class="daily-value">{{ result.summary.averageCpm | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      gap: var(--space-lg);
      padding: var(--space-2xl);
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error State */
    .error-card {
      text-align: center;
      border-color: var(--accent-danger);
      background: rgba(239, 68, 68, 0.05);
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: var(--space-md);
    }

    .error-card h3 {
      color: var(--accent-danger);
      margin-bottom: var(--space-sm);
    }

    .error-card p {
      color: var(--text-secondary);
    }

    /* Empty State */
    .empty-card {
      text-align: center;
      padding: var(--space-2xl);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--space-md);
    }

    .empty-card h3 {
      margin-bottom: var(--space-sm);
    }

    .empty-card > p {
      color: var(--text-secondary);
      max-width: 300px;
      margin: 0 auto var(--space-xl);
    }

    .features {
      display: flex;
      justify-content: center;
      gap: var(--space-xl);
    }

    .feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    /* Summary Card */
    .summary-card {
      background: linear-gradient(135deg, var(--bg-card), var(--bg-card-hover));
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }

    .summary-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .timestamp {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .summary-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    @media (max-width: 768px) {
      .summary-metrics {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .metric {
      text-align: center;
      padding: var(--space-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    }

    .metric-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent-primary);
      font-family: var(--font-mono);
    }

    .metric-label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: var(--space-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .recommendation {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md);
      background: rgba(59, 130, 246, 0.1);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--accent-primary);
    }

    .rec-icon {
      font-size: 1.25rem;
    }

    .recommendation p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* Distribution Card */
    .distribution-card h3 {
      margin: 0 0 var(--space-md) 0;
      font-size: 1rem;
    }

    .distribution-bar {
      display: flex;
      height: 24px;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: var(--space-md);
    }

    .bar-segment {
      height: 100%;
      transition: width var(--transition-slow);
    }

    .bar-segment:first-child {
      border-radius: var(--radius-md) 0 0 var(--radius-md);
    }

    .bar-segment:last-child {
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .distribution-legend {
      display: flex;
      justify-content: center;
      gap: var(--space-xl);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-name {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .legend-value {
      font-weight: 600;
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    /* Channel Cards */
    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);
    }

    .channel-card {
      border-top: 4px solid;
    }

    .channel-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .channel-icon {
      font-size: 2rem;
    }

    .channel-info {
      flex: 1;
    }

    .channel-info h4 {
      margin: 0 0 var(--space-xs) 0;
      font-size: 1.1rem;
    }

    .efficiency {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .efficiency-stars {
      color: var(--accent-warning);
      font-size: 0.9rem;
    }

    .efficiency-label {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .channel-budget {
      text-align: right;
    }

    .budget-amount {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .budget-percent {
      display: block;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .channel-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .stat {
      padding: var(--space-sm);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      text-align: center;
    }

    .stat-value {
      display: block;
      font-weight: 600;
      font-family: var(--font-mono);
      font-size: 0.9rem;
    }

    .stat-label {
      display: block;
      color: var(--text-muted);
      font-size: 0.7rem;
      margin-top: 2px;
      text-transform: uppercase;
    }

    .channel-insight {
      padding: var(--space-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    }

    .channel-insight p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
      line-height: 1.5;
    }

    /* Daily Card */
    .daily-card h3 {
      margin: 0 0 var(--space-lg) 0;
      font-size: 1rem;
    }

    .daily-stats {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: var(--space-lg);
    }

    .daily-item {
      text-align: center;
    }

    .daily-label {
      display: block;
      color: var(--text-muted);
      font-size: 0.8rem;
      margin-bottom: var(--space-xs);
    }

    .daily-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--accent-success);
    }
  `]
})
export class ResultsComponent {
  @Input() result: BudgetResult | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  private channelColors = [
    'var(--channel-video)',
    'var(--channel-display)',
    'var(--channel-social)',
  ];

  private channelIcons: Record<string, string> = {
    'Video Ads': '🎬',
    'Display Ads': '🖼️',
    'Social Ads': '📱',
  };

  getChannelColor(index: number): string {
    return this.channelColors[index % this.channelColors.length];
  }

  getChannelIcon(channel: string): string {
    return this.channelIcons[channel] || '📊';
  }

  getStars(score: number): string {
    const fullStars = Math.floor(score / 2);
    const halfStar = score % 2 >= 1;
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }
}

