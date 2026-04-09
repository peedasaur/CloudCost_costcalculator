/*
  CloudCost — FinOps Dashboard  |  script.js
  Clean, readable, student-friendly vanilla JS
  Matches updated HTML structure (no canvas, new class names)
*/

'use strict';

// ─────────────────────────────────────────────────────────────
// 1. PRICING DATA
// ─────────────────────────────────────────────────────────────
const PRICING = {
  aws: {
    small:   5,     // ₹ / hour
    medium:  10,
    large:   20,
    storage: 2,     // ₹ / GB per month
    label:   'AWS — EC2 + S3 equivalent'
  },
  azure: {
    small:   5.5,
    medium:  11,
    large:   22,
    storage: 1.8,
    label:   'Azure — VM + Blob equivalent'
  },
  gcp: {
    small:   4.5,
    medium:  9,
    large:   18,
    storage: 1.7,
    label:   'GCP — Compute Engine + GCS'
  }
};

const BUDGET_LIMIT = 1000; // ₹ threshold for alert

let activeCloud      = 'aws';
let costChartInst    = null;
let currentChartType = 'bar';

// ─────────────────────────────────────────────────────────────
// 2. SCROLL REVEAL — fade-in elements as they enter view
// ─────────────────────────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-left');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once only
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
})();

// ─────────────────────────────────────────────────────────────
// 3. HERO STAT COUNT-UP
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // Trigger hero reveal
  document.querySelectorAll('.hero-text').forEach(el => el.classList.add('visible'));

  // Animate stat numbers
  document.querySelectorAll('.stat-val').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    countUp(el, 0, target, 1100);
  });
});

