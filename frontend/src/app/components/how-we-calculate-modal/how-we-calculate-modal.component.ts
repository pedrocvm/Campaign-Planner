import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHANNEL_CONFIGS, GOAL_WEIGHTS } from '../../config/campaign-config';

@Component({
  selector: 'app-how-we-calculate-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>
            <span class="header-icon">🧮</span>
            How We Calculate
          </h2>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Formulas Section -->
          <section class="section">
            <h3>📊 Key Formulas</h3>
            <div class="formula-card">
              <div class="formula-item">
                <span class="formula-label">Impressions</span>
                <code class="formula"
                  >impressions = (channel_budget / CPM) × 1,000</code
                >
                <p class="formula-desc">
                  How many times your ad will be shown. CPM = cost per 1,000
                  impressions.
                </p>
              </div>
              <div class="formula-item">
                <span class="formula-label">Reach (Unique Users)</span>
                <code class="formula"
                  >reach = impressions / frequency</code
                >
                <p class="formula-desc">
                  Estimated number of different people who will see your ad.
                  Frequency = average views per user.
                </p>
              </div>
            </div>
          </section>

          <!-- Goal Impact Section -->
          <section class="section">
            <h3>🎯 How Goals Affect Distribution</h3>
            <div class="goal-cards">
              <div class="goal-card">
                <div class="goal-header reach">
                  <span>📢</span>
                  <strong>Reach</strong>
                </div>
                <p>
                  Prioritizes channels with the <strong>lowest CPM</strong> to
                  maximize the number of people reached. Display ads typically
                  dominate.
                </p>
                <div class="weight-bar">
                  <div class="weight-segment cpm" style="width: 100%">
                    100% CPM efficiency
                  </div>
                </div>
              </div>

              <div class="goal-card">
                <div class="goal-header engagement">
                  <span>❤️</span>
                  <strong>Engagement</strong>
                </div>
                <p>
                  Prioritizes channels with
                  <strong>higher engagement rates</strong> like Video, even if
                  they cost more.
                </p>
                <div class="weight-bar">
                  <div class="weight-segment cpm" style="width: 30%">30%</div>
                  <div class="weight-segment eng" style="width: 70%">
                    70% Engagement
                  </div>
                </div>
              </div>

              <div class="goal-card">
                <div class="goal-header balanced">
                  <span>⚖️</span>
                  <strong>Balanced</strong>
                </div>
                <p>
                  A mix of both: some reach efficiency plus engagement
                  potential.
                </p>
                <div class="weight-bar">
                  <div class="weight-segment cpm" style="width: 60%">60%</div>
                  <div class="weight-segment eng" style="width: 40%">40%</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Default Values Section -->
          <section class="section">
            <h3>📋 Default Assumptions</h3>
            <p class="section-intro">
              These are industry-average values we use when you don't provide
              custom overrides in Advanced Options:
            </p>
            <table class="defaults-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Default CPM</th>
                  <th>Avg. Frequency</th>
                  <th>Engagement Score</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let channel of channels">
                  <td>
                    <span class="channel-emoji">{{ channel.emoji }}</span>
                    {{ channel.label }}
                  </td>
                  <td>\${{ channel.defaultCPM }}</td>
                  <td>{{ channel.defaultFrequency }}x</td>
                  <td>
                    <div class="score-bar">
                      <div
                        class="score-fill"
                        [style.width.%]="channel.engagementWeight * 10"
                      ></div>
                    </div>
                    {{ channel.engagementWeight }}/10
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Constraints Section -->
          <section class="section">
            <h3>🔒 Min/Max Constraints</h3>
            <ul class="constraints-list">
              <li>
                <strong>Minimum %:</strong> Guarantees each channel gets at
                least this share of budget, regardless of efficiency.
              </li>
              <li>
                <strong>Maximum %:</strong> Prevents over-concentration in a
                single channel for diversification.
              </li>
              <li>
                <strong>Enabled/Disabled:</strong> Disabled channels receive 0%
                allocation.
              </li>
              <li>
                <strong>CPM/Frequency Override:</strong> Use your own data
                instead of our defaults for more accurate estimates.
              </li>
            </ul>
          </section>

          <!-- Disclaimer -->
          <div class="disclaimer">
            <span class="disclaimer-icon">⚠️</span>
            <p>
              These are estimates based on industry averages. Actual results
              depend on targeting, creative quality, competition, and other
              factors. Use these as planning guidelines, not guarantees.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="close-btn-primary" (click)="close()">Got it!</button>
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
        max-width: 700px;
        width: 100%;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
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

      .section {
        margin-bottom: var(--space-xl);
      }

      .section h3 {
        font-size: 1rem;
        margin: 0 0 var(--space-md) 0;
        color: var(--text-primary);
      }

      .section-intro {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin: 0 0 var(--space-md) 0;
      }

      .formula-card {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .formula-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .formula-label {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--accent-primary);
      }

      .formula {
        font-family: var(--font-mono);
        font-size: 0.9rem;
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-card);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
      }

      .formula-desc {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .goal-cards {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .goal-card {
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
      }

      .goal-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
        font-size: 0.95rem;
      }

      .goal-header.reach {
        color: var(--channel-display);
      }
      .goal-header.engagement {
        color: var(--channel-video);
      }
      .goal-header.balanced {
        color: var(--accent-secondary);
      }

      .goal-card p {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0 0 var(--space-sm) 0;
        line-height: 1.5;
      }

      .weight-bar {
        display: flex;
        height: 24px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        font-size: 0.7rem;
        font-weight: 600;
      }

      .weight-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .weight-segment.cpm {
        background: var(--channel-display);
      }

      .weight-segment.eng {
        background: var(--channel-video);
      }

      .defaults-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }

      .defaults-table th,
      .defaults-table td {
        padding: var(--space-sm) var(--space-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      .defaults-table th {
        background: var(--bg-secondary);
        font-weight: 600;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .channel-emoji {
        margin-right: var(--space-xs);
      }

      .score-bar {
        display: inline-block;
        width: 60px;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        margin-right: var(--space-xs);
        vertical-align: middle;
      }

      .score-fill {
        height: 100%;
        background: linear-gradient(
          90deg,
          var(--accent-warning),
          var(--accent-success)
        );
      }

      .constraints-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .constraints-list li {
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .constraints-list li strong {
        color: var(--text-primary);
      }

      .disclaimer {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-md);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--accent-warning);
      }

      .disclaimer-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .disclaimer p {
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .modal-footer {
        padding: var(--space-lg) var(--space-xl);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
      }

      .close-btn-primary {
        padding: var(--space-sm) var(--space-xl);
        background: linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );
        color: white;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 0.95rem;
        transition: all var(--transition-fast);
      }

      .close-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
    `,
  ],
})
export class HowWeCalculateModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  channels = CHANNEL_CONFIGS;
  goalWeights = GOAL_WEIGHTS;

  close(): void {
    this.closeModal.emit();
  }
}


