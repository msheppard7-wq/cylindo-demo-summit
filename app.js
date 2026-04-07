/* ============================================
   Summit Furniture — Cylindo Demo
   Config-driven PDP + Curator Gallery + Tear Sheet
   ============================================ */

let config = null;
let currentProductIndex = 0;
let currentFeatures = {};

const CONTENT_API = 'https://content.cylindo.com/api/v2';

const featureIcons = [
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><path d="M8 12s1.5-4 4-4 4 4 4 4-1.5 4-4 4-4-4-4-4"/></svg>'
];

// ---- Helpers ----

function getProductImageUrl(productCode, frame, features, size) {
  let url = `${CONTENT_API}/${config.cylindo.customerId}/products/${encodeURIComponent(productCode)}/frames/${frame || 1}/product.jpg?size=${size || 1024}`;
  if (features) {
    Object.entries(features).forEach(([k, v]) => {
      url += `&feature=${encodeURIComponent(k)}:${encodeURIComponent(v)}`;
    });
  }
  return url;
}

function getSwatchUrl(productCode, featureCode, optionValue, size) {
  return `${CONTENT_API}/${config.cylindo.customerId}/products/${encodeURIComponent(productCode)}/material/swatch.jpeg?feature=${encodeURIComponent(featureCode)}:${encodeURIComponent(optionValue)}&size=${size || 200}`;
}

function getPlaceholderUrl(productCode) {
  return `${CONTENT_API}/${config.cylindo.customerId}/products/${encodeURIComponent(productCode)}/default/${config.cylindo.remoteConfig}/placeholder.webp?size=768`;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---- Config & Routing ----

async function loadConfig() {
  const r = await fetch('config.json');
  config = await r.json();
  return config;
}

function getProductFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('product');
  if (id) { const idx = config.products.findIndex(p => p.id === id); if (idx >= 0) return idx; }
  return 0;
}

function updateURL() {
  const p = config.products[currentProductIndex];
  const url = new URL(window.location);
  url.searchParams.set('product', p.id);
  window.history.pushState({}, '', url);
}

// ---- Render Brand ----

function renderBrand() {
  const { brand } = config;
  document.getElementById('logo').textContent = brand.logoText;

  const nav = document.getElementById('main-nav');
  nav.innerHTML = brand.navLinks.map(l =>
    `<a href="#"${l === brand.navHighlight ? ' class="nav-highlight"' : ''}>${l}</a>`
  ).join('');

  document.getElementById('footer-grid').innerHTML = brand.footerColumns.map(col =>
    `<div class="footer-col"><h4>${col.title}</h4>${col.links.map(l => `<a href="#">${l}</a>`).join('')}</div>`
  ).join('');

  document.getElementById('footer-copyright').innerHTML = `&copy; 2026 ${brand.footerCopyright}. All rights reserved.`;
  document.title = `Cylindo Demo — ${brand.name}`;
}

// ---- Product Switcher ----

