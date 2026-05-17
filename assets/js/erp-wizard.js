// erp-wizard.js — shared step-by-step wizard logic
(function () {
  let currentStep = 1;
  let totalSteps = 1;

  function init() {
    const panels = document.querySelectorAll('.step-panel');
    totalSteps = panels.length;
    if (totalSteps <= 1) return;
    goToStep(1);
  }

  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;

    document.querySelectorAll('.step-panel').forEach((p, i) => {
      p.classList.toggle('active', i + 1 === currentStep);
    });

    document.querySelectorAll('.wizard-step').forEach((s, i) => {
      s.classList.remove('active', 'completed');
      if (i + 1 < currentStep) s.classList.add('completed');
      if (i + 1 === currentStep) s.classList.add('active');
      const bubble = s.querySelector('.step-bubble');
      if (bubble) bubble.textContent = i + 1 < currentStep ? '✓' : String(i + 1);
    });

    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const counter = document.getElementById('stepCounter');

    if (btnBack) btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (counter) counter.textContent = 'Step ' + currentStep + ' / ' + totalSteps;

    if (btnNext) {
      if (currentStep === totalSteps) {
        btnNext.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Simpan Data`;
        btnNext.onclick = function () {
          var form = document.getElementById('formBreakdown') || document.getElementById('dandoriForm');
          if (form) form.requestSubmit(); else nextStep();
        };
      } else {
        btnNext.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        btnNext.onclick = nextStep;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 1) goToStep(currentStep - 1);
  }

  function validateCurrentStep() {
    var panel = document.querySelector('.step-panel[data-step="' + currentStep + '"]');
    if (!panel) return true;
    var valid = true;
    panel.querySelectorAll('[required]').forEach(function (el) {
      if (!el.value.trim()) {
        el.classList.add('field-error');
        valid = false;
      } else {
        el.classList.remove('field-error');
      }
    });
    if (!valid) {
      var first = panel.querySelector('.field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  }

  // Remove field-error class on user input
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[required]') && e.target.value.trim()) {
      e.target.classList.remove('field-error');
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[required]') && e.target.value.trim()) {
      e.target.classList.remove('field-error');
    }
  });

  window.wizardNextStep = nextStep;
  window.wizardPrevStep = prevStep;
  window.wizardGoToStep = goToStep;
  window.wizardInit = init;

  document.addEventListener('DOMContentLoaded', init);
})();
