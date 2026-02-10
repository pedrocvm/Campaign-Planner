import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { PlannerResult, ChannelAllocationResult } from '../../models/planner.models';
import { getChannelById } from '../../config/campaign-config';

@Component({
  selector: 'app-compare-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>
            <span class="header-icon">📊</span>
            Compare Scenarios
          </h2>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Scenario Selector -->
        <div class="scenario-selector" *ngIf="savedScenarios && savedScenarios.length > 1">
          <span class="selector-label">Compare with:</span>
          <div class="scenario-pills">
            <button
              *ngFor="let scenario of savedScenarios; let i = index"
              class="scenario-pill"
              [class.active]="selectedIndex === i"
              (click)="selectScenario(i)"
            >
              {{ scenario.name }}
            </button>
          </div>
        </div>

        <div class="modal-body" *ngIf="currentResult && savedResult">
          <!-- Summary Comparison -->
          <section class="comparison-section">
            <h3>📋 Overview</h3>
            <div class="comparison-grid">
              <div class="comparison-header">
                <span></span>
                <span class="scenario-label saved">Saved</span>
                <span class="scenario-label current">Current</span>
                <span class="scenario-label diff">Change</span>
              </div>

              <div class="comparison-row">
                <span class="row-label">Total Budget</span>
                <span class="saved-value">{{
                  savedResult.summary.totalBudget | currency : 'USD' : 'symbol' : '1.0-0'
                }}</span>
                <span class="current-value">{{
                  currentResult.summary.totalBudget
                    | currency : 'USD' : 'symbol' : '1.0-0'
                }}</span>
                <span class="diff-value" [class]="getDiffClass(currentResult.summary.totalBudget - savedResult.summary.totalBudget)">
                  {{ getDiffDisplay(currentResult.summary.totalBudget - savedResult.summary.totalBudget, 'currency') }}
                </span>
              </div>

              <div class="comparison-row">
                <span class="row-label">Duration</span>
                <span class="saved-value">{{ savedResult.summary.durationDays }} days</span>
                <span class="current-value">{{ currentResult.summary.durationDays }} days</span>
                <span class="diff-value" [class]="getDiffClass(currentResult.summary.durationDays - savedResult.summary.durationDays)">
                  {{ getDiffDisplay(currentResult.summary.durationDays - savedResult.summary.durationDays, 'number') }} days
                </span>
              </div>

              <div class="comparison-row highlight">
                <span class="row-label">Total Impressions</span>
                <span class="saved-value">{{ formatBigNumber(savedResult.summary.totalImpressions) }}</span>
                <span class="current-value">{{ formatBigNumber(currentResult.summary.totalImpressions) }}</span>
                <span class="diff-value" [class]="getDiffClass(currentResult.summary.totalImpressions - savedResult.summary.totalImpressions)">
                  {{ getDiffDisplay(currentResult.summary.totalImpressions - savedResult.summary.totalImpressions, 'impressions') }}
                </span>
              </div>

              <div class="comparison-row highlight">
                <span class="row-label">Total Reach</span>
                <span class="saved-value">{{ formatBigNumber(savedResult.summary.totalReach) }}</span>
                <span class="current-value">{{ formatBigNumber(currentResult.summary.totalReach) }}</span>
                <span class="diff-value" [class]="getDiffClass(currentResult.summary.totalReach - savedResult.summary.totalReach)">
                  {{ getDiffDisplay(currentResult.summary.totalReach - savedResult.summary.totalReach, 'reach') }}
                </span>
              </div>
            </div>
          </section>

          <!-- Channel Comparison -->
          <section class="comparison-section">
            <h3>📊 By Channel</h3>
            <div class="channel-comparison">
              <div
                *ngFor="let channel of getChannelComparison()"
                class="channel-row"
              >
                <div class="channel-info">
                  <span class="channel-emoji">{{ getChannelEmoji(channel.channelId) }}</span>
                  <span class="channel-name">{{ getChannelLabel(channel.channelId) }}</span>
                </div>

                <div class="channel-bars">
                  <div class="bar-container">
                    <div
                      class="bar saved-bar"
                      [style.width.%]="channel.savedPercent"
                    ></div>
                    <span class="bar-label">{{ channel.savedPercent | number : '1.0-0' }}%</span>
                  </div>
                  <div class="bar-container">
                    <div
                      class="bar current-bar"
                      [style.width.%]="channel.currentPercent"
                    ></div>
                    <span class="bar-label">{{ channel.currentPercent | number : '1.0-0' }}%</span>
                  </div>
                </div>

                <div class="channel-diff" [class]="getDiffClass(channel.diffPercent)">
                  {{ getDiffDisplay(channel.diffPercent, 'percent') }}
                </div>
              </div>
            </div>
          </section>

          <!-- Legend -->
          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot saved"></span>
              <span>Saved scenario</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot current"></span>
              <span>Current scenario</span>
            </div>
          </div>
        </div>

        <div class="modal-body empty" *ngIf="!savedResult">
          <div class="empty-state">
            <span class="empty-icon">📁</span>
            <h3>No Saved Scenario</h3>
            <p>
              Save your current scenario first by clicking "Save Scenario" in
              the results panel.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn secondary" *ngIf="savedResult" (click)="clearSaved()">
            Clear Saved
          </button>
          <button class="btn primary" (click)="close()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--space-lg);
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-content {
        background: var(--bg-card);
        border-radius: var(--radius-xl);
        max-width: 650px;
        width: 100%;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-lg) var(--space-xl);
        border-bottom: 1px solid var(--border-color);
      }

      .modal-header h2 {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: 0;
        font-size: 1.25rem;
      }

      .header-icon {
        font-size: 1.5rem;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
      }

      .close-btn:hover {
        background: var(--accent-danger);
        color: white;
      }

      .modal-body {
        padding: var(--space-xl);
        overflow-y: auto;
        flex: 1;
      }

      .modal-body.empty {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-state {
        text-align: center;
        padding: var(--space-2xl);
      }

      .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: var(--space-md);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-sm) 0;
        font-size: 1.25rem;
      }

      .empty-state p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .comparison-section {
        margin-bottom: var(--space-xl);
      }

      .comparison-section h3 {
        font-size: 1rem;
        margin: 0 0 var(--space-md) 0;
      }

      .comparison-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .comparison-header,
      .comparison-row {
        display: grid;
        grid-template-columns: 1fr 100px 100px 100px;
        gap: var(--space-md);
        align-items: center;
        padding: var(--space-sm) var(--space-md);
      }

      .comparison-header {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .scenario-label.saved {
        color: var(--accent-secondary);
      }

      .scenario-label.current {
        color: var(--accent-primary);
      }

      .comparison-row {
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
      }

      .comparison-row.highlight {
        background: linear-gradient(
          90deg,
          rgba(59, 130, 246, 0.1),
          rgba(139, 92, 246, 0.1)
        );
      }

      .row-label {
        font-weight: 500;
      }

      .saved-value {
        color: var(--accent-secondary);
      }

      .current-value {
        color: var(--accent-primary);
      }

      .diff-value {
        font-weight: 600;
        text-align: right;
      }

      .diff-value.positive {
        color: var(--accent-success);
      }

      .diff-value.negative {
        color: var(--accent-danger);
      }

      .diff-value.neutral {
        color: var(--text-muted);
      }

      .channel-comparison {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .channel-row {
        display: grid;
        grid-template-columns: 120px 1fr 80px;
        gap: var(--space-md);
        align-items: center;
        padding: var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .channel-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .channel-emoji {
        font-size: 1.25rem;
      }

      .channel-name {
        font-weight: 500;
        font-size: 0.85rem;
      }

      .channel-bars {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .bar-container {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        height: 18px;
      }

      .bar {
        height: 100%;
        border-radius: 4px;
        min-width: 4px;
      }

      .saved-bar {
        background: var(--accent-secondary);
        opacity: 0.7;
      }

      .current-bar {
        background: var(--accent-primary);
      }

      .bar-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        min-width: 35px;
      }

      .channel-diff {
        font-weight: 600;
        font-size: 0.85rem;
        text-align: right;
      }

      .legend {
        display: flex;
        justify-content: center;
        gap: var(--space-xl);
        padding: var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .legend-dot.saved {
        background: var(--accent-secondary);
        opacity: 0.7;
      }

      .legend-dot.current {
        background: var(--accent-primary);
      }

      .scenario-selector {
        padding: var(--space-md) var(--space-xl);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .selector-label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .scenario-pills {
        display: flex;
        gap: var(--space-sm);
        flex-wrap: wrap;
      }

      .scenario-pill {
        padding: var(--space-xs) var(--space-md);
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 500;
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .scenario-pill:hover {
        border-color: var(--accent-secondary);
        color: var(--accent-secondary);
      }

      .scenario-pill.active {
        background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
        color: white;
        border-color: transparent;
      }

      .modal-footer {
        padding: var(--space-lg) var(--space-xl);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: var(--space-md);
      }

      .btn {
        padding: var(--space-sm) var(--space-lg);
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 0.9rem;
        transition: all var(--transition-fast);
      }

      .btn.primary {
        background: linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );
        color: white;
      }

      .btn.primary:hover {
        transform: translateY(-2px);
      }

      .btn.secondary {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
      }

      .btn.secondary:hover {
        border-color: var(--accent-danger);
        color: var(--accent-danger);
      }
    `,
  ],
})
export class CompareModalComponent {
  @Input() isOpen = false;
  @Input() currentResult: PlannerResult | null = null;
  @Input() savedResult: PlannerResult | null = null;
  @Input() savedScenarios: Array<{ name: string; result: PlannerResult; savedAt: Date }> = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() clearSavedScenario = new EventEmitter<void>();
  @Output() selectScenarioIndex = new EventEmitter<number>();

  selectedIndex = 0;

  close(): void {
    this.closeModal.emit();
  }

  clearSaved(): void {
    this.clearSavedScenario.emit();
  }

  selectScenario(index: number): void {
    this.selectedIndex = index;
    this.selectScenarioIndex.emit(index);
  }

  getChannelEmoji(channelId: string): string {
    return getChannelById(channelId)?.emoji || '📊';
  }

  getChannelLabel(channelId: string): string {
    return getChannelById(channelId)?.label || channelId;
  }

  getChannelComparison(): Array<{
    channelId: string;
    savedPercent: number;
    currentPercent: number;
    diffPercent: number;
  }> {
    if (!this.currentResult || !this.savedResult) return [];

    const comparison: Array<{
      channelId: string;
      savedPercent: number;
      currentPercent: number;
      diffPercent: number;
    }> = [];

    for (const current of this.currentResult.allocations) {
      const saved = this.savedResult.allocations.find(
        (a) => a.channelId === current.channelId
      );
      comparison.push({
        channelId: current.channelId,
        savedPercent: saved?.percentage || 0,
        currentPercent: current.percentage,
        diffPercent: current.percentage - (saved?.percentage || 0),
      });
    }

    return comparison;
  }

  getDiffClass(diff: number): string {
    if (Math.abs(diff) < 0.5) return 'neutral';
    return diff > 0 ? 'positive' : 'negative';
  }

  getDiffDisplay(diff: number, type: string): string {
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '';
    const absValue = Math.abs(diff);

    switch (type) {
      case 'currency':
        return `${arrow} $${absValue.toLocaleString()}`;
      case 'number':
        return `${arrow} ${absValue}`;
      case 'percent':
        return `${arrow} ${absValue.toFixed(0)}%`;
      case 'impressions':
      case 'reach':
        return `${arrow} ${this.formatBigNumber(absValue)}`;
      default:
        return `${arrow} ${absValue}`;
    }
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
}

