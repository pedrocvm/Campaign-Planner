import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChannelSettings,
  ValidationResult,
} from '../../models/planner.models';
import {
  CHANNEL_CONFIGS,
  DEFAULT_CONSTRAINTS,
  getChannelById,
} from '../../config/campaign-config';

export interface AdvancedOptionsState {
  globalMinPercent: number;
  globalMaxPercent: number;
  channelSettings: ChannelSettings[];
}

@Component({
  selector: 'app-advanced-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="advanced-options-container">
      <!-- Global Constraints -->
      <div class="section global-section">
        <h4 class="section-title">
          <span class="section-icon">🌍</span>
          Global Limits
        </h4>
        <p class="section-hint">
          Default limits applied to all channels (can be overridden below)
        </p>

        <div class="form-row">
          <div class="form-group half">
            <label>Min per channel (%)</label>
            <input
              type="number"
              [ngModel]="globalMinPercent"
              (ngModelChange)="onGlobalMinChange($event)"
              min="0"
              max="33"
              class="input-small"
            />
          </div>
          <div class="form-group half">
            <label>Max per channel (%)</label>
            <input
              type="number"
              [ngModel]="globalMaxPercent"
              (ngModelChange)="onGlobalMaxChange($event)"
              min="34"
              max="100"
              class="input-small"
            />
          </div>
        </div>
      </div>

      <!-- Per-Channel Controls -->
      <div class="section channels-section">
        <h4 class="section-title">
          <span class="section-icon">📊</span>
          Per-Channel Controls
          <span class="optional-badge">Optional</span>
        </h4>
        <p class="section-hint">
          Fine-tune each channel's allocation and performance assumptions
        </p>

        <div class="channel-cards">
          <div
            *ngFor="let channel of channelSettings; let i = index"
            class="channel-card"
            [class.disabled]="!channel.enabled"
          >
            <div class="channel-header">
              <div class="channel-info">
                <span class="channel-emoji">{{
                  getChannelEmoji(channel.channelId)
                }}</span>
                <div class="channel-text">
                  <span class="channel-name">{{
                    getChannelLabel(channel.channelId)
                  }}</span>
                  <span class="channel-desc">{{
                    getChannelDescription(channel.channelId)
                  }}</span>
                </div>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [checked]="channel.enabled"
                  (change)="toggleChannel(i)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="channel-body" *ngIf="channel.enabled">
              <div class="control-row">
                <div class="control-group">
                  <label>Min %</label>
                  <input
                    type="number"
                    [(ngModel)]="channel.minPercent"
                    (ngModelChange)="emitChange()"
                    min="0"
                    max="100"
                    class="input-tiny"
                  />
                </div>
                <div class="control-group">
                  <label>Max %</label>
                  <input
                    type="number"
                    [(ngModel)]="channel.maxPercent"
                    (ngModelChange)="emitChange()"
                    min="0"
                    max="100"
                    class="input-tiny"
                  />
                </div>
              </div>

              <div class="control-row overrides">
                <div class="control-group">
                  <label>
                    CPM Override
                    <span class="default-hint"
                      >(default: \${{ getDefaultCPM(channel.channelId) }})</span
                    >
                  </label>
                  <div class="input-with-prefix">
                    <span class="prefix">$</span>
                    <input
                      type="number"
                      [(ngModel)]="channel.cpmOverride"
                      (ngModelChange)="emitChange()"
                      [placeholder]="getDefaultCPM(channel.channelId).toString()"
                      step="0.5"
                      min="0.1"
                      class="input-tiny"
                    />
                  </div>
                </div>
                <div class="control-group">
                  <label>
                    Frequency Override
                    <span class="default-hint"
                      >(default:
                      {{ getDefaultFrequency(channel.channelId) }})</span
                    >
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="channel.frequencyOverride"
                    (ngModelChange)="emitChange()"
                    [placeholder]="
                      getDefaultFrequency(channel.channelId).toString()
                    "
                    step="0.5"
                    min="1"
                    class="input-tiny"
                  />
                </div>
              </div>

              <div class="channel-error" *ngIf="getChannelError(channel)">
                {{ getChannelError(channel) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Errors -->
      <div
        class="validation-errors"
        *ngIf="validationResult && !validationResult.isValid"
      >
        <div class="error-banner">
          <span class="error-icon">⚠️</span>
          <div class="error-content">
            <strong>Cannot calculate with current settings:</strong>
            <ul>
              <li *ngFor="let error of validationResult.errors">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats" *ngIf="enabledChannelCount > 0">
        <div class="stat">
          <span class="stat-label">Enabled Channels</span>
          <span class="stat-value"
            >{{ enabledChannelCount }} / {{ channelSettings.length }}</span
          >
        </div>
        <div class="stat">
          <span class="stat-label">Sum of Mins</span>
          <span class="stat-value" [class.error]="sumOfMins > 100"
            >{{ sumOfMins }}%</span
          >
        </div>
        <div class="stat">
          <span class="stat-label">Sum of Maxs</span>
          <span class="stat-value" [class.error]="sumOfMaxs < 100"
            >{{ sumOfMaxs }}%</span
          >
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .advanced-options-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .section {
        padding: var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: 0 0 var(--space-xs) 0;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .section-icon {
        font-size: 1.1rem;
      }

      .section-hint {
        color: var(--text-muted);
        font-size: 0.8rem;
        margin: 0 0 var(--space-md) 0;
      }

      .optional-badge {
        margin-left: auto;
        padding: 2px 8px;
        background: var(--bg-card);
        border-radius: var(--radius-sm);
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-muted);
      }

      .form-row {
        display: flex;
        gap: var(--space-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .form-group.half {
        flex: 1;
      }

      .form-group label {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .input-small,
      .input-tiny {
        padding: var(--space-sm);
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .input-tiny {
        width: 80px;
        padding: var(--space-xs) var(--space-sm);
      }

      .input-small:focus,
      .input-tiny:focus {
        outline: none;
        border-color: var(--accent-primary);
      }

      .channel-cards {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .channel-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        transition: all var(--transition-fast);
      }

      .channel-card.disabled {
        opacity: 0.6;
      }

      .channel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md);
        background: var(--bg-secondary);
      }

      .channel-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .channel-emoji {
        font-size: 1.5rem;
      }

      .channel-text {
        display: flex;
        flex-direction: column;
      }

      .channel-name {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .channel-desc {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .toggle-switch {
        position: relative;
        width: 48px;
        height: 24px;
        cursor: pointer;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--border-color);
        border-radius: 24px;
        transition: all var(--transition-fast);
      }

      .toggle-slider::before {
        content: '';
        position: absolute;
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: all var(--transition-fast);
      }

      .toggle-switch input:checked + .toggle-slider {
        background: var(--accent-success);
      }

      .toggle-switch input:checked + .toggle-slider::before {
        transform: translateX(24px);
      }

      .channel-body {
        padding: var(--space-md);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .control-row {
        display: flex;
        gap: var(--space-lg);
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .control-group label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .default-hint {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .input-with-prefix {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .prefix {
        color: var(--text-muted);
        font-size: 0.85rem;
      }

      .channel-error {
        padding: var(--space-xs) var(--space-sm);
        background: rgba(239, 68, 68, 0.1);
        border-radius: var(--radius-sm);
        color: var(--accent-danger);
        font-size: 0.8rem;
      }

      .validation-errors {
        margin-top: var(--space-sm);
      }

      .error-banner {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-md);
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--accent-danger);
        border-radius: var(--radius-md);
      }

      .error-icon {
        font-size: 1.25rem;
      }

      .error-content strong {
        display: block;
        margin-bottom: var(--space-xs);
        color: var(--accent-danger);
      }

      .error-content ul {
        margin: 0;
        padding-left: var(--space-lg);
      }

      .error-content li {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .summary-stats {
        display: flex;
        justify-content: space-around;
        padding: var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .stat-value {
        font-size: 0.9rem;
        font-weight: 600;
      }

      .stat-value.error {
        color: var(--accent-danger);
      }
    `,
  ],
})
export class AdvancedOptionsComponent implements OnInit, OnChanges {
  @Input() globalMinPercent = DEFAULT_CONSTRAINTS.minPerChannel;
  @Input() globalMaxPercent = DEFAULT_CONSTRAINTS.maxPerChannel;
  @Input() validationResult: ValidationResult | null = null;

  @Output() stateChange = new EventEmitter<AdvancedOptionsState>();

  channelSettings: ChannelSettings[] = [];

  ngOnInit(): void {
    this.initializeChannelSettings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['globalMinPercent'] || changes['globalMaxPercent']) {
      this.updateChannelDefaults();
    }
  }

  private initializeChannelSettings(): void {
    this.channelSettings = CHANNEL_CONFIGS.map((config) => ({
      channelId: config.id,
      enabled: true,
      minPercent: this.globalMinPercent,
      maxPercent: this.globalMaxPercent,
      cpmOverride: undefined,
      frequencyOverride: undefined,
    }));
    this.emitChange();
  }

  private updateChannelDefaults(): void {
    if (this.channelSettings.length === 0) return;
  }

  onGlobalMinChange(value: number): void {
    this.globalMinPercent = value;
    this.channelSettings.forEach((c) => {
      c.minPercent = value;
    });
    this.emitChange();
  }

  onGlobalMaxChange(value: number): void {
    this.globalMaxPercent = value;
    this.channelSettings.forEach((c) => {
      c.maxPercent = value;
    });
    this.emitChange();
  }

  toggleChannel(index: number): void {
    this.channelSettings[index].enabled = !this.channelSettings[index].enabled;
    this.emitChange();
  }

  emitChange(): void {
    this.stateChange.emit({
      globalMinPercent: this.globalMinPercent,
      globalMaxPercent: this.globalMaxPercent,
      channelSettings: [...this.channelSettings],
    });
  }

  getChannelEmoji(channelId: string): string {
    return getChannelById(channelId)?.emoji || '📊';
  }

  getChannelLabel(channelId: string): string {
    return getChannelById(channelId)?.label || channelId;
  }

  getChannelDescription(channelId: string): string {
    return getChannelById(channelId)?.description || '';
  }

  getDefaultCPM(channelId: string): number {
    return getChannelById(channelId)?.defaultCPM || 10;
  }

  getDefaultFrequency(channelId: string): number {
    return getChannelById(channelId)?.defaultFrequency || 4;
  }

  getChannelError(channel: ChannelSettings): string | null {
    if (channel.minPercent > channel.maxPercent) {
      return 'Min cannot exceed Max';
    }
    return null;
  }

  get enabledChannelCount(): number {
    return this.channelSettings.filter((c) => c.enabled).length;
  }

  get sumOfMins(): number {
    return this.channelSettings
      .filter((c) => c.enabled)
      .reduce((acc, c) => acc + c.minPercent, 0);
  }

  get sumOfMaxs(): number {
    return this.channelSettings
      .filter((c) => c.enabled)
      .reduce((acc, c) => acc + c.maxPercent, 0);
  }
}


