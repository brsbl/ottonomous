/**
 * Browser-injectable script for ARIA snapshot generation.
 * This script runs in the browser context (injected via page.addScriptTag).
 *
 * Provides Playwright-compatible ARIA snapshots with cross-connection ref persistence.
 * References are stored on window.__devBrowserRefs.
 *
 * After execution, two functions become available:
 * - window.__devBrowser_getAISnapshot() - Generate ARIA snapshot
 * - window.__devBrowser_selectSnapshotRef(ref) - Get element by ref
 */

(function() {
  'use strict';

  // Store element references for later retrieval
  window.__devBrowserRefs = window.__devBrowserRefs || {};

  let refCounter = 0;

  // ============================================
  // YAML Escaping (matching dev-browser)
  // ============================================

  /**
   * Escape a string for use as a YAML value
   */
  function yamlEscapeValue(str) {
    if (!str) return '""';
    // Check if escaping is needed
    if (!/[\n\r\t\\"']/.test(str) && str === str.trim()) {
      return `"${str}"`;
    }
    // Escape special characters
    let escaped = str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }

  // ============================================
  // DOM Utilities
  // ============================================

  /**
   * Check if an element is visible (not hidden by CSS or attributes)
   */
  function isElementVisible(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    // Check for hidden attribute
    if (element.hasAttribute('hidden')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;

    const style = window.getComputedStyle(element);

    // Check display and visibility
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;

    // Check dimensions (with some tolerance)
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      // Exception: elements with overflow content
      if (element.scrollWidth === 0 && element.scrollHeight === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if element is interactive (can receive focus/clicks)
   */
  function isInteractive(element) {
    const tag = element.tagName.toLowerCase();
    const role = getAriaRole(element);

    // Form elements
    if (['button', 'input', 'select', 'textarea'].includes(tag)) return true;

    // Links with href
    if (tag === 'a' && element.hasAttribute('href')) return true;

    // Elements with tabindex
    if (element.hasAttribute('tabindex')) {
      const tabindex = parseInt(element.getAttribute('tabindex'), 10);
      if (tabindex >= 0) return true;
    }

    // ARIA interactive roles
    const interactiveRoles = [
      'button', 'link', 'checkbox', 'radio', 'switch', 'tab',
      'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
      'combobox', 'textbox', 'searchbox', 'slider', 'spinbutton',
      'scrollbar', 'treeitem'
    ];
    if (interactiveRoles.includes(role)) return true;

    // Contenteditable
    if (element.isContentEditable) return true;

    return false;
  }

  // ============================================
  // ARIA Role Detection
  // ============================================

  /**
   * Map of HTML elements to their implicit ARIA roles
   */
  const implicitRoles = {
    'a[href]': 'link',
    'a:not([href])': 'generic',
    'article': 'article',
    'aside': 'complementary',
    'button': 'button',
    'datalist': 'listbox',
    'details': 'group',
    'dialog': 'dialog',
    'fieldset': 'group',
    'figure': 'figure',
    'footer': 'contentinfo',
    'form': 'form',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'header': 'banner',
    'hr': 'separator',
    'img[alt=""]': 'presentation',
    'img[alt]': 'img',
    'img:not([alt])': 'img',
    'input[type="button"]': 'button',
    'input[type="checkbox"]': 'checkbox',
    'input[type="email"]': 'textbox',
    'input[type="image"]': 'button',
    'input[type="number"]': 'spinbutton',
    'input[type="password"]': 'textbox',
    'input[type="radio"]': 'radio',
    'input[type="range"]': 'slider',
    'input[type="reset"]': 'button',
    'input[type="search"]': 'searchbox',
    'input[type="submit"]': 'button',
    'input[type="tel"]': 'textbox',
    'input[type="text"]': 'textbox',
    'input[type="url"]': 'textbox',
    'input:not([type])': 'textbox',
    'li': 'listitem',
    'main': 'main',
    'menu': 'list',
    'nav': 'navigation',
    'ol': 'list',
    'optgroup': 'group',
    'option': 'option',
    'output': 'status',
    'progress': 'progressbar',
    'section[aria-label]': 'region',
    'section[aria-labelledby]': 'region',
    'section': 'generic',
    'select': 'combobox',
    'select[multiple]': 'listbox',
    'summary': 'button',
    'table': 'table',
    'tbody': 'rowgroup',
    'td': 'cell',
    'textarea': 'textbox',
    'tfoot': 'rowgroup',
    'th': 'columnheader',
    'thead': 'rowgroup',
    'tr': 'row',
    'ul': 'list'
  };

  /**
   * Get the ARIA role for an element (explicit or implicit)
   */
  function getAriaRole(element) {
    // Explicit role takes precedence
    const explicitRole = element.getAttribute('role');
    if (explicitRole) {
      return explicitRole.split(' ')[0].toLowerCase();
    }

    const tag = element.tagName.toLowerCase();

    // Check specific selectors first (more specific matches)
    for (const [selector, role] of Object.entries(implicitRoles)) {
      if (selector.includes('[') || selector.includes(':')) {
        try {
          if (element.matches(selector)) {
            return role;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    // Fall back to tag-only matches
    if (implicitRoles[tag]) {
      return implicitRoles[tag];
    }

    return 'generic';
  }

  // ============================================
  // Accessible Name Computation
  // ============================================

  /**
   * Get the accessible name for an element (simplified algorithm)
   */
  function getAccessibleName(element) {
    // 1. aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const names = labelledBy.split(/\s+/).map(id => {
        const ref = document.getElementById(id);
        return ref ? ref.textContent.trim() : '';
      }).filter(Boolean);
      if (names.length) return names.join(' ');
    }

    // 2. aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // 3. Element-specific labelling
    const tag = element.tagName.toLowerCase();

    // For inputs, check associated label
    if (['input', 'select', 'textarea'].includes(tag)) {
      const id = element.id;
      if (id) {
        const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (label) return label.textContent.trim();
      }
      // Check for wrapping label
      const parentLabel = element.closest('label');
      if (parentLabel) {
        // Get text not in the input itself
        const clone = parentLabel.cloneNode(true);
        clone.querySelectorAll('input, select, textarea').forEach(el => el.remove());
        return clone.textContent.trim();
      }
    }

    // For images, use alt text
    if (tag === 'img') {
      const alt = element.getAttribute('alt');
      if (alt !== null) return alt.trim();
    }

    // For buttons, links, and headings, use text content
    if (['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ||
        ['button', 'link', 'heading'].includes(getAriaRole(element))) {
      return element.textContent.trim();
    }

    // 4. Title attribute as fallback
    const title = element.getAttribute('title');
    if (title) return title.trim();

    // 5. Placeholder as last resort for inputs
    if (['input', 'textarea'].includes(tag)) {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();
    }

    return '';
  }

  /**
   * Get state attributes for inline display (dev-browser format)
   * Returns array of strings like ["checked", "disabled"]
   */
  function getStateAttributes(element) {
    const states = [];
    const tag = element.tagName.toLowerCase();

    // Checked state (only for checkboxes and radios)
    if (tag === 'input' && ['checkbox', 'radio'].includes(element.type)) {
      if (element.checked) states.push('checked');
    }

    // ARIA checked state (for custom checkbox/radio implementations)
    const ariaChecked = element.getAttribute('aria-checked');
    if (ariaChecked === 'true') states.push('checked');

    // Disabled state
    if (element.disabled) {
      states.push('disabled');
    }

    // Required
    if (element.required) {
      states.push('required');
    }

    // Expanded state
    const expanded = element.getAttribute('aria-expanded');
    if (expanded === 'true') states.push('expanded');

    // Selected state
    const selected = element.getAttribute('aria-selected');
    if (selected === 'true') states.push('selected');

    return states;
  }

  /**
   * Get additional accessible properties for an element (non-boolean values)
   */
  function getAccessibleProperties(element) {
    const props = {};
    const tag = element.tagName.toLowerCase();

    // Placeholder
    if (['input', 'textarea'].includes(tag)) {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) props.placeholder = placeholder;
    }

    // Value for inputs
    if (element.value !== undefined && element.value !== '') {
      if (tag === 'input' && element.type !== 'password') {
        props.value = element.value;
      } else if (tag === 'textarea') {
        props.value = element.value.substring(0, 100) + (element.value.length > 100 ? '...' : '');
      }
    }

    // Level (for headings)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      props.level = parseInt(tag[1], 10);
    }
    const ariaLevel = element.getAttribute('aria-level');
    if (ariaLevel) {
      props.level = parseInt(ariaLevel, 10);
    }

    return props;
  }

  // ============================================
  // ARIA Tree Generation
  // ============================================

  /**
   * Roles that should be included in the snapshot
   */
  const includedRoles = new Set([
    // Landmarks
    'banner', 'complementary', 'contentinfo', 'form', 'main',
    'navigation', 'region', 'search',
    // Structure
    'article', 'heading', 'list', 'listitem', 'table', 'row',
    'cell', 'columnheader', 'rowheader', 'figure',
    // Widgets
    'button', 'link', 'checkbox', 'radio', 'switch', 'tab',
    'tablist', 'tabpanel', 'textbox', 'searchbox', 'combobox',
    'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'option', 'listbox', 'tree', 'treeitem', 'grid', 'treegrid',
    'slider', 'spinbutton', 'progressbar', 'dialog', 'alertdialog',
    'alert', 'status', 'tooltip', 'img'
  ]);

  /**
   * Roles that are typically containers and shouldn't get refs
   */
  const containerRoles = new Set([
    'list', 'table', 'row', 'rowgroup', 'tablist', 'menu', 'menubar',
    'listbox', 'tree', 'grid', 'treegrid', 'group'
  ]);

  /**
   * Generate a unique ref for an element
   */
  function generateRef(element) {
    const ref = 'e' + (++refCounter);
    window.__devBrowserRefs[ref] = element;
    return ref;
  }

  /**
   * Build the ARIA tree node for an element
   */
  function buildAriaNode(element, depth = 0) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    if (!isElementVisible(element)) return null;

    const role = getAriaRole(element);
    const name = getAccessibleName(element);
    const states = getStateAttributes(element);
    const props = getAccessibleProperties(element);

    // Determine if this element should be included
    const shouldInclude = includedRoles.has(role);
    const hasName = name.length > 0;
    const interactive = isInteractive(element);

    // Build children first
    const children = [];
    for (const child of element.children) {
      const childNode = buildAriaNode(child, depth + 1);
      if (childNode) {
        if (Array.isArray(childNode)) {
          children.push(...childNode);
        } else {
          children.push(childNode);
        }
      }
    }

    // If this element shouldn't be included, return children directly
    if (!shouldInclude && !interactive) {
      return children.length > 0 ? children : null;
    }

    // Build the node
    const node = {
      role,
      name: hasName ? name : undefined,
      states: states.length > 0 ? states : undefined,
      props: Object.keys(props).length > 0 ? props : undefined,
      children: children.length > 0 ? children : undefined
    };

    // Add ref for interactive elements or named elements (not pure containers)
    if (interactive || (hasName && !containerRoles.has(role))) {
      node.ref = generateRef(element);
    }

    return node;
  }

  // ============================================
  // YAML Serialization (dev-browser format)
  // ============================================

  /**
   * Serialize the ARIA tree to YAML format (dev-browser compatible)
   */
  function serializeToYaml(node, indent = 0) {
    if (!node) return '';

    const spaces = '  '.repeat(indent);
    const lines = [];

    // Handle array of nodes at root level
    if (Array.isArray(node)) {
      for (const child of node) {
        lines.push(serializeToYaml(child, indent));
      }
      return lines.filter(Boolean).join('\n');
    }

    // Build the role/name/states/ref string (dev-browser format)
    let roleStr = node.role;

    // Add name in quotes
    if (node.name) {
      let displayName = node.name;
      if (displayName.length > 60) {
        displayName = displayName.substring(0, 57) + '...';
      }
      displayName = displayName.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      roleStr += ` "${displayName}"`;
    }

    // Add state attributes inline [checked] [disabled] etc.
    if (node.states) {
      for (const state of node.states) {
        roleStr += ` [${state}]`;
      }
    }

    // Add ref
    if (node.ref) {
      roleStr += ` [ref=${node.ref}]`;
    }

    // Determine if we need a colon (has children or properties)
    const hasContent = (node.props && Object.keys(node.props).length > 0) ||
                       (node.children && node.children.length > 0);

    if (hasContent) {
      roleStr += ':';
    }

    lines.push(`${spaces}- ${roleStr}`);

    // Add properties as /key: value
    if (node.props) {
      for (const [key, value] of Object.entries(node.props)) {
        const valueStr = typeof value === 'string' ? yamlEscapeValue(value) : value;
        lines.push(`${spaces}  - /${key}: ${valueStr}`);
      }
    }

    // Add children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        lines.push(serializeToYaml(child, indent + 1));
      }
    }

    return lines.filter(Boolean).join('\n');
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Generate an ARIA snapshot of the page
   * @returns {string} YAML representation of the accessibility tree
   */
  window.__devBrowser_getAISnapshot = function() {
    // Reset refs for fresh snapshot
    window.__devBrowserRefs = {};
    refCounter = 0;

    const tree = buildAriaNode(document.body);
    return serializeToYaml(tree);
  };

  /**
   * Get an element by its snapshot ref
   * @param {string} ref - The ref (e.g., "e1", "e5")
   * @returns {Element} The DOM element
   */
  window.__devBrowser_selectSnapshotRef = function(ref) {
    const refs = window.__devBrowserRefs;
    if (!refs) {
      throw new Error('No snapshot refs found. Call getAISnapshot first.');
    }
    const element = refs[ref];
    if (!element) {
      const refKeys = Object.keys(refs);
      const available = refKeys.slice(0, 20).join(', ') +
        (refKeys.length > 20 ? ` ... (${refKeys.length} total)` : '');
      throw new Error(`Ref "${ref}" not found. Available refs: ${available}`);
    }
    if (!element.isConnected) {
      throw new Error(`Ref "${ref}" points to a detached element. Regenerate snapshot.`);
    }
    return element;
  };

})();
