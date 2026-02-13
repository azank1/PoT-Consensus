/**
 * ContextManager.ts
 * 
 * Purpose: Execution context and variable management
 */

export class ContextManager {
  private context: Map<string, any>;

  constructor() {
    this.context = new Map();
  }

  set(key: string, value: any): void {
    this.context.set(key, value);
  }

  get(key: string): any {
    return this.context.get(key);
  }

  has(key: string): boolean {
    return this.context.has(key);
  }

  resolveTemplate(template: string | object): any {
    if (typeof template === 'string') {
      // Replace {{variable}} patterns with support for nested properties
      return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        const value = this.getNestedValue(trimmedKey);
        return value !== undefined ? String(value) : match;
      });
    }

    if (typeof template === 'object' && template !== null) {
      // Recursively resolve objects
      const resolved: any = Array.isArray(template) ? [] : {};
      for (const [key, value] of Object.entries(template)) {
        resolved[key] = this.resolveTemplate(value);
      }
      return resolved;
    }

    return template;
  }

  /**
   * Get nested value from context using dot notation
   * Example: getNestedValue('user.profile.name') returns context.get('user').profile.name
   * But if 'user.profile.name' exists as a direct key, return that instead
   */
  private getNestedValue(key: string): any {
    // First, check if the exact key exists (for keys like 'task-1.result')
    if (this.has(key)) {
      return this.get(key);
    }
    
    // Otherwise, treat as nested property access
    const parts = key.split('.');
    let value = this.get(parts[0]);
    
    for (let i = 1; i < parts.length && value !== undefined; i++) {
      value = value[parts[i]];
    }
    
    return value;
  }

  dump(): Record<string, any> {
    const result: Record<string, any> = {};
    this.context.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  clear(): void {
    this.context.clear();
  }
}
