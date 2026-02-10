import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BudgetInput, BudgetResult, ChannelInfo, HealthCheck } from '../models/campaign.models';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly apiUrl = 'http://localhost:3000/api/campaigns';
  
  // State management for loading and results
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private resultSubject = new BehaviorSubject<BudgetResult | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);

  loading$ = this.loadingSubject.asObservable();
  result$ = this.resultSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Calculate optimal budget distribution
   */
  calculateDistribution(input: BudgetInput): Observable<BudgetResult> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<BudgetResult>(`${this.apiUrl}/calculate`, input).pipe(
      tap(result => {
        this.resultSubject.next(result);
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Get available channel information
   */
  getChannels(): Observable<ChannelInfo[]> {
    return this.http.get<ChannelInfo[]>(`${this.apiUrl}/channels`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Check API health status
   */
  checkHealth(): Observable<HealthCheck> {
    return this.http.get<HealthCheck>(`${this.apiUrl}/health`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Clear current results
   */
  clearResults(): void {
    this.resultSubject.next(null);
    this.errorSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid input parameters';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    }
    
    this.errorSubject.next(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

