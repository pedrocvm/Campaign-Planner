import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlannerInsight } from '../../models/planner.models';

@Component({
  selector: 'app-warnings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="insights-container" *ngIf="insights && insights.length > 0">
      <h4 class="insights-title">
        <span class="title-icon">💡</span>
        Insights & Recommendations
      </h4>
      <div class="insights-list">
        <div
          *ngFor="let insight of insights"
          class="insight-item"
          [class.warning]="insight.type === 'warning'"
          [class.info]="insight.type === 'info'"
          [class.tip]="insight.type === 'tip'"
        >
          <span class="insight-icon">{{ insight.icon }}</span>
          <div class="insight-content">
            <strong class="insight-title">{{ insight.title }}</strong>
            <p class="insight-message">{{ insight.message }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .insights-container {
        margin-top: var(--space-lg);
        padding: var(--space-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
      }

      .insights-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: 0 0 var(--space-md) 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .title-icon {
        font-size: 1.25rem;
      }

      .insights-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .insight-item {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-md);
        border-radius: var(--radius-md);
        border-left: 3px solid;
      }

      .insight-item.warning {
        background: rgba(245, 158, 11, 0.08);
        border-left-color: var(--accent-warning);
      }

      .insight-item.info {
        background: rgba(59, 130, 246, 0.08);
        border-left-color: var(--accent-primary);
      }

      .insight-item.tip {
        background: rgba(16, 185, 129, 0.08);
        border-left-color: var(--accent-success);
      }

      .insight-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .insight-content {
        flex: 1;
      }

      .insight-title {
        display: block;
        font-size: 0.9rem;
        margin-bottom: 4px;
      }

      .insight-message {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    `,
  ],
})
export class WarningsComponent {
  @Input() insights: PlannerInsight[] = [];
}


