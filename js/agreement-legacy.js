/* Agreement page — legacy mode toggle */

(function () {
  const STORAGE_KEY = 'proto_legacy_mode';

  const legacyCheck = document.getElementById('proto-legacy-check');
  const openBtn = document.getElementById('proto-settings-open');
  const agreementProto = document.getElementById('agreement');
  const agreementLegacy = document.getElementById('agreement-legacy');
  const legacyError = document.getElementById('legacy-error-message');
  const saveBtn = document.getElementById('proto-settings-save');

  function isLegacy() {
    return document.documentElement.classList.contains('legacy-mode');
  }

  function syncAgreementCheckboxes(fromLegacy) {
    if (!agreementProto || !agreementLegacy) return;
    if (fromLegacy) agreementProto.checked = agreementLegacy.checked;
    else agreementLegacy.checked = agreementProto.checked;
  }

  function applyLegacyMode(enabled, syncFromLegacy) {
    document.documentElement.classList.toggle('legacy-mode', enabled);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch (e) { /* ignore */ }

    if (enabled) {
      syncAgreementCheckboxes(true);
      if (legacyError) legacyError.hidden = true;
    } else {
      syncAgreementCheckboxes(false);
    }

    if (legacyCheck) legacyCheck.checked = enabled;
    document.title = enabled ? 'Welcome to My Personal Page' : 'QUARANTINE PROTOCOL';
  }

  function loadLegacyMode() {
    let enabled = false;
    try {
      enabled = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) { /* ignore */ }
    applyLegacyMode(enabled, true);
  }

  window.agreementIsLegacyMode = isLegacy;
  window.agreementShowLegacyError = function () {
    if (legacyError) legacyError.hidden = false;
  };
  window.agreementApplyLegacyMode = applyLegacyMode;

  if (legacyCheck) {
    legacyCheck.addEventListener('change', () => {
      applyLegacyMode(legacyCheck.checked, legacyCheck.checked);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (legacyCheck) applyLegacyMode(legacyCheck.checked, legacyCheck.checked);
    });
  }

  if (agreementLegacy) {
    agreementLegacy.addEventListener('change', () => {
      agreementLegacy.blur();
      if (agreementProto) agreementProto.checked = agreementLegacy.checked;
    });
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (legacyCheck) legacyCheck.checked = isLegacy();
    });
  }

  document.addEventListener('DOMContentLoaded', loadLegacyMode);
})();
