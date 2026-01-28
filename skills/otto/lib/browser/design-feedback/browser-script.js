// =============================================================================
// Design Feedback Browser Script (Vanilla JS)
// =============================================================================
//
// A standalone feedback overlay that can be injected into any web page.
// Provides click-to-annotate functionality and pushes feedback to a queue.
//
// Usage: Inject via page.addScriptTag({ content: script })
// Access feedback via: window.__designFeedbackQueue
//
// =============================================================================

(function () {
  "use strict";

  // Prevent double initialization
  if (window.__designFeedbackInitialized) return;
  window.__designFeedbackInitialized = true;

  // =============================================================================
  // State
  // =============================================================================

  /** @type {Array<Object>} Saved feedback (not yet submitted to Claude) */
  window.__designFeedbackSaved = window.__designFeedbackSaved || [];

  /** @type {Array<Object>} Submitted feedback (ready for Claude to consume) */
  window.__designFeedbackSubmit = window.__designFeedbackSubmit || [];

  let isActive = false;
  let hoveredElement = null;
  let selectedElement = null;
  let feedbackCounter = 0;

  // =============================================================================
  // Styles
  // =============================================================================

  const STYLES = `
    .df-overlay {
      position: fixed;
      pointer-events: none;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 4px;
      z-index: 2147483646;
      transition: all 0.1s ease;
    }

    .df-overlay.selected {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }

    .df-toolbar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #1a1a2e;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .df-toolbar button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .df-toolbar .annotate-btn {
      background: #3b82f6;
      color: white;
    }

    .df-toolbar .annotate-btn:hover {
      background: #2563eb;
    }

    .df-toolbar .annotate-btn.active {
      background: #22c55e;
    }

    .df-toolbar .close-btn {
      background: #374151;
      color: #9ca3af;
    }

    .df-toolbar .close-btn:hover {
      background: #4b5563;
      color: white;
    }

    .df-toolbar .send-all-btn {
      background: #22c55e;
      color: white;
    }

    .df-toolbar .send-all-btn:hover {
      background: #16a34a;
    }

    .df-toolbar .send-all-btn:disabled {
      background: #374151;
      color: #6b7280;
      cursor: not-allowed;
    }

    .df-toolbar .count {
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: #9ca3af;
      font-size: 13px;
    }

    .df-popup {
      position: fixed;
      width: 320px;
      background: #1a1a2e;
      border-radius: 12px;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: df-popup-in 0.2s ease;
    }

    @keyframes df-popup-in {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .df-popup-header {
      padding: 12px 16px;
      border-bottom: 1px solid #2a2a4a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .df-popup-element {
      color: #a78bfa;
      font-size: 13px;
      font-weight: 500;
      font-family: ui-monospace, monospace;
    }

    .df-popup-text {
      color: #9ca3af;
      font-size: 12px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .df-popup-body {
      padding: 12px 16px;
    }

    .df-popup textarea {
      width: 100%;
      min-height: 80px;
      padding: 10px 12px;
      background: #0f0f1a;
      border: 1px solid #2a2a4a;
      border-radius: 8px;
      color: #e5e5e5;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    }

    .df-popup textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .df-popup textarea::placeholder {
      color: #6b7280;
    }

    .df-popup-actions {
      padding: 12px 16px;
      border-top: 1px solid #2a2a4a;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .df-popup-actions button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .df-popup-actions .cancel-btn {
      background: transparent;
      color: #9ca3af;
    }

    .df-popup-actions .cancel-btn:hover {
      color: white;
    }

    .df-popup-actions .save-btn {
      background: #374151;
      color: #e5e5e5;
    }

    .df-popup-actions .save-btn:hover {
      background: #4b5563;
    }

    .df-popup-actions .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .df-popup-actions .submit-btn {
      background: #3b82f6;
      color: white;
    }

    .df-popup-actions .submit-btn:hover {
      background: #2563eb;
    }

    .df-popup-actions .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .df-marker {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 2147483645;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.15s ease;
    }

    .df-marker:hover {
      transform: scale(1.15);
    }
  `;

  // =============================================================================
  // DOM Elements
  // =============================================================================

  let styleEl = null;
  let toolbarEl = null;
  let overlayEl = null;
  let popupEl = null;
  let markers = [];

  function injectStyles() {
    styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  function createToolbar() {
    toolbarEl = document.createElement("div");
    toolbarEl.className = "df-toolbar";

    const annotateBtn = document.createElement("button");
    annotateBtn.className = "annotate-btn";
    annotateBtn.textContent = "Annotate";

    const countSpan = document.createElement("span");
    countSpan.className = "count";
    countSpan.textContent = "0 saved";

    const sendAllBtn = document.createElement("button");
    sendAllBtn.className = "send-all-btn";
    sendAllBtn.textContent = "Send All";
    sendAllBtn.disabled = true;

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "Close";

    toolbarEl.appendChild(annotateBtn);
    toolbarEl.appendChild(countSpan);
    toolbarEl.appendChild(sendAllBtn);
    toolbarEl.appendChild(closeBtn);
    document.body.appendChild(toolbarEl);

    annotateBtn.addEventListener("click", () => {
      isActive = !isActive;
      annotateBtn.classList.toggle("active", isActive);
      annotateBtn.textContent = isActive ? "Click Element" : "Annotate";
      if (!isActive) {
        hideOverlay();
      }
    });

    sendAllBtn.addEventListener("click", sendAllFeedback);
    closeBtn.addEventListener("click", cleanup);
  }

  function createOverlay() {
    overlayEl = document.createElement("div");
    overlayEl.className = "df-overlay";
    overlayEl.style.display = "none";
    document.body.appendChild(overlayEl);
  }

  function updateOverlay(element) {
    if (!element) {
      overlayEl.style.display = "none";
      return;
    }

    const rect = element.getBoundingClientRect();
    overlayEl.style.display = "block";
    overlayEl.style.left = `${rect.left}px`;
    overlayEl.style.top = `${rect.top}px`;
    overlayEl.style.width = `${rect.width}px`;
    overlayEl.style.height = `${rect.height}px`;
  }

  function hideOverlay() {
    overlayEl.style.display = "none";
    overlayEl.classList.remove("selected");
    hoveredElement = null;
  }

  // =============================================================================
  // Element Identification
  // =============================================================================

  function getElementIdentifier(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = element.className && typeof element.className === "string"
      ? "." + element.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return `${tag}${id}${classes}`;
  }

  function getElementPath(element) {
    const parts = [];
    let current = element;
    while (current && current !== document.body && parts.length < 5) {
      parts.unshift(getElementIdentifier(current));
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  function getElementText(element) {
    const text = element.textContent?.trim() || "";
    return text.slice(0, 50) + (text.length > 50 ? "..." : "");
  }

  function getCSSSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];
    let current = element;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith("df-"));
        if (classes.length) {
          selector += "." + classes.slice(0, 2).join(".");
        }
      }

      // Add nth-child if needed for specificity
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          child => child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  function getAriaRole(element) {
    return element.getAttribute("role") || getImplicitRole(element);
  }

  function getImplicitRole(element) {
    const tag = element.tagName.toLowerCase();
    const roleMap = {
      button: "button",
      a: "link",
      input: getInputRole(element),
      select: "combobox",
      textarea: "textbox",
      img: "img",
      nav: "navigation",
      header: "banner",
      footer: "contentinfo",
      main: "main",
      aside: "complementary",
      article: "article",
      section: "region",
      form: "form",
      table: "table",
      ul: "list",
      ol: "list",
      li: "listitem",
      h1: "heading",
      h2: "heading",
      h3: "heading",
      h4: "heading",
      h5: "heading",
      h6: "heading",
    };
    return roleMap[tag] || "generic";
  }

  function getInputRole(element) {
    const type = element.type || "text";
    const inputRoles = {
      checkbox: "checkbox",
      radio: "radio",
      button: "button",
      submit: "button",
      reset: "button",
      range: "slider",
      search: "searchbox",
    };
    return inputRoles[type] || "textbox";
  }

  // =============================================================================
  // Popup
  // =============================================================================

  function showPopup(element) {
    selectedElement = element;
    overlayEl.classList.add("selected");

    const rect = element.getBoundingClientRect();
    const elementId = getElementIdentifier(element);
    const elementText = getElementText(element);

    popupEl = document.createElement("div");
    popupEl.className = "df-popup";

    // Position popup near element but ensure it stays in viewport
    let left = rect.right + 10;
    let top = rect.top;

    // If popup would go off right edge, position to the left
    if (left + 320 > window.innerWidth) {
      left = rect.left - 330;
      if (left < 0) left = 10;
    }

    // If popup would go off bottom, move it up
    if (top + 200 > window.innerHeight) {
      top = window.innerHeight - 210;
    }
    if (top < 10) top = 10;

    popupEl.style.left = `${left}px`;
    popupEl.style.top = `${top}px`;

    // Build popup using safe DOM methods
    const header = document.createElement("div");
    header.className = "df-popup-header";

    const elementSpan = document.createElement("span");
    elementSpan.className = "df-popup-element";
    elementSpan.textContent = elementId;
    header.appendChild(elementSpan);

    if (elementText) {
      const textSpan = document.createElement("span");
      textSpan.className = "df-popup-text";
      textSpan.textContent = `"${elementText}"`;
      header.appendChild(textSpan);
    }

    const body = document.createElement("div");
    body.className = "df-popup-body";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "What should change?";
    body.appendChild(textarea);

    const actions = document.createElement("div");
    actions.className = "df-popup-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = "Cancel";

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Save";
    saveBtn.disabled = true;

    const submitBtn = document.createElement("button");
    submitBtn.className = "submit-btn";
    submitBtn.textContent = "Submit";
    submitBtn.disabled = true;

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    actions.appendChild(submitBtn);

    popupEl.appendChild(header);
    popupEl.appendChild(body);
    popupEl.appendChild(actions);

    document.body.appendChild(popupEl);

    textarea.focus();

    textarea.addEventListener("input", () => {
      const hasText = !!textarea.value.trim();
      saveBtn.disabled = !hasText;
      submitBtn.disabled = !hasText;
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim()) {
          submitFeedback(element, textarea.value.trim());
        }
      }
      if (e.key === "Escape") {
        closePopup();
      }
    });

    cancelBtn.addEventListener("click", closePopup);
    saveBtn.addEventListener("click", () => {
      if (textarea.value.trim()) {
        saveFeedback(element, textarea.value.trim());
      }
    });
    submitBtn.addEventListener("click", () => {
      if (textarea.value.trim()) {
        submitFeedback(element, textarea.value.trim());
      }
    });
  }

  function closePopup() {
    if (popupEl) {
      popupEl.remove();
      popupEl = null;
    }
    selectedElement = null;
    hideOverlay();
  }

  // =============================================================================
  // Feedback Submission
  // =============================================================================

  function createFeedback(element, note) {
    feedbackCounter++;
    const rect = element.getBoundingClientRect();

    return {
      id: `fb_${Date.now()}_${feedbackCounter}`,
      selector: getCSSSelector(element),
      boundingBox: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      },
      text: getElementText(element),
      note: note,
      timestamp: Date.now(),
      ariaRole: getAriaRole(element),
      elementPath: getElementPath(element),
      element: getElementIdentifier(element),
    };
  }

  // Save feedback locally (for batch submission later)
  function saveFeedback(element, note) {
    const feedback = createFeedback(element, note);
    window.__designFeedbackSaved.push(feedback);

    // Add visual marker
    addMarker(element, feedbackCounter);

    // Update counter
    updateSavedCount();

    closePopup();
  }

  // Submit feedback immediately to Claude
  function submitFeedback(element, note) {
    const feedback = createFeedback(element, note);
    window.__designFeedbackSubmit.push(feedback);

    // Add visual marker
    addMarker(element, feedbackCounter);

    closePopup();

    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent("designFeedback:submitted", { detail: feedback }));
  }

  // Send all saved feedback to Claude
  function sendAllFeedback() {
    const saved = window.__designFeedbackSaved.splice(0);
    if (saved.length === 0) return;

    window.__designFeedbackSubmit.push(...saved);
    updateSavedCount();

    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent("designFeedback:submitted", { detail: saved }));
  }

  function addMarker(element, number) {
    const rect = element.getBoundingClientRect();
    const marker = document.createElement("div");
    marker.className = "df-marker";
    marker.textContent = String(number);
    marker.style.left = `${rect.left + window.scrollX - 12}px`;
    marker.style.top = `${rect.top + window.scrollY - 12}px`;
    document.body.appendChild(marker);
    markers.push(marker);
  }

  function updateSavedCount() {
    const count = window.__designFeedbackSaved.length;
    const countEl = toolbarEl.querySelector(".count");
    countEl.textContent = `${count} saved`;

    // Enable/disable Send All button
    const sendAllBtn = toolbarEl.querySelector(".send-all-btn");
    sendAllBtn.disabled = count === 0;
  }

  // =============================================================================
  // Event Handlers
  // =============================================================================

  function handleMouseMove(e) {
    if (!isActive || popupEl) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element.closest(".df-toolbar, .df-popup, .df-overlay")) {
      hideOverlay();
      return;
    }

    hoveredElement = element;
    updateOverlay(element);
  }

  function handleClick(e) {
    if (!isActive) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element.closest(".df-toolbar, .df-popup")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (popupEl) {
      closePopup();
    } else if (hoveredElement) {
      showPopup(hoveredElement);
    }
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      if (popupEl) {
        closePopup();
      } else if (isActive) {
        isActive = false;
        const annotateBtn = toolbarEl.querySelector(".annotate-btn");
        annotateBtn.classList.remove("active");
        annotateBtn.textContent = "Annotate";
        hideOverlay();
      }
    }
  }

  // =============================================================================
  // Lifecycle
  // =============================================================================

  function init() {
    injectStyles();
    createToolbar();
    createOverlay();

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeydown, true);

    // Public API
    window.__designFeedbackAPI = {
      activate: () => {
        isActive = true;
        const annotateBtn = toolbarEl.querySelector(".annotate-btn");
        annotateBtn.classList.add("active");
        annotateBtn.textContent = "Click Element";
      },
      deactivate: () => {
        isActive = false;
        const annotateBtn = toolbarEl.querySelector(".annotate-btn");
        annotateBtn.classList.remove("active");
        annotateBtn.textContent = "Annotate";
        hideOverlay();
      },
      // Get saved feedback (not yet submitted)
      getSaved: () => window.__designFeedbackSaved.slice(),
      // Get submitted feedback (ready for Claude)
      getSubmitted: () => window.__designFeedbackSubmit.slice(),
      // Clear and return submitted feedback
      clearSubmitted: () => window.__designFeedbackSubmit.splice(0),
      // Send all saved feedback
      sendAll: sendAllFeedback,
      cleanup: cleanup,
    };
  }

  function cleanup() {
    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeydown, true);

    styleEl?.remove();
    toolbarEl?.remove();
    overlayEl?.remove();
    popupEl?.remove();
    markers.forEach(m => m.remove());

    delete window.__designFeedbackInitialized;
    delete window.__designFeedbackAPI;
    delete window.__designFeedbackSaved;
    delete window.__designFeedbackSubmit;
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