function renderProductSwitcher() {
  const sw = document.getElementById('product-switcher');
  if (config.products.length <= 1) { sw.style.display = 'none'; return; }

  sw.innerHTML = `<div class="switcher-inner">
    <span class="switcher-label">Products</span>
    ${config.products.map((p, i) =>
      `<button class="switcher-btn${i === currentProductIndex ? ' active' : ''}" data-index="${i}">${p.name}</button>`
    ).join('')}
  </div>`;

  sw.querySelectorAll('.switcher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      if (idx !== currentProductIndex) {
        currentProductIndex = idx;
        updateURL();
        renderProduct();
        renderProductSwitcher();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ---- Render Product ----

function renderProduct() {
  const product = config.products[currentProductIndex];
  const { cylindo } = config;

  currentFeatures = {};
  product.features.forEach(f => { currentFeatures[f.code] = f.options[0].value; });

  document.title = `${product.name} | ${config.brand.name} — Cylindo Demo`;

  // Breadcrumb
  document.getElementById('breadcrumb').innerHTML = product.breadcrumb.map(c =>
    `<a href="#">${c}</a><span class="sep">/</span>`
  ).join('') + `<span class="current">${product.name}</span>`;

  // Cylindo Viewer — Curator Gallery Mode
  const container = document.getElementById('cylindo-container');
  container.innerHTML = `
    <cylindo-viewer
      customer-id="${cylindo.customerId}"
      code="${product.code}"
      remote-config="${cylindo.remoteConfig}"
      presentation="gallery"
      controls="ar fullscreen nav zoom indicators"
      interaction-hiding-delay="Infinity"
      ignore-unknown-features="true"
    >
      <img alt="${product.name}" slot="placeholder" src="${getPlaceholderUrl(product.code)}" />
    </cylindo-viewer>
  `;

  // Badges
  const badgesHTML = product.badges.map(b => `<span class="badge badge-${b.type}">${b.text}</span>`).join('');

  // Feature options
  let optionsHTML = '';
  product.features.forEach(feature => {
    optionsHTML += `
      <div class="option-group">
        <label class="option-label">${feature.label} <span class="feature-selected" data-feature="${feature.code}">${feature.options[0].name}</span></label>
        <div class="fabric-options" data-feature-code="${feature.code}">
          ${feature.options.map((opt, i) =>
            `<button class="fabric-btn${i === 0 ? ' active' : ''}" data-value="${opt.value}" data-name="${opt.name}">${opt.name}</button>`
          ).join('')}
        </div>
      </div>
    `;
  });

  // Product Info
  document.getElementById('product-info').innerHTML = `
    <div class="product-badges">${badgesHTML}</div>
    <h1 class="product-title">${product.name}</h1>
    <p class="product-description">${product.description}</p>
    <div class="product-price">
      <span class="price-current">${product.price}</span>
      <span class="price-note">${product.priceNote}</span>
    </div>
    <hr class="divider">
    ${optionsHTML}
    <a class="inquire-btn" href="mailto:sales@summitfurniture.com?subject=Inquiry: ${encodeURIComponent(product.name)}">Place an Order or Inquire</a>
    <div class="lead-time">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span>${product.leadTime}</span>
    </div>
  `;

  // Features
  document.getElementById('features-grid').innerHTML = product.highlights.map((h, i) => `
    <div class="feature-card">
      <div class="feature-icon">${featureIcons[i % featureIcons.length]}</div>
      <h3>${h.title}</h3>
      <p>${h.description}</p>
    </div>
  `).join('');

  // Specs
  document.getElementById('specs-grid').innerHTML = product.specs.map(group => `
    <div class="spec-group">
      <h3>${group.group}</h3>
      <table class="spec-table">
        ${group.items.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('')}
      </table>
    </div>
  `).join('');

  // FAQs
  document.getElementById('faq-list').innerHTML = product.faqs.map(faq => `
    <details class="faq-item">
      <summary>${faq.q}</summary>
      <p>${faq.a}</p>
    </details>
  `).join('');

  bindInteractions();
}

// ---- Interactions ----

function bindInteractions() {
  const viewer = document.querySelector('cylindo-viewer');

  // Fabric buttons → update Cylindo viewer
  document.querySelectorAll('.fabric-options').forEach(group => {
    const featureCode = group.dataset.featureCode;
    const selectedLabel = document.querySelector(`.feature-selected[data-feature="${featureCode}"]`);

    group.querySelectorAll('.fabric-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.fabric-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (selectedLabel) selectedLabel.textContent = btn.dataset.name;
        currentFeatures[featureCode] = btn.dataset.value;

        if (viewer) {
          try {
            // Use configuration attribute string for Curator compatibility
            const configStr = Object.entries(currentFeatures)
              .map(([k, v]) => `${k}:${v}`)
              .join(',');
            viewer.setAttribute('configuration', configStr);
          } catch (e) {
            console.log('Cylindo feature update:', featureCode, btn.dataset.value);
          }
        }
      });
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('summary').addEventListener('click', () => {
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item && other.hasAttribute('open')) other.removeAttribute('open');
      });
    });
  });

  // Tear sheet
  document.getElementById('tearsheet-btn').addEventListener('click', openTearSheet);
}

