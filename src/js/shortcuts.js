/**
 * Shortcuts Modal - Display and manage keyboard shortcuts
 */

function formatShortcut(shortcutArr) {
  if (!shortcutArr || !Array.isArray(shortcutArr)) return ''
  return shortcutArr.map(key => `<kbd>${key}</kbd>`).join('')
}

function generatePageShortcutsHtml() {
  if (typeof pages === 'undefined') {
    console.warn('Pages array not available for shortcuts modal')
    return ''
  }

  const pagesWithShortcuts = pages.filter(page => page.shortcut && page.shortcut.length > 0)

  if (pagesWithShortcuts.length === 0) {
    return ''
  }

  let html = '<div class="shortcuts-grid">'

  pagesWithShortcuts.forEach(page => {
    const shortcutHtml = formatShortcut(page.shortcut)
    html += `
      <div class="shortcut-item">
        ${shortcutHtml}
        <span>${page.name}</span>
      </div>
    `
  })

  html += '</div>'
  return html
}

function injectDynamicPageShortcuts() {
  const pageShortcutsSection = document.getElementById('page-shortcuts-section')
  if (pageShortcutsSection) {
    const html = generatePageShortcutsHtml()
    if (html) {
      pageShortcutsSection.innerHTML = html
    }
  }
}

function openShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  if (modal) {
    modal.classList.remove('hidden')
    injectDynamicPageShortcuts()
  }
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  if (modal) {
    modal.classList.add('hidden')
  }
}

function toggleShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  if (modal) {
    modal.classList.toggle('hidden')
  }
}

function initializeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  const closeBtn = document.getElementById('shortcuts-modal-close')

  if (!modal) {
    console.warn('Shortcuts modal not found in DOM')
    return
  }

  // Close button click handler
  if (closeBtn) {
    closeBtn.addEventListener('click', closeShortcutsModal)
  }

  // Close modal when clicking outside of the modal content
  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeShortcutsModal()
    }
  })

  // Close modal with Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeShortcutsModal()
    }
  })

  // Open modal with ? key
  document.addEventListener('keydown', function (event) {
    // Do nothing if an input-like element is focused
    const target = event.target
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      return
    }

    // Open shortcuts modal with ? key (Shift+/)
    if (event.shiftKey && event.key === '?') {
      event.preventDefault()
      openShortcutsModal()
    }
  })
}

// Initialize when document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeShortcutsModal)
} else {
  initializeShortcutsModal()
}
