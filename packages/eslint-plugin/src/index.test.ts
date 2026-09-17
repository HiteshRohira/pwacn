import { describe, expect, it, vi } from 'vitest';
import plugin, { rules } from './index';

const openingElement = (name: string, attributes: string[] = []) => ({
  name: name.includes('.')
    ? { object: { name: name.split('.')[0] }, property: { name: name.split('.')[1] } }
    : { name },
  attributes: attributes.map((attribute) => ({ name: { name: attribute } })),
});

describe('@pwacn/eslint-plugin', () => {
  it('ships every recommended rule', () => {
    for (const rule of Object.keys(plugin.configs.recommended.rules))
      expect(rules[rule.replace('@pwacn/', '') as keyof typeof rules]).toBeDefined();
  });

  it('reports custom tap motion surfaces', () => {
    const report = vi.fn();
    const visitor = rules['prefer-mobile-surface'].create({ report });
    visitor.JSXOpeningElement(openingElement('motion.div', ['whileTap']));
    expect(report).toHaveBeenCalledOnce();
  });

  it('does not report motion without tap feedback', () => {
    const report = vi.fn();
    const visitor = rules['prefer-mobile-surface'].create({ report });
    visitor.JSXOpeningElement(openingElement('motion.div', ['animate']));
    expect(report).not.toHaveBeenCalled();
  });
});