// ---- Tear Sheet ----

function openTearSheet() {
  const product = config.products[currentProductIndex];
  const overlay = document.getElementById('tearsheet-overlay');
  const content = document.getElementById('tearsheet-content');

  const currentSelections = {};
  product.features.forEach(f => {
    const activeBtn = document.querySelector(`.fabric-options[data-feature-code="${f.code}"] .fabric-btn.active`);
    currentSelections[f.code] = {
      label: f.label,
      name: activeBtn ? activeBtn.dataset.name : f.options[0].name,
      value: currentFeatures[f.code] || f.options[0].value
    };
  });

  const configStr = Object.values(currentSelections).map(s => `${s.label}: ${s.name}`).join(' | ');
  const heroImageUrl = getProductImageUrl(product.code, 1, currentFeatures, 1024);

  let swatchesHTML = '';
  product.features.forEach(feature => {
    swatchesHTML += `
      <div class="ts-swatches-section">
        <h3 class="ts-swatches-title">Available ${feature.label} Options</h3>
        <div class="ts-swatches-grid">
          ${feature.options.map(opt => {
            const isActive = currentFeatures[feature.code] === opt.value;
            const swatchUrl = getSwatchUrl(product.code, feature.code, opt.value, 200);
            return `
              <div class="ts-swatch-item${isActive ? ' active' : ''}">
                <div class="ts-swatch-img"><img src="${swatchUrl}" alt="${opt.name}" onerror="this.style.display='none'"></div>
                <div class="ts-swatch-name">${opt.name}${isActive ? ' (shown)' : ''}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  const specsHTML = `<div class="ts-specs-section"><div class="ts-specs-grid">
    ${product.specs.map(group => `
      <div class="ts-specs-group">
        <h4>${group.group}</h4>
        <table class="ts-specs-table">
          ${group.items.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('')}
        </table>
      </div>
    `).join('')}
  </div></div>`;

  const highlightsHTML = product.highlights.map(h =>
    `<li><strong>${h.title}</strong> — ${h.description}</li>`
  ).join('');

  content.innerHTML = `
    <div class="ts-header">
      <div>
        <div class="ts-brand">${config.brand.logoText}</div>
        <div class="ts-brand-tag">${config.brand.tagline || ''}</div>
      </div>
      <div class="ts-meta">
        <div class="ts-meta-date">${formatDate()}</div>
        <div>Product Tear Sheet</div>
      </div>
    </div>
    <h2 class="ts-product-title">${product.name}</h2>
    <div class="ts-product-config">${configStr}</div>
    <div class="ts-hero">
      <div class="ts-hero-image">
        <img src="${heroImageUrl}" alt="${product.name} - ${configStr}">
      </div>
      <div class="ts-hero-info">
        <div class="ts-price">${product.price}</div>
        <p class="ts-description">${product.description}</p>
        <ul class="ts-highlights">${highlightsHTML}</ul>
      </div>
    </div>
    ${swatchesHTML}
    ${specsHTML}
    <div class="ts-footer">
      <div>&copy; 2026 ${config.brand.name}. All specifications subject to change.</div>
      <div class="ts-cylindo">3D Visualization by Cylindo</div>
    </div>
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTearSheet() {
  document.getElementById('tearsheet-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ---- Init ----

window.addEventListener('popstate', () => {
  currentProductIndex = getProductFromURL();
  renderProduct();
  renderProductSwitcher();
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  currentProductIndex = getProductFromURL();
  renderBrand();
  renderProductSwitcher();
  renderProduct();

  document.getElementById('tearsheet-close').addEventListener('click', closeTearSheet);
  document.getElementById('tearsheet-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTearSheet();
  });
  document.getElementById('tearsheet-print-btn').addEventListener('click', () => window.print());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTearSheet(); });
});