// Smooth count animation with ease-out
function countUp(el, start, end, duration) {
  const range   = end - start;
  const t0      = performance.now();

  function step(now) {
    const progress = Math.min((now - t0) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + range * ease);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────────────────────
// 4. NAVBAR — scroll background + active link tracking
// ─────────────────────────────────────────────────────────────
const navbar   = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);

  // Highlight active section
  const ids = ['home', 'dashboard', 'features'];
  let current = 'home';
  ids.forEach(id => {
    const sec = document.getElementById(id);
    if (sec && window.scrollY >= sec.offsetTop - 160) current = id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}, { passive: true });

// Close mobile nav on link click
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// Smooth scroll
function scrollToDashboard() {
  document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}
function scrollToFeatures() {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────────────────────────────
// 5. RIPPLE EFFECT on buttons
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.ripple').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top:  ${e.clientY - rect.top  - size / 2}px;
    `;
    this.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
});

// ─────────────────────────────────────────────────────────────
// 6. CLOUD PROVIDER TOGGLE
// ─────────────────────────────────────────────────────────────
function switchCloud(cloud) {
  activeCloud = cloud;

  // Update tab active state
  ['aws', 'azure', 'gcp'].forEach(id => {
    document.getElementById('tab-' + id).classList.toggle('active', id === cloud);
  });

  // Update label
  document.getElementById('pricingLabel').textContent = PRICING[cloud].label;

  // Refresh preview
  updatePricingPreview();

  // Re-calculate if results already showing
  const num = document.getElementById('vm-cost').querySelector('.count-num');
  if (num && num.textContent !== '0') calculateCost();

  showToast(`Switched to ${cloud.toUpperCase()}`, 'info');
}

// ─────────────────────────────────────────────────────────────
// 7. LIVE PRICING PREVIEW
// ─────────────────────────────────────────────────────────────
function updatePricingPreview() {
  const vmType = document.getElementById('vm-type').value;
  const el     = document.getElementById('previewText');

  if (!vmType) {
    el.textContent = 'Select a VM to see pricing';
    return;
  }

  const p     = PRICING[activeCloud];
  const names = { small: 'Small', medium: 'Medium', large: 'Large' };

  el.innerHTML =
    `<strong style="color:#8898b8">${names[vmType]}</strong> — ` +
    `₹${p[vmType]}/hr · Storage ₹${p.storage}/GB · ${activeCloud.toUpperCase()}`;
}

// ─────────────────────────────────────────────────────────────
// 8. CALCULATE COST
// ─────────────────────────────────────────────────────────────
function toggleDropdown() {
  document.getElementById('vm-select-container').classList.toggle('open');
}

function selectOption(value, text) {
  document.getElementById('vm-type').value = value;
  document.getElementById('vm-select-text').textContent = text;
  document.getElementById('vm-select-container').classList.remove('open');
  updatePricingPreview();
}

document.addEventListener('click', (e) => {
  const container = document.getElementById('vm-select-container');
  if (container && !container.contains(e.target)) {
    container.classList.remove('open');
  }
});

function calculateCost() {
  const vmType  = document.getElementById('vm-type').value;
  const hours   = parseFloat(document.getElementById('hours').value);
  const storage = parseFloat(document.getElementById('storage').value);

  // Validation
  if (!vmType) {
    showToast('Please select a VM instance type.', 'error');
    document.getElementById('vm-select-container').focus();
    return;
  }
  if (isNaN(hours) || hours < 0) {
    showToast('Enter a valid number of hours.', 'error');
    document.getElementById('hours').focus();
    return;
  }
  if (isNaN(storage) || storage < 0) {
    showToast('Enter a valid storage amount.', 'error');
    document.getElementById('storage').focus();
    return;
  }

  const p        = PRICING[activeCloud];
  const vmCost   = p[vmType] * hours;
  const storCost = p.storage * storage;
  const total    = vmCost + storCost;

  // Animate the numbers
  animateCard('vm-cost',      vmCost);
  animateCard('storage-cost', storCost);
  animateCard('total-cost',   total);

  // VM note
  document.getElementById('vm-note').textContent =
    `₹${p[vmType]}/hr × ${hours} hrs (${activeCloud.toUpperCase()})`;

  // Budget tag
  const tag = document.getElementById('budget-tag');
  if (total > BUDGET_LIMIT) {
    tag.textContent = '🔴 Over Budget';
    tag.className   = 'budget-tag tag-over';
  } else {
    tag.textContent = '🟢 Within Budget';
    tag.className   = 'budget-tag tag-ok';
  }

  renderAlert(total);
  renderSuggestions(vmType, hours, storage, total);
  renderChart(vmCost, storCost);

  showToast('Cost calculated.', 'success');
}

function animateCard(id, value) {
  const el  = document.getElementById(id);
  const num = el.querySelector('.count-num');
  countUp(num, 0, Math.round(value), 800);
}

// ─────────────────────────────────────────────────────────────
// 9. BUDGET ALERT
// ─────────────────────────────────────────────────────────────
function renderAlert(total) {
  const section = document.getElementById('alert-section');
  const msg     = document.getElementById('alert-message');

  if (total > BUDGET_LIMIT) {
    const over = Math.round(total - BUDGET_LIMIT);
    msg.textContent =
      `Estimated spend ₹${Math.round(total)} exceeds the ₹${BUDGET_LIMIT} monthly limit ` +
      `by ₹${over}. Consider rightsizing or scheduling downtime.`;
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────────────────
// 10. FINOPS RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    cond:  (vm, h)       => vm === 'large' && h <= 50,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    title: 'Downsize your VM',
    body:  'Large instance with ≤50 hrs/month. Medium saves ~50% on compute cost.'
  },
  {
    cond:  (vm, h)       => vm === 'medium' && h <= 20,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    title: 'Rightsize to Small',
    body:  'Very low usage hours — a Small VM would be sufficient and roughly half the price.'
  },
  {
    cond:  (vm, h)       => h > 200,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    title: 'Schedule auto-shutdown',
    body:  'Running for 200+ hrs/month. Off-hours shutdown can reduce VM costs by up to 40%.'
  },
  {
    cond:  (vm, h, s)    => s > 200,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    title: 'Move cold data to object storage',
    body:  'Large storage footprint detected. S3/Blob/GCS is typically 60% cheaper for cold data.'
  },
  {
    cond:  (vm, h)       => h >= 720,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    title: 'Switch to Reserved Instances',
    body:  'Always-on workloads save 30–40% with a 1-year reserved commitment over on-demand.'
  },
  {
    cond:  (vm, h, s, t) => t > BUDGET_LIMIT,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    title: 'Audit idle resources',
    body:  'Budget exceeded — check for unused VMs, unattached disks, and orphan IPs now.'
  },
  {
    cond:  () => true,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
    title: 'Enable billing alerts',
    body:  'Set cloud budget alerts at 50%, 80%, and 100% cap to prevent surprise invoices.'
  },
  {
    cond:  () => true,
    icon:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    title: 'Tag every resource',
    body:  'Apply project + team + env tags to all resources for proper cost attribution.'
  }
];

function renderSuggestions(vmType, hours, storage, total) {
  const section = document.getElementById('suggestions-section');
  const list    = document.getElementById('suggestions-list');

  list.innerHTML = '';

  SUGGESTIONS
    .filter(s => s.cond(vmType, hours, storage, total))
    .forEach((s, idx) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.style.animationDelay = `${idx * 0.055}s`;
      li.innerHTML = `
        <div class="suggestion-icon">${s.icon}</div>
        <div class="suggestion-text">
          <strong>${s.title}</strong>
          <span>${s.body}</span>
        </div>
      `;
      list.appendChild(li);
    });

  section.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
// 11. CHART.JS
// ─────────────────────────────────────────────────────────────
function renderChart(vmCost, storCost) {
  const canvas      = document.getElementById('costChart');
  const placeholder = document.getElementById('chartPlaceholder');

  placeholder.style.display = 'none';
  canvas.classList.add('visible');

  if (costChartInst) {
    costChartInst.destroy();
    costChartInst = null;
  }

  const ctx   = canvas.getContext('2d');
  const isBar = currentChartType === 'bar';

  // Muted gradients — not neon
  const grad1 = ctx.createLinearGradient(0, 0, 0, 260);
  grad1.addColorStop(0, 'rgba(76,126,243,0.82)');
  grad1.addColorStop(1, 'rgba(76,126,243,0.22)');

  const grad2 = ctx.createLinearGradient(0, 0, 0, 260);
  grad2.addColorStop(0, 'rgba(167,139,250,0.82)');
  grad2.addColorStop(1, 'rgba(167,139,250,0.22)');

  costChartInst = new Chart(ctx, {
    type: currentChartType,
    data: {
      labels: ['VM Cost', 'Storage Cost'],
      datasets: [{
        label: 'Cost (₹)',
        data:  [Math.round(vmCost), Math.round(storCost)],
        backgroundColor: isBar ? [grad1, grad2] : ['rgba(76,126,243,0.78)', 'rgba(167,139,250,0.78)'],
        borderColor:  ['rgba(76,126,243,1)', 'rgba(167,139,250,1)'],
        borderWidth:  isBar ? 1.5 : 2,
        borderRadius: isBar ? 8 : 0,
        hoverBackgroundColor: ['rgba(76,126,243,0.95)', 'rgba(167,139,250,0.95)']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 750, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          display: !isBar,
          labels: { color: '#8898b8', font: { family: 'Inter', size: 12 }, padding: 14, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: '#1c2540',
          borderColor: 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          titleColor: '#eaf0fb',
          bodyColor: '#8898b8',
          padding: 11,
          cornerRadius: 8,
          callbacks: {
            label: function(ctx) {
              const val = isBar ? ctx.parsed.y : ctx.parsed;
              return '  ₹' + Number(val).toLocaleString('en-IN');
            }
          }
        }
      },
      scales: isBar ? {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#4a5878',
            font: { family: 'Inter', size: 11 },
            callback: v => '₹' + Number(v).toLocaleString('en-IN')
          },
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
        },
        x: {
          ticks: { color: '#8898b8', font: { family: 'Inter', size: 12 } },
          grid: { display: false }
        }
      } : {}
    }
  });
}

function switchChartType(type, btn) {
  currentChartType = type;
  document.querySelectorAll('.ctype').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (costChartInst) {
    const d = costChartInst.data.datasets[0].data;
    renderChart(d[0], d[1]);
  }
}

// ─────────────────────────────────────────────────────────────
// 12. RESET
// ─────────────────────────────────────────────────────────────
function resetDashboard() {
  document.getElementById('vm-type').value  = '';
  const selectText = document.getElementById('vm-select-text');
  if(selectText) selectText.textContent = 'Select an instance size';
  document.getElementById('hours').value    = '';
  document.getElementById('storage').value  = '';

  ['vm-cost', 'storage-cost', 'total-cost'].forEach(id => {
    document.getElementById(id).querySelector('.count-num').textContent = '0';
  });

  document.getElementById('vm-note').textContent    = '—';
  document.getElementById('budget-tag').textContent = 'Enter values above';
  document.getElementById('budget-tag').className   = 'budget-tag';

  document.getElementById('alert-section').classList.add('hidden');
  document.getElementById('suggestions-section').classList.add('hidden');
  document.getElementById('previewText').textContent = 'Select a VM to see pricing';

  if (costChartInst) { costChartInst.destroy(); costChartInst = null; }
  document.getElementById('costChart').classList.remove('visible');
  document.getElementById('chartPlaceholder').style.display = 'flex';

  showToast('Dashboard cleared.', 'info');
}

// ─────────────────────────────────────────────────────────────
// 13. TOASTS
// ─────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { 
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>', 
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', 
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' 
  };
  const cont  = document.getElementById('toast-container');
  const el    = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  cont.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => el.remove());
  }, 2800);
}

// ─────────────────────────────────────────────────────────────
// 14. KEYBOARD — Enter in form fields triggers calculate
// ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const id = document.activeElement?.id;
    if (['vm-type', 'hours', 'storage'].includes(id)) calculateCost();
  }
});
