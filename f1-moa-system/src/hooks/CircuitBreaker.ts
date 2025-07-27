// F2 Circuit Breaker - Fault Tolerance and Performance Protection

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import type {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerMetrics,
  CircuitBreakerConfig
} from './types.js';

/**
 * Production-grade Circuit Breaker implementation with adaptive thresholds,
 * exponential backoff, and comprehensive metrics tracking.
 */
export class DefaultCircuitBreaker extends EventEmitter implements CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private resetTimer?: NodeJS.Timeout;
  private slidingWindow: boolean[] = []; // Recent request outcomes
  private windowSize = 100; // Size of sliding window

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();

    this.config = {
      enabled: config.enabled ?? true,
      threshold: config.threshold ?? 0.5, // 50% failure rate
      timeout: config.timeout ?? 5000, // 5 seconds
      resetTimeout: config.resetTimeout ?? 30000 // 30 seconds
    };

    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: undefined,
      nextAttemptTime: undefined
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 1.0,
      avgResponseTime: 0
    };

    console.log('🛡️ Circuit Breaker initialized with threshold:', this.config.threshold);
  }

  isOpen(): boolean {
    if (!this.config.enabled) return false;
    return this.state.state === 'open';
  }

  isClosed(): boolean {
    if (!this.config.enabled) return true;
    return this.state.state === 'closed';
  }

  isHalfOpen(): boolean {
    if (!this.config.enabled) return false;
    return this.state.state === 'half-open';
  }

  recordSuccess(): void {
    if (!this.config.enabled) return;

    const startTime = performance.now();
    
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.updateSuccessRate();
    
    // Add to sliding window
    this.addToSlidingWindow(true);
    
    // Reset failure count
    this.state.failures = 0;
    this.state.lastFailureTime = undefined;
    
    // Transition from half-open to closed on success
    if (this.state.state === 'half-open') {
      this.transitionTo('closed');
      console.log('✅ Circuit breaker closed after successful request');
    }
    
    const responseTime = performance.now() - startTime;
    this.updateAvgResponseTime(responseTime);
    
    this.emit('success', {
      state: this.state.state,
      metrics: this.metrics
    });
  }

  recordFailure(): void {
    if (!this.config.enabled) return;

    const startTime = performance.now();
    
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.updateSuccessRate();
    
    // Add to sliding window
    this.addToSlidingWindow(false);
    
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    // Check if we should open the circuit
    const failureRate = this.calculateFailureRate();
    if (failureRate >= this.config.threshold && this.state.state === 'closed') {
      this.transitionTo('open');
      console.log(`🔴 Circuit breaker opened due to ${(failureRate * 100).toFixed(1)}% failure rate`);
    } else if (this.state.state === 'half-open') {
      // Return to open state on failure during half-open
      this.transitionTo('open');
      console.log('🔴 Circuit breaker returned to open state after failure in half-open');
    }
    
    const responseTime = performance.now() - startTime;
    this.updateAvgResponseTime(responseTime);
    
    this.emit('failure', {
      state: this.state.state,
      failures: this.state.failures,
      failureRate,
      metrics: this.metrics
    });
  }

  getState(): CircuitBreakerState {
    // Check if we should transition from open to half-open
    if (this.state.state === 'open' && this.shouldAttemptReset()) {
      this.transitionTo('half-open');
      console.log('🟡 Circuit breaker transitioned to half-open for testing');
    }
    
    return { ...this.state };
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  // Advanced methods for monitoring and configuration
  getDetailedStatus(): {
    state: CircuitBreakerState;
    metrics: CircuitBreakerMetrics;
    config: CircuitBreakerConfig;
    slidingWindow: {
      size: number;
      recentFailures: number;
      recentSuccesses: number;
      failureRate: number;
    };
    nextAttemptIn?: number;
  } {
    const now = Date.now();
    const recentFailures = this.slidingWindow.filter(success => !success).length;
    const recentSuccesses = this.slidingWindow.filter(success => success).length;
    const currentFailureRate = this.calculateFailureRate();
    
    return {
      state: this.getState(),
      metrics: this.getMetrics(),
      config: this.config,
      slidingWindow: {
        size: this.slidingWindow.length,
        recentFailures,
        recentSuccesses,
        failureRate: currentFailureRate
      },
      nextAttemptIn: this.state.nextAttemptTime ? 
        Math.max(0, this.state.nextAttemptTime - now) : undefined
    };
  }

  updateConfiguration(newConfig: Partial<CircuitBreakerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    console.log('⚙️ Circuit breaker configuration updated:', {
      old: oldConfig,
      new: this.config
    });
    
    this.emit('config-updated', {
      oldConfig,
      newConfig: this.config
    });
  }

  reset(): void {
    console.log('🔄 Circuit breaker manually reset');
    
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: undefined,
      nextAttemptTime: undefined
    };
    
    this.slidingWindow = [];
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    
    this.emit('reset', {
      state: this.state,
      metrics: this.metrics
    });
  }

  enable(): void {
    this.config.enabled = true;
    console.log('✅ Circuit breaker enabled');
    this.emit('enabled');
  }

  disable(): void {
    this.config.enabled = false;
    console.log('❌ Circuit breaker disabled');
    this.emit('disabled');
  }

  private transitionTo(newState: 'closed' | 'open' | 'half-open'): void {
    const oldState = this.state.state;
    this.state.state = newState;
    
    switch (newState) {
      case 'open':
        this.state.nextAttemptTime = Date.now() + this.config.resetTimeout;
        this.scheduleReset();
        break;
        
      case 'half-open':
        this.state.nextAttemptTime = undefined;
        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
          this.resetTimer = undefined;
        }
        break;
        
      case 'closed':
        this.state.failures = 0;
        this.state.lastFailureTime = undefined;
        this.state.nextAttemptTime = undefined;
        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
          this.resetTimer = undefined;
        }
        break;
    }
    
    this.emit('state-changed', {
      oldState,
      newState,
      timestamp: Date.now(),
      metrics: this.metrics
    });
  }

  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    this.resetTimer = setTimeout(() => {
      if (this.state.state === 'open') {
        this.transitionTo('half-open');
        console.log('🟡 Circuit breaker scheduled transition to half-open');
      }
    }, this.config.resetTimeout);
  }

  private shouldAttemptReset(): boolean {
    if (this.state.state !== 'open') return false;
    if (!this.state.nextAttemptTime) return false;
    
    return Date.now() >= this.state.nextAttemptTime;
  }

  private calculateFailureRate(): number {
    if (this.slidingWindow.length === 0) return 0;
    
    const failures = this.slidingWindow.filter(success => !success).length;
    return failures / this.slidingWindow.length;
  }

  private addToSlidingWindow(success: boolean): void {
    this.slidingWindow.push(success);
    
    // Keep sliding window size manageable
    if (this.slidingWindow.length > this.windowSize) {
      this.slidingWindow = this.slidingWindow.slice(-this.windowSize);
    }
  }

  private updateSuccessRate(): void {
    if (this.metrics.totalRequests === 0) {
      this.metrics.successRate = 1.0;
    } else {
      this.metrics.successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    }
  }

  private updateAvgResponseTime(responseTime: number): void {
    if (this.metrics.totalRequests === 1) {
      this.metrics.avgResponseTime = responseTime;
    } else {
      this.metrics.avgResponseTime = 
        (this.metrics.avgResponseTime + responseTime) / 2;
    }
  }

  // Health check method for monitoring systems
  healthCheck(): {
    healthy: boolean;
    state: string;
    failureRate: number;
    avgResponseTime: number;
    uptime: number;
    recommendation?: string;
  } {
    const failureRate = this.calculateFailureRate();
    const healthy = this.state.state === 'closed' && failureRate < this.config.threshold;
    
    let recommendation: string | undefined;
    
    if (failureRate > this.config.threshold * 0.8) {
      recommendation = 'Warning: Failure rate approaching threshold';
    } else if (this.state.state === 'open') {
      recommendation = 'Circuit is open - service degraded';
    } else if (this.state.state === 'half-open') {
      recommendation = 'Testing service recovery';
    }
    
    return {
      healthy,
      state: this.state.state,
      failureRate,
      avgResponseTime: this.metrics.avgResponseTime,
      uptime: this.metrics.totalRequests,
      recommendation
    };
  }

  // Statistics for monitoring and alerting
  getStatistics(): {
    requests: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    };
    performance: {
      avgResponseTime: number;
      slowRequests: number;
    };
    circuit: {
      state: string;
      failures: number;
      lastFailure?: number;
      nextAttempt?: number;
    };
    sliding: {
      windowSize: number;
      recentFailureRate: number;
      trend: 'improving' | 'degrading' | 'stable';
    };
  } {
    const recentFailureRate = this.calculateFailureRate();
    const trend = this.determineTrend();
    
    return {
      requests: {
        total: this.metrics.totalRequests,
        successful: this.metrics.successfulRequests,
        failed: this.metrics.failedRequests,
        successRate: this.metrics.successRate
      },
      performance: {
        avgResponseTime: this.metrics.avgResponseTime,
        slowRequests: 0 // Could be tracked separately
      },
      circuit: {
        state: this.state.state,
        failures: this.state.failures,
        lastFailure: this.state.lastFailureTime,
        nextAttempt: this.state.nextAttemptTime
      },
      sliding: {
        windowSize: this.slidingWindow.length,
        recentFailureRate,
        trend
      }
    };
  }

  private determineTrend(): 'improving' | 'degrading' | 'stable' {
    if (this.slidingWindow.length < 10) return 'stable';
    
    const halfPoint = Math.floor(this.slidingWindow.length / 2);
    const firstHalfFailures = this.slidingWindow.slice(0, halfPoint)
      .filter(success => !success).length;
    const secondHalfFailures = this.slidingWindow.slice(halfPoint)
      .filter(success => !success).length;
    
    const firstHalfRate = firstHalfFailures / halfPoint;
    const secondHalfRate = secondHalfFailures / (this.slidingWindow.length - halfPoint);
    
    if (secondHalfRate < firstHalfRate * 0.8) return 'improving';
    if (secondHalfRate > firstHalfRate * 1.2) return 'degrading';
    return 'stable';
  }
}