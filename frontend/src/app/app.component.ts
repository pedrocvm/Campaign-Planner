import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CampaignService } from './services/campaign.service';
import { PlannerCalculatorService } from './services/planner-calculator.service';
import {
  BudgetInput,
  BudgetResult,
  CampaignGoal,
} from './models/campaign.models';
import {
  PlannerInput,
  PlannerResult,
  ValidationResult,
  ChannelSettings,
} from './models/planner.models';
import { ResultsComponent } from './components/results/results.component';
import {
  AdvancedOptionsComponent,
  AdvancedOptionsState,
} from './components/advanced-options/advanced-options.component';
import { CHANNEL_CONFIGS, DEFAULT_CONSTRAINTS } from './config/campaign-config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ResultsComponent,
    AdvancedOptionsComponent,
  ],
  template: `
    <div class="app-container" [class.light-theme]="isLightTheme">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <span class="logo-icon">📊</span>
              <div class="logo-text">
                <h1>Campaign Planner</h1>
                <p class="tagline">
                  Find the best way to invest your ad budget
                </p>
              </div>
            </div>
            <div class="header-actions">
              <!-- Theme Toggle -->
              <button
                class="theme-toggle"
                (click)="toggleTheme()"
                [attr.aria-label]="
                  isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'
                "
              >
                <span class="theme-icon">{{ isLightTheme ? '🌙' : '☀️' }}</span>
                <span class="theme-label">{{
                  isLightTheme ? 'Dark' : 'Light'
                }}</span>
              </button>

              <div
                class="status-indicator"
                [class.connected]="isConnected"
                [class.disconnected]="!isConnected"
              >
                <span class="status-dot"></span>
                <span class="status-text">{{
                  isConnected ? 'Online' : 'Offline'
                }}</span>
              </div>
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
                  <h2>🚀 Set Up Your Campaign</h2>
                  <p class="card-subtitle">
                    Enter your details below to see how to distribute your
                    budget
                  </p>
                </div>

                <form
                  [formGroup]="budgetForm"
                  (ngSubmit)="onSubmit()"
                  class="form"
                >
                  <!-- Budget Input -->
                  <div class="form-group">
                    <label for="totalBudget">
                      <span class="label-icon">💰</span>
                      How much do you want to invest?
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
                    <span class="input-hint"
                      >Total campaign budget in dollars</span
                    >
                    <div
                      class="error-message"
                      *ngIf="
                        budgetForm.get('totalBudget')?.touched &&
                        budgetForm.get('totalBudget')?.errors
                      "
                    >
                      <span
                        *ngIf="budgetForm.get('totalBudget')?.errors?.['required']"
                        >Please enter a value</span
                      >
                      <span
                        *ngIf="budgetForm.get('totalBudget')?.errors?.['min']"
                        >Minimum budget is $100</span
                      >
                    </div>
                  </div>

                  <!-- Duration Input -->
                  <div class="form-group">
                    <label for="durationDays">
                      <span class="label-icon">📅</span>
                      For how many days?
                    </label>
                    <input
                      type="number"
                      id="durationDays"
                      formControlName="durationDays"
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                    <span class="input-hint">Campaign duration</span>
                    <div
                      class="error-message"
                      *ngIf="
                        budgetForm.get('durationDays')?.touched &&
                        budgetForm.get('durationDays')?.errors
                      "
                    >
                      <span
                        *ngIf="budgetForm.get('durationDays')?.errors?.['required']"
                        >Please enter duration</span
                      >
                      <span
                        *ngIf="budgetForm.get('durationDays')?.errors?.['min']"
                        >Minimum is 1 day</span
                      >
                      <span
                        *ngIf="budgetForm.get('durationDays')?.errors?.['max']"
                        >Maximum is 365 days</span
                      >
                    </div>
                  </div>

                  <!-- Goal Selection -->
                  <div class="form-group">
                    <label>
                      <span class="label-icon">🎯</span>
                      What's your main goal?
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
                        <div class="goal-text">
                          <span class="goal-label">{{ goal.label }}</span>
                          <span class="goal-description">{{
                            goal.description
                          }}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Advanced Options Toggle -->
                  <div
                    class="advanced-toggle"
                    (click)="showAdvanced = !showAdvanced"
                  >
                    <span class="toggle-icon">{{
                      showAdvanced ? '▼' : '▶'
                    }}</span>
                    <span>Advanced options</span>
                    <span
                      class="advanced-badge"
                      *ngIf="hasCustomAdvancedSettings"
                      >Customized</span
                    >
                  </div>

                  <!-- Advanced Options v2 -->
                  <div class="advanced-options" *ngIf="showAdvanced">
                    <app-advanced-options
                      [globalMinPercent]="advancedState.globalMinPercent"
                      [globalMaxPercent]="advancedState.globalMaxPercent"
                      [validationResult]="validationResult"
                      (stateChange)="onAdvancedOptionsChange($event)"
                    ></app-advanced-options>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    class="submit-btn"
                    [disabled]="!isFormValid || loading"
                  >
                    <span *ngIf="!loading" class="btn-content">
                      <span class="btn-icon">✨</span>
                      Calculate Best Distribution
                    </span>
                    <span *ngIf="loading" class="btn-loading">
                      <span class="spinner"></span>
                      Calculating...
                    </span>
                  </button>

                  <!-- Quick Examples -->
                  <div class="quick-examples">
                    <span class="examples-label">Quick examples:</span>
                    <button
                      type="button"
                      class="example-btn"
                      (click)="loadExample('small')"
                    >
                      <span class="example-name">Short campaign</span>
                      <span class="example-detail">$5k • 14 days</span>
                    </button>
                    <button
                      type="button"
                      class="example-btn"
                      (click)="loadExample('medium')"
                    >
                      <span class="example-name">Medium campaign</span>
                      <span class="example-detail">$10k • 30 days</span>
                    </button>
                    <button
                      type="button"
                      class="example-btn"
                      (click)="loadExample('large')"
                    >
                      <span class="example-name">Large campaign</span>
                      <span class="example-detail">$50k • 60 days</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Help Card -->
              <div class="card help-card">
                <h3>💡 How does it work?</h3>
                <div class="help-items">
                  <div class="help-item">
                    <span class="help-number">1</span>
                    <div class="help-text">
                      <strong>Enter your budget</strong>
                      <p>Tell us how much you have available to invest</p>
                    </div>
                  </div>
                  <div class="help-item">
                    <span class="help-number">2</span>
                    <div class="help-text">
                      <strong>Choose the duration</strong>
                      <p>How many days will your campaign run</p>
                    </div>
                  </div>
                  <div class="help-item">
                    <span class="help-number">3</span>
                    <div class="help-text">
                      <strong>Define your goal</strong>
                      <p>What matters most: reach or engagement?</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Results Section -->
            <section
              class="results-section"
              [class.animate-slide-up]="result || plannerResult"
            >
              <app-results
                [result]="result"
                [plannerResult]="plannerResult"
                [loading]="loading"
                [error]="error"
                [videoDisplayBias]="videoDisplayBias"
                [showSlider]="true"
                (biasChange)="onVideoDisplayBiasChange($event)"
                (shareLinkRequested)="copyShareableLink()"
              ></app-results>
            </section>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>Campaign Planner • Built to simplify your media decisions</p>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* Light theme uses global CSS variables from styles.css */

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

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-md);
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

      /* Theme Toggle */
      .theme-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .theme-toggle:hover {
        border-color: var(--accent-primary);
        background: var(--bg-card-hover);
      }

      .theme-icon {
        font-size: 1.1rem;
      }

      .theme-label {
        display: none;
      }

      @media (min-width: 640px) {
        .theme-label {
          display: inline;
        }
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
        grid-template-columns: 420px 1fr;
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
        margin-bottom: var(--space-lg);
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
        font-size: 0.9rem;
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
        font-size: 1rem;
      }

      .label-icon {
        font-size: 1.25rem;
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: var(--space-md) var(--space-lg);
        font-size: 1.1rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
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
        font-weight: 600;
        font-size: 1.1rem;
      }

      .input-with-prefix {
        padding-left: 2.5rem !important;
      }

      .input-hint {
        display: block;
        color: var(--text-muted);
        font-size: 0.8rem;
        margin-top: var(--space-xs);
      }

      .error-message {
        color: var(--accent-danger);
        font-size: 0.85rem;
        margin-top: var(--space-xs);
        padding: var(--space-xs) var(--space-sm);
        background: rgba(239, 68, 68, 0.1);
        border-radius: var(--radius-sm);
      }

      /* Goal Buttons */
      .goal-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .goal-btn {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-md) var(--space-lg);
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        text-align: left;
        transition: all var(--transition-fast);
      }

      .goal-btn:hover {
        background: var(--bg-card-hover);
        border-color: var(--text-muted);
        transform: translateX(4px);
      }

      .goal-btn.active {
        background: rgba(59, 130, 246, 0.15);
        border-color: var(--accent-primary);
      }

      .goal-icon {
        font-size: 1.75rem;
      }

      .goal-text {
        display: flex;
        flex-direction: column;
      }

      .goal-label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .goal-description {
        font-size: 0.85rem;
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
        padding: var(--space-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .advanced-hint {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin: 0 0 var(--space-md) 0;
      }

      .advanced-badge {
        margin-left: auto;
        padding: 2px 8px;
        background: var(--accent-primary);
        color: white;
        border-radius: var(--radius-full);
        font-size: 0.7rem;
        font-weight: 500;
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
        padding: var(--space-lg) var(--space-xl);
        background: linear-gradient(
          135deg,
          var(--accent-primary),
          var(--accent-secondary)
        );
        color: white;
        font-size: 1.1rem;
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
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Quick Examples */
      .quick-examples {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        margin-top: var(--space-xl);
      }

      .examples-label {
        color: var(--text-muted);
        font-size: 0.85rem;
        margin-bottom: var(--space-xs);
      }

      .example-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        transition: all var(--transition-fast);
      }

      .example-btn:hover {
        background: var(--bg-card-hover);
        color: var(--text-primary);
        border-color: var(--accent-primary);
      }

      .example-name {
        font-weight: 500;
        font-size: 0.9rem;
      }

      .example-detail {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      /* Help Card */
      .help-card {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.08),
          rgba(139, 92, 246, 0.05)
        );
        border-color: rgba(59, 130, 246, 0.2);
      }

      .help-card h3 {
        margin: 0 0 var(--space-lg) 0;
        font-size: 1.1rem;
      }

      .help-items {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .help-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
      }

      .help-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: var(--accent-primary);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.85rem;
        flex-shrink: 0;
      }

      .help-text {
        flex: 1;
      }

      .help-text strong {
        display: block;
        font-size: 0.9rem;
        margin-bottom: 2px;
      }

      .help-text p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.8rem;
      }

      /* Footer */
      .footer {
        padding: var(--space-lg) 0;
        border-top: 1px solid var(--border-color);
        text-align: center;
        color: var(--text-muted);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  budgetForm!: FormGroup;
  loading = false;
  result: BudgetResult | null = null;
  plannerResult: PlannerResult | null = null;
  error: string | null = null;
  isConnected = false;
  showAdvanced = false;
  selectedGoal: CampaignGoal = 'balanced';
  isLightTheme = false;

  // Advanced Options State
  advancedState: AdvancedOptionsState = {
    globalMinPercent: DEFAULT_CONSTRAINTS.minPerChannel,
    globalMaxPercent: DEFAULT_CONSTRAINTS.maxPerChannel,
    channelSettings: [],
  };
  validationResult: ValidationResult | null = null;

  // Video/Display slider
  videoDisplayBias = 0;

  goals = [
    {
      value: 'reach' as CampaignGoal,
      label: 'Reach more people',
      icon: '📢',
      description: 'Great for brand awareness and visibility',
    },
    {
      value: 'engagement' as CampaignGoal,
      label: 'More engagement',
      icon: '❤️',
      description: 'Focus on likes, comments, and shares',
    },
    {
      value: 'balanced' as CampaignGoal,
      label: 'Balanced',
      icon: '⚖️',
      description: 'A bit of both: reach + engagement',
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private plannerCalculator: PlannerCalculatorService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initAdvancedState();
    this.checkApiHealth();
    this.subscribeToState();
    this.loadThemePreference();
    this.loadFromQueryParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.budgetForm = this.fb.group({
      totalBudget: [10000, [Validators.required, Validators.min(100)]],
      durationDays: [
        30,
        [Validators.required, Validators.min(1), Validators.max(365)],
      ],
      goal: ['balanced'],
      minChannelPercentage: [10],
      maxChannelPercentage: [60],
    });
  }

  private checkApiHealth(): void {
    this.campaignService
      .checkHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => (this.isConnected = true),
        error: () => (this.isConnected = false),
      });
  }

  private subscribeToState(): void {
    this.campaignService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.loading = loading));

    this.campaignService.result$
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => (this.result = result));

    this.campaignService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => (this.error = error));
  }

  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('campaign-planner-theme');
    if (savedTheme) {
      this.isLightTheme = savedTheme === 'light';
    } else {
      // Check system preference
      this.isLightTheme = window.matchMedia(
        '(prefers-color-scheme: light)'
      ).matches;
    }
  }

  toggleTheme(): void {
    this.isLightTheme = !this.isLightTheme;
    localStorage.setItem(
      'campaign-planner-theme',
      this.isLightTheme ? 'light' : 'dark'
    );
  }

  selectGoal(goal: CampaignGoal): void {
    this.selectedGoal = goal;
    this.budgetForm.patchValue({ goal });
  }

  onSubmit(): void {
    if (this.budgetForm.valid) {
      // Use frontend calculator
      this.calculateWithPlanner();

      // Also call backend for comparison (optional, can be removed)
      const input: BudgetInput = this.budgetForm.value;
      this.campaignService
        .calculateDistribution(input)
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

  // Advanced Options
  private initAdvancedState(): void {
    this.advancedState = {
      globalMinPercent: DEFAULT_CONSTRAINTS.minPerChannel,
      globalMaxPercent: DEFAULT_CONSTRAINTS.maxPerChannel,
      channelSettings: CHANNEL_CONFIGS.map((config) => ({
        channelId: config.id,
        enabled: true,
        minPercent: DEFAULT_CONSTRAINTS.minPerChannel,
        maxPercent: DEFAULT_CONSTRAINTS.maxPerChannel,
        cpmOverride: undefined,
        frequencyOverride: undefined,
      })),
    };
  }

  onAdvancedOptionsChange(state: AdvancedOptionsState): void {
    this.advancedState = state;
    this.validateCurrentInput();
  }

  private validateCurrentInput(): void {
    const input = this.buildPlannerInput();
    this.validationResult = this.plannerCalculator.validateConstraints(input);
  }

  private buildPlannerInput(): PlannerInput {
    const formValue = this.budgetForm.value;
    return {
      totalBudget: formValue.totalBudget || 0,
      durationDays: formValue.durationDays || 1,
      goal: this.selectedGoal,
      globalMinPercent: this.advancedState.globalMinPercent,
      globalMaxPercent: this.advancedState.globalMaxPercent,
      channelSettings: this.advancedState.channelSettings,
      videoDisplayBias: this.videoDisplayBias,
    };
  }

  get hasCustomAdvancedSettings(): boolean {
    // Check if any channel has overrides
    return this.advancedState.channelSettings.some(
      (c) =>
        !c.enabled ||
        c.cpmOverride !== undefined ||
        c.frequencyOverride !== undefined ||
        c.minPercent !== this.advancedState.globalMinPercent ||
        c.maxPercent !== this.advancedState.globalMaxPercent
    );
  }

  get isFormValid(): boolean {
    return (
      this.budgetForm.valid &&
      (this.validationResult === null || this.validationResult.isValid)
    );
  }

  // Slider change handler (will be called from results component)
  onVideoDisplayBiasChange(bias: number): void {
    this.videoDisplayBias = bias;
    // Recalculate with new bias
    if (this.plannerResult) {
      this.calculateWithPlanner();
    }
  }

  private calculateWithPlanner(): void {
    const input = this.buildPlannerInput();
    this.plannerResult = this.plannerCalculator.calculatePlan(input);
  }

  // Query params for shareable link
  private loadFromQueryParams(): void {
    const params = new URLSearchParams(window.location.search);

    const budget = params.get('budget');
    const days = params.get('days');
    const goal = params.get('goal');
    const minPct = params.get('minPct');
    const maxPct = params.get('maxPct');
    const slider = params.get('slider');

    if (budget || days || goal) {
      this.budgetForm.patchValue({
        totalBudget: budget ? parseInt(budget, 10) : 10000,
        durationDays: days ? parseInt(days, 10) : 30,
        goal: goal || 'balanced',
      });

      if (goal) {
        this.selectedGoal = goal as CampaignGoal;
      }

      if (minPct) {
        this.advancedState.globalMinPercent = parseInt(minPct, 10);
      }
      if (maxPct) {
        this.advancedState.globalMaxPercent = parseInt(maxPct, 10);
      }
      if (slider) {
        this.videoDisplayBias = parseInt(slider, 10);
      }

      // Auto-calculate if valid
      setTimeout(() => {
        if (this.budgetForm.valid) {
          this.onSubmit();
        }
      }, 500);
    }
  }

  generateShareableLink(): string {
    const formValue = this.budgetForm.value;
    const params = new URLSearchParams({
      budget: formValue.totalBudget?.toString() || '10000',
      days: formValue.durationDays?.toString() || '30',
      goal: this.selectedGoal,
      minPct: this.advancedState.globalMinPercent.toString(),
      maxPct: this.advancedState.globalMaxPercent.toString(),
      slider: this.videoDisplayBias.toString(),
    });

    return `${window.location.origin}${
      window.location.pathname
    }?${params.toString()}`;
  }

  copyShareableLink(): void {
    const link = this.generateShareableLink();
    navigator.clipboard.writeText(link);
    alert('Link copied! Share it with your team.');
  }
}
