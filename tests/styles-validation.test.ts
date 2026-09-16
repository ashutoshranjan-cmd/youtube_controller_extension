import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CONTROL_BAR_STYLES } from '../src/content/control-bar/styles.js';

describe('CSS Syntax and Style Validation', () => {
  it('should have perfectly balanced braces in CONTROL_BAR_STYLES', () => {
    let openBraces = 0;
    const lines = CONTROL_BAR_STYLES.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
      }
      assert.ok(openBraces >= 0, `Unmatched closing brace found around line ${i + 1}`);
    }
    assert.strictEqual(openBraces, 0, `There are ${openBraces} unclosed braces in CONTROL_BAR_STYLES`);
  });

  it('should contain all required core class rules', () => {
    const requiredRules = [
      '.bar-container',
      '.floating-pill',
      '.like-btn',
      '.hd-badge-btn',
      '.video-preview-window',
      '.yt-search-backdrop',
      '.search-cut-btn',
      '.pill-cut-btn',
      '.queue-panel',
      '.quality-popover',
      '.settings-popover',
      '.dock-toast',
      '.search-recommendation-chips',
      '.search-chip',
      '.search-filter-bar',
      '.search-filter-btn',
      '.search-channel-card',
      '.preview-drag-grip',
      '.preview-vol-slider',
      '.preview-prev-track',
      '.preview-next-track'
    ];

    for (const rule of requiredRules) {
      assert.ok(
        CONTROL_BAR_STYLES.includes(rule),
        `CONTROL_BAR_STYLES should define rule: ${rule}`
      );
    }
  });
});
