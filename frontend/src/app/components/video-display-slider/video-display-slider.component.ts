import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-display-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="slider-container">
      <div class="slider-header">
        <h4>
          <span class="slider-icon">⚡</span>
          Quick Adjust: Video vs Display
        </h4>
        <button
          class="reset-btn"
          *ngIf="value !== 0"
          (click)="reset()"
          title="Reset to balanced"
        >
          Reset
        </button>
      </div>

      <div class="slider-body">
        <div class="slider-labels">
          <span class="label left" [class.active]="value < -10">
            <span class="label-emoji">🖼️</span>
            More Display
          </span>
          <span class="label center" [class.active]="value >= -10 && value <= 10">
            Balanced
          </span>
          <span class="label right" [class.active]="value > 10">
            More Video
            <span class="label-emoji">🎬</span>
          </span>
        </div>

        <div class="slider-track-container">
          <input
            type="range"
            class="slider-input"
            [value]="value"
            (input)="onSliderChange($event)"
            min="-50"
            max="50"
            step="5"
          />
          <div class="slider-track">
            <div
              class="slider-fill left-fill"
              *ngIf="value < 0"
              [style.width.%]="Math.abs(value)"
            ></div>
            <div class="slider-center"></div>
            <div
              class="slider-fill right-fill"
              *ngIf="value > 0"
              [style.width.%]="value"
            ></div>
          </div>
        </div>

        <div class="slider-value">
          <span *ngIf="value === 0">No adjustment</span>
          <span *ngIf="value > 0" class="video-bias">
            +{{ value }}% towards Video
          </span>
          <span *ngIf="value < 0" class="display-bias">
            +{{ Math.abs(value) }}% towards Display
          </span>
        </div>
      </div>

      <p class="slider-hint">
        Move the slider to shift budget between Video and Display channels.
        Social remains unaffected.
      </p>
    </div>
  `,
  styles: [
    `
      .slider-container {
        padding: var(--space-lg);
        background: linear-gradient(
          135deg,
          rgba(236, 72, 153, 0.08),
          rgba(6, 182, 212, 0.08)
        );
        border: 1px solid rgba(236, 72, 153, 0.2);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-lg);
      }

      .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-md);
      }

      .slider-header h4 {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .slider-icon {
        font-size: 1.1rem;
      }

      .reset-btn {
        padding: 4px 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .reset-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
      }

      .slider-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .label {
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all var(--transition-fast);
      }

      .label.active {
        color: var(--text-primary);
        font-weight: 600;
      }

      .label.left.active {
        color: var(--channel-display);
      }

      .label.right.active {
        color: var(--channel-video);
      }

      .label-emoji {
        font-size: 1rem;
      }

      .slider-track-container {
        position: relative;
        height: 32px;
        display: flex;
        align-items: center;
      }

      .slider-input {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
      }

      .slider-track {
        position: relative;
        width: 100%;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .slider-center {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 16px;
        background: var(--text-muted);
        border-radius: 2px;
      }

      .slider-fill {
        position: absolute;
        height: 100%;
        border-radius: 4px;
      }

      .left-fill {
        right: 50%;
        background: linear-gradient(90deg, var(--channel-display), transparent);
      }

      .right-fill {
        left: 50%;
        background: linear-gradient(
          90deg,
          transparent,
          var(--channel-video)
        );
      }

      .slider-value {
        text-align: center;
        font-size: 0.85rem;
        font-weight: 600;
        min-height: 1.5em;
      }

      .video-bias {
        color: var(--channel-video);
      }

      .display-bias {
        color: var(--channel-display);
      }

      .slider-hint {
        margin: var(--space-sm) 0 0 0;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: center;
      }
    `,
  ],
})
export class VideoDisplaySliderComponent implements OnChanges {
  @Input() value = 0;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number>();

  Math = Math;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      // Clamp value to range
      this.value = Math.max(-50, Math.min(50, this.value));
    }
  }

  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  reset(): void {
    this.value = 0;
    this.valueChange.emit(0);
  }
}

