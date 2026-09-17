type Context = { report: (descriptor: { node: unknown; message: string }) => void };
type Node = {
  type?: string;
  name?: { name?: string; object?: { name?: string }; property?: { name?: string } };
  key?: { name?: string; value?: string };
  value?: unknown;
  attributes?: Node[];
};

const jsxName = (node: Node) =>
  node.name?.name ??
  (node.name?.object?.name && node.name?.property?.name
    ? `${node.name.object.name}.${node.name.property.name}`
    : undefined);

const propertyName = (node: Node) => node.key?.name ?? node.key?.value;

const noArbitrarySpring = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Prefer semantic pwacn spring tokens.' },
  },
  create(context: Context) {
    return {
      Property(node: Node) {
        if (['stiffness', 'damping', 'mass'].includes(propertyName(node) ?? '')) {
          context.report({
            node,
            message:
              'Use a semantic spring from @pwacn/core instead of an arbitrary physics value.',
          });
        }
      },
    };
  },
};

const noArbitraryTransitionDuration = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Prefer semantic motion timing.' },
  },
  create(context: Context) {
    return {
      Property(node: Node) {
        if (propertyName(node) === 'duration' && typeof node.value !== 'undefined') {
          context.report({
            node,
            message: 'Use a pwacn semantic transition instead of an arbitrary duration.',
          });
        }
      },
    };
  },
};

const preferPressable = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Prefer Pressable for mobile interactive surfaces.' },
  },
  create(context: Context) {
    return {
      JSXOpeningElement(node: Node) {
        const name = jsxName(node);
        if (!name || !['div', 'span', 'article', 'li'].includes(name)) return;
        if (node.attributes?.some((attribute) => attribute.name?.name === 'onClick')) {
          context.report({
            node,
            message: 'Use Pressable for non-native interactive mobile surfaces.',
          });
        }
      },
    };
  },
};

const requireReducedMotion = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Require reduced-motion handling near custom Motion usage.' },
  },
  create(context: Context) {
    return {
      JSXOpeningElement(node: Node) {
        const name = jsxName(node);
        if (typeof name === 'string' && name.startsWith('motion.')) {
          context.report({
            node,
            message:
              'Verify that this custom Motion element defines a reduced-motion path.',
          });
        }
      },
    };
  },
};

const preferMobileSurface = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Prefer MotionSurface for hand-authored tap motion.' },
  },
  create(context: Context) {
    return {
      JSXOpeningElement(node: Node) {
        const name = jsxName(node);
        if (!name?.startsWith('motion.')) return;
        if (node.attributes?.some((attribute) => attribute.name?.name === 'whileTap'))
          context.report({
            node,
            message:
              'Use MotionSurface or Pressable so tap feedback shares pwacn physics and accessibility behavior.',
          });
      },
    };
  },
};

export const rules = {
  'no-arbitrary-spring': noArbitrarySpring,
  'no-arbitrary-transition-duration': noArbitraryTransitionDuration,
  'prefer-pressable': preferPressable,
  'prefer-mobile-surface': preferMobileSurface,
  'require-reduced-motion': requireReducedMotion,
};

export default {
  meta: { name: '@pwacn/eslint-plugin', version: '0.1.0' },
  rules,
  configs: {
    recommended: {
      rules: {
        '@pwacn/no-arbitrary-spring': 'warn',
        '@pwacn/no-arbitrary-transition-duration': 'warn',
        '@pwacn/prefer-pressable': 'warn',
        '@pwacn/prefer-mobile-surface': 'warn',
        '@pwacn/require-reduced-motion': 'warn',
      },
    },
  },
};
