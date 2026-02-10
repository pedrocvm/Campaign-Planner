import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CampaignService } from './services/campaign.service';
import { BudgetInput, BudgetResult, CampaignGoal } from './models/campaign.models';
import { ResultsComponent } from './components/results/results.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ResultsComponent],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <span class="logo-icon">📊</span>
              <div class="logo-text">
                <h1>Campaign Budget Optimizer</h1>
                <p class="tagline">Smart budget allocation for maximum reach</p>
              </div>
            </div>
            <div class="status-indicator" [class.connected]="isConnected" [class.disconnected]="!isConnected">
              <span class="status-dot"></span>
              <span class="status-text">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <div class="container">
          <div class="grid-layout">
            <!-- Input Form -->
            <section class="input-section animate-slide-up">
              <div class="card">
                <div class="card-header">
                  <h2>Campaign Parameters</h2>
                  <p class="card-subtitle">Enter your campaign details to get optimized budget allocation</p>
                </div>
                
                <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="form">
                  <!-- Budget Input -->
                  <div class="form-group">
                    <label for="totalBudget">
                      <span class="label-icon">💰</span>
                      Total Budget (USD)
                    </label>
                    <div class="input-wrapper">
                      <span class="input-prefix">$</span>
                      <input
                        type="number"
                        id="totalBudget"
                        formControlName="totalBudget"
                        placeholder="10000"
                        min="100"
                        class="input-with-prefix"
                      />
                    </div>
                    <div class="error-message" *ngIf="budgetForm.get('totalBudget')?.touched && budgetForm.get('totalBudget')?.errors">
                      <span *ngIf="budgetForm.get('totalBudget')?.errors?.['required']">Budget is required</span>
                      <span *ngIf="budgetForm.get('totalBudget')?.errors?.['min']">Minimum budget is $100</span>
                    </div>
                  </div>

                  <!-- Duration Input -->
                  <div class="form-group">
                    <label for="durationDays">
                      <span class="label-icon">📅</span>
                      Campaign Duration (Days)
                    </label>
                    <input
                      type="number"
                      id="durationDays"
                      formControlName="durationDays"
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                    <div class="error-message" *ngIf="budgetForm.get('durationDays')?.touched && budgetForm.get('durationDays')?.errors">
                      <span *ngIf="budgetForm.get('durationDays')?.errors?.['required']">Duration is required</span>
                      <span *ngIf="budgetForm.get('durationDays')?.errors?.['min']">Minimum is 1 day</span>
                      <span *ngIf="budgetForm.get('durationDays')?.errors?.['max']">Maximum is 365 days</span>
                    </div>
                  </div>

                  <!-- Goal Selection -->
                  <div class="form-group">
                    <label>
                      <span class="label-icon">🎯</span>
                      Optimization Goal
                    </label>
                    <div class="goal-buttons">
                      <button
                        type="button"
                        *ngFor="let goal of goals"
                        class="goal-btn"
                        [class.active]="selectedGoal === goal.value"
                        (click)="selectGoal(goal.value)"
                      >
                        <span class="goal-icon">{{ goal.icon }}</span>
                        <span class="goal-label">{{ goal.label }}</span>
                        <span class="goal-description">{{ goal.description }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Advanced Options Toggle -->
                  <div class="advanced-toggle" (click)="showAdvanced = !showAdvanced">
                    <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
                    <span>Advanced Options</span>
                  </div>

                  <!-- Advanced Options -->
                  <div class="advanced-options" *ngIf="showAdvanced">
                    <div class="form-row">
                      <div class="form-group half">
                        <label for="minChannelPercentage">Min Channel %</label>
                        <input
                          type="number"
                          id="minChannelPercentage"
                          formControlName="minChannelPercentage"
                          min="0"
                          max="33"
                        />
                      </div>
                      <div class="form-group half">
                        <label for="maxChannelPercentage">Max Channel %</label>
                        <input
                          type="number"
                          id="maxChannelPercentage"
                          formControlName="maxChannelPercentage"
                          min="34"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    class="submit-btn"
                    [disabled]="!budgetForm.valid || loading"
                  >
                    <span *ngIf="!loading" class="btn-content">
                      <span class="btn-icon">⚡</span>
                      Calculate Optimal Distribution
                    </span>
                    <span *ngIf="loading" class="btn-loading">
                      <span class="spinner"></span>
                      Calculating...
                    </span>
                  </button>

                  <!-- Quick Examples -->
                  <div class="quick-examples">
                    <span class="examples-label">Quick examples:</span>
                    <button type="button" class="example-btn" (click)="loadExample('small')">$5k / 14 days</button>
                    <button type="button" class="example-btn" (click)="loadExample('medium')">$10k / 30 days</button>
                    <button type="button" class="example-btn" (click)="loadExample('large')">$50k / 60 days</button>
                  </div>
                </form>
              </div>
            </section>

            <!-- Results Section -->
            <section class="results-section" [class.animate-slide-up]="result">
              <app-results
                [result]="result"
                [loading]="loading"
                [error]="error"
              ></app-results>
            </section>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>Campaign Budget Optimizer • Built for Political Ad Campaigns</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: var(--space-lg) 0;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .logo-icon {
      font-size: 2.5rem;
    }

    .logo-text h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .tagline {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-indicator.connected {
      background: rgba(16, 185, 129, 0.1);
      color: var(--accent-success);
    }

    .status-indicator.disconnected {
      background: rgba(239, 68, 68, 0.1);
      color: var(--accent-danger);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      padding: var(--space-2xl) 0;
    }

    .grid-layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: var(--space-xl);
      align-items: start;
    }

    @media (max-width: 1024px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Card */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      box-shadow: var(--shadow-lg);
    }

    .card-header {
      margin-bottom: var(--space-xl);
    }

    .card-header h2 {
      margin: 0 0 var(--space-xs) 0;
      font-size: 1.25rem;
    }

    .card-subtitle {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* Form */
    .form-group {
      margin-bottom: var(--space-lg);
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-sm);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .label-icon {
      font-size: 1.1rem;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: var(--space-md);
      font-size: 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      transition: all var(--transition-fast);
    }

    .form-group input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--border-glow);
    }

    .input-wrapper {
      position: relative;
    }

    .input-prefix {
      position: absolute;
      left: var(--space-md);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-weight: 500;
    }

    .input-with-prefix {
      padding-left: 2rem !important;
    }

    .error-message {
      color: var(--accent-danger);
      font-size: 0.8rem;
      margin-top: var(--space-xs);
    }

    /* Goal Buttons */
    .goal-buttons {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .goal-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: var(--space-md);
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      text-align: left;
      transition: all var(--transition-fast);
    }

    .goal-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--text-muted);
    }

    .goal-btn.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: var(--accent-primary);
    }

    .goal-icon {
      font-size: 1.25rem;
      margin-bottom: var(--space-xs);
    }

    .goal-label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .goal-description {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* Advanced Options */
    .advanced-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .advanced-toggle:hover {
      color: var(--text-primary);
    }

    .toggle-icon {
      font-size: 0.7rem;
    }

    .advanced-options {
      margin-top: var(--space-md);
      padding: var(--space-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    }

    .form-row {
      display: flex;
      gap: var(--space-md);
    }

    .form-group.half {
      flex: 1;
    }

    /* Submit Button */
    .submit-btn {
      width: 100%;
      padding: var(--space-md) var(--space-xl);
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: white;
      font-size: 1rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      margin-top: var(--space-lg);
      box-shadow: var(--shadow-md);
      transition: all var(--transition-base);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-glow);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
    }

    .btn-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Quick Examples */
    .quick-examples {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      flex-wrap: wrap;
    }

    .examples-label {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .example-btn {
      padding: var(--space-xs) var(--space-sm);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.75rem;
    }

    .example-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--accent-primary);
    }

    /* Footer */
    .footer {
      padding: var(--space-lg) 0;
      border-top: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  budgetForm!: FormGroup;
  loading = false;
  result: BudgetResult | null = null;
  error: string | null = null;
  isConnected = false;
  showAdvanced = false;
  selectedGoal: CampaignGoal = 'balanced';

  goals = [
    { value: 'reach' as CampaignGoal, label: 'Maximum Reach', icon: '📢', description: 'Prioritize audience size' },
    { value: 'engagement' as CampaignGoal, label: 'High Engagement', icon: '❤️', description: 'Focus on interaction quality' },
    { value: 'balanced' as CampaignGoal, label: 'Balanced', icon: '⚖️', description: 'Optimize for both reach and engagement' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkApiHealth();
    this.subscribeToState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.budgetForm = this.fb.group({
      totalBudget: [10000, [Validators.required, Validators.min(100)]],
      durationDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      goal: ['balanced'],
      minChannelPercentage: [10],
      maxChannelPercentage: [60],
    });
  }

  private checkApiHealth(): void {
    this.campaignService.checkHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.isConnected = true,
        error: () => this.isConnected = false,
      });
  }

  private subscribeToState(): void {
    this.campaignService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.campaignService.result$
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => this.result = result);

    this.campaignService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);
  }

  selectGoal(goal: CampaignGoal): void {
    this.selectedGoal = goal;
    this.budgetForm.patchValue({ goal });
  }

  onSubmit(): void {
    if (this.budgetForm.valid) {
      const input: BudgetInput = this.budgetForm.value;
      this.campaignService.calculateDistribution(input)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  loadExample(type: 'small' | 'medium' | 'large'): void {
    const examples = {
      small: { totalBudget: 5000, durationDays: 14 },
      medium: { totalBudget: 10000, durationDays: 30 },
      large: { totalBudget: 50000, durationDays: 60 },
    };

    this.budgetForm.patchValue(examples[type]);
  }
}

