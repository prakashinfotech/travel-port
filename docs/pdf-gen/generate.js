const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'pdfs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BRAND = {
  primary: '#1a56db',
  secondary: '#e91e8c',
  dark: '#1e293b',
  light: '#f8fafc',
  accent: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#64748b',
  border: '#e2e8f0',
};

const baseCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 14px; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: ${BRAND.dark};
    background: #fff;
    line-height: 1.6;
  }
  .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .cover {
    background: linear-gradient(135deg, ${BRAND.primary} 0%, #1e40af 40%, ${BRAND.secondary} 100%);
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: 60px 40px; min-height: 297mm; position: relative; overflow: hidden;
  }
  .cover::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 400px; height: 400px; border-radius: 50%;
    background: rgba(255,255,255,0.05); pointer-events: none;
  }
  .cover::after {
    content: ''; position: absolute; bottom: -150px; left: -100px;
    width: 500px; height: 500px; border-radius: 50%;
    background: rgba(255,255,255,0.04); pointer-events: none;
  }
  .cover-logo {
    width: 80px; height: 80px; background: rgba(255,255,255,0.15);
    border-radius: 20px; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px; backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  }
  .cover-logo svg { width: 48px; height: 48px; }
  .cover-badge {
    display: inline-block; background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 50px;
    padding: 6px 20px; font-size: 11px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(255,255,255,0.9); margin-bottom: 24px;
  }
  .cover h1 { font-size: 42px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 16px; }
  .cover h2 { font-size: 20px; font-weight: 400; color: rgba(255,255,255,0.8); margin-bottom: 40px; }
  .cover-divider { width: 60px; height: 3px; background: rgba(255,255,255,0.4); margin: 0 auto 40px; border-radius: 2px; }
  .cover-meta { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
  .cover-meta-item { text-align: center; }
  .cover-meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
  .cover-meta-item .value { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.95); }
  .cover-footer {
    position: absolute; bottom: 32px; left: 0; right: 0; text-align: center;
    font-size: 11px; color: rgba(255,255,255,0.5);
  }
  .content { padding: 40px 48px; }
  .toc-page { padding: 48px; }
  .toc-title { font-size: 28px; font-weight: 700; color: ${BRAND.primary}; margin-bottom: 8px; }
  .toc-subtitle { color: ${BRAND.gray}; font-size: 13px; margin-bottom: 40px; }
  .toc-section { margin-bottom: 8px; }
  .toc-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px; border-radius: 8px; cursor: default;
    transition: background 0.2s;
  }
  .toc-item:hover { background: ${BRAND.light}; }
  .toc-item.main { font-weight: 600; font-size: 14px; color: ${BRAND.dark}; }
  .toc-item.sub { font-size: 13px; color: ${BRAND.gray}; padding-left: 36px; }
  .toc-item .dots { flex: 1; border-bottom: 1px dotted ${BRAND.border}; margin: 0 12px; }
  .toc-item .page-num { font-weight: 500; color: ${BRAND.primary}; font-size: 12px; min-width: 24px; text-align: right; }
  .toc-num { width: 24px; height: 24px; background: ${BRAND.primary}; color: #fff; border-radius: 6px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; }
  .section-header {
    display: flex; align-items: center; gap: 16px;
    padding: 28px 0 20px; border-bottom: 2px solid ${BRAND.border}; margin-bottom: 28px;
  }
  .section-number {
    width: 44px; height: 44px; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent});
    color: #fff; border-radius: 12px; font-size: 18px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .section-title { font-size: 24px; font-weight: 700; color: ${BRAND.dark}; }
  .section-desc { font-size: 13px; color: ${BRAND.gray}; margin-top: 2px; }
  .sub-section { margin-bottom: 28px; }
  .sub-section h3 { font-size: 17px; font-weight: 600; color: ${BRAND.dark}; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .sub-section h3::before { content: ''; display: inline-block; width: 4px; height: 18px; background: linear-gradient(to bottom, ${BRAND.primary}, ${BRAND.secondary}); border-radius: 2px; }
  .sub-section h4 { font-size: 14px; font-weight: 600; color: ${BRAND.dark}; margin-bottom: 8px; margin-top: 16px; }
  p { font-size: 13px; color: #334155; line-height: 1.7; margin-bottom: 12px; }
  ul, ol { padding-left: 20px; margin-bottom: 12px; }
  li { font-size: 13px; color: #334155; line-height: 1.7; margin-bottom: 4px; }
  .table-wrapper { overflow: hidden; border-radius: 10px; border: 1px solid ${BRAND.border}; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead { background: linear-gradient(135deg, ${BRAND.primary}0F, ${BRAND.accent}0F); }
  thead th { padding: 12px 14px; text-align: left; font-weight: 600; color: ${BRAND.primary}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid ${BRAND.border}; }
  tbody tr { border-bottom: 1px solid ${BRAND.border}; transition: background 0.15s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 11px 14px; color: #334155; vertical-align: top; }
  code {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px; background: #f1f5f9; color: ${BRAND.primary};
    padding: 2px 6px; border-radius: 4px; border: 1px solid ${BRAND.border};
  }
  pre {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11.5px; background: #0f172a; color: #e2e8f0;
    padding: 20px 24px; border-radius: 10px; margin-bottom: 16px;
    overflow-x: auto; line-height: 1.7; white-space: pre-wrap; word-break: break-all;
  }
  pre .comment { color: #64748b; }
  pre .keyword { color: #93c5fd; }
  pre .string { color: #86efac; }
  pre .number { color: #fbbf24; }
  .card {
    background: ${BRAND.light}; border: 1px solid ${BRAND.border};
    border-radius: 10px; padding: 20px 24px; margin-bottom: 16px;
  }
  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .card-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .info-card {
    background: linear-gradient(135deg, ${BRAND.primary}08, ${BRAND.accent}08);
    border: 1px solid ${BRAND.primary}20; border-radius: 10px; padding: 18px 20px;
  }
  .info-card .label { font-size: 11px; font-weight: 600; color: ${BRAND.primary}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .info-card .value { font-size: 14px; font-weight: 600; color: ${BRAND.dark}; }
  .info-card .sub { font-size: 11px; color: ${BRAND.gray}; margin-top: 2px; }
  .stat-card {
    text-align: center; background: #fff; border: 1px solid ${BRAND.border};
    border-radius: 10px; padding: 20px 16px; position: relative; overflow: hidden;
  }
  .stat-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(to right, ${BRAND.primary}, ${BRAND.secondary});
  }
  .stat-card .num { font-size: 28px; font-weight: 800; color: ${BRAND.primary}; line-height: 1; margin-bottom: 6px; }
  .stat-card .label { font-size: 11px; color: ${BRAND.gray}; font-weight: 500; }
  .badge {
    display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 50px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
  }
  .badge-blue { background: ${BRAND.primary}15; color: ${BRAND.primary}; }
  .badge-green { background: ${BRAND.success}15; color: ${BRAND.success}; }
  .badge-pink { background: ${BRAND.secondary}15; color: ${BRAND.secondary}; }
  .badge-orange { background: ${BRAND.warning}15; color: ${BRAND.warning}; }
  .badge-red { background: ${BRAND.danger}15; color: ${BRAND.danger}; }
  .callout {
    display: flex; gap: 14px; padding: 16px 20px; border-radius: 10px; margin-bottom: 16px;
    border-left: 4px solid;
  }
  .callout-icon { font-size: 18px; flex-shrink: 0; line-height: 1; }
  .callout-content { flex: 1; }
  .callout-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .callout-text { font-size: 12.5px; line-height: 1.6; }
  .callout-info { background: ${BRAND.primary}08; border-color: ${BRAND.primary}; }
  .callout-info .callout-title { color: ${BRAND.primary}; }
  .callout-info .callout-text { color: #334155; }
  .callout-warning { background: ${BRAND.warning}08; border-color: ${BRAND.warning}; }
  .callout-warning .callout-title { color: #92400e; }
  .callout-warning .callout-text { color: #78350f; }
  .callout-success { background: ${BRAND.success}08; border-color: ${BRAND.success}; }
  .callout-success .callout-title { color: #065f46; }
  .callout-success .callout-text { color: #064e3b; }
  .flow {
    display: flex; flex-direction: column; gap: 0; margin-bottom: 20px;
  }
  .flow-step {
    display: flex; align-items: flex-start; gap: 16px; position: relative; padding-bottom: 20px;
  }
  .flow-step:last-child { padding-bottom: 0; }
  .flow-step:not(:last-child) .flow-line {
    position: absolute; left: 19px; top: 40px; width: 2px;
    height: calc(100% - 20px); background: linear-gradient(to bottom, ${BRAND.primary}, ${BRAND.accent});
  }
  .flow-dot {
    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent});
    border: 3px solid #fff; box-shadow: 0 0 0 2px ${BRAND.primary}40;
  }
  .flow-body { flex: 1; padding-top: 8px; }
  .flow-body h4 { font-size: 14px; font-weight: 600; color: ${BRAND.dark}; margin-bottom: 4px; }
  .flow-body p { font-size: 12.5px; color: ${BRAND.gray}; margin: 0; }
  .arch-box {
    border: 2px solid ${BRAND.border}; border-radius: 12px; padding: 16px 20px;
    margin-bottom: 12px; position: relative;
  }
  .arch-box-label {
    position: absolute; top: -11px; left: 16px; background: #fff;
    padding: 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; color: ${BRAND.primary};
  }
  .arch-layers { display: flex; flex-direction: column; gap: 8px; }
  .arch-layer {
    border-radius: 8px; padding: 12px 16px; text-align: center;
    font-size: 12.5px; font-weight: 600;
  }
  .layer-1 { background: linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.primary}25); color: ${BRAND.primary}; border: 1px solid ${BRAND.primary}30; }
  .layer-2 { background: linear-gradient(135deg, ${BRAND.accent}15, ${BRAND.accent}25); color: #0369a1; border: 1px solid ${BRAND.accent}30; }
  .layer-3 { background: linear-gradient(135deg, ${BRAND.success}15, ${BRAND.success}25); color: #065f46; border: 1px solid ${BRAND.success}30; }
  .layer-4 { background: linear-gradient(135deg, ${BRAND.warning}15, ${BRAND.warning}25); color: #92400e; border: 1px solid ${BRAND.warning}30; }
  .layer-5 { background: linear-gradient(135deg, ${BRAND.secondary}15, ${BRAND.secondary}25); color: #9d174d; border: 1px solid ${BRAND.secondary}30; }
  .page-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 48px; border-bottom: 1px solid ${BRAND.border};
    background: linear-gradient(to right, ${BRAND.light}, #fff);
  }
  .page-header .brand { font-size: 13px; font-weight: 700; color: ${BRAND.primary}; display: flex; align-items: center; gap: 8px; }
  .page-header .doc-name { font-size: 11px; color: ${BRAND.gray}; }
  .page-footer {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 48px; border-top: 1px solid ${BRAND.border};
    background: ${BRAND.light}; font-size: 11px; color: ${BRAND.gray};
  }
  .page-footer .page-num { font-weight: 600; color: ${BRAND.primary}; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
  }
`;

// ─── SRS ─────────────────────────────────────────────────────────────────────
function srsHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TravelPort — Software Requirements Specification</title>
<style>${baseCSS}</style>
</head>
<body>

<!-- COVER -->
<div class="page">
  <div class="cover">
    <div class="cover-logo">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 24L24 8L40 24" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 8V40" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M14 34H34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="5" fill="white" fill-opacity="0.3" stroke="white" stroke-width="2"/>
      </svg>
    </div>
    <div class="cover-badge">Software Requirements Specification</div>
    <h1>TravelPort</h1>
    <h2>Goibibo-Inspired Full-Stack Travel Booking Portal</h2>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="label">Document Version</div><div class="value">v1.0.0</div></div>
      <div class="cover-meta-item"><div class="label">Date</div><div class="value">May 2026</div></div>
      <div class="cover-meta-item"><div class="label">Status</div><div class="value">Final</div></div>
      <div class="cover-meta-item"><div class="label">Classification</div><div class="value">Internal</div></div>
    </div>
    <div class="cover-footer">TravelPort · Confidential · © 2026</div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Software Requirements Specification</div>
  </div>
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-subtitle">Software Requirements Specification — TravelPort v1.0.0</div>

    ${[
      ['1', 'Introduction', ['1.1 Purpose', '1.2 Scope', '1.3 Definitions & Acronyms', '1.4 References']],
      ['2', 'System Overview', ['2.1 Product Perspective', '2.2 User Classes', '2.3 Operating Environment']],
      ['3', 'Functional Requirements', ['3.1 Authentication Module', '3.2 Flight Booking Module', '3.3 Hotel Booking Module', '3.4 Transport Module', '3.5 Payment & Wallet', '3.6 Admin Panel']],
      ['4', 'Non-Functional Requirements', ['4.1 Performance', '4.2 Security', '4.3 Reliability', '4.4 Usability']],
      ['5', 'Use Cases', ['5.1 Book a Flight', '5.2 Hotel Checkout', '5.3 Wallet Top-up']],
      ['6', 'Constraints & Assumptions', []],
    ].map(([num, title, subs], i) => `
      <div class="toc-section">
        <div class="toc-item main">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="toc-num">${num}</div>${title}
          </div>
          <div style="display:flex;align-items:center">
            <span class="dots"></span>
            <span class="page-num">${3 + i * 2}</span>
          </div>
        </div>
        ${subs.map(s => `
        <div class="toc-item sub">
          <span>${s}</span>
          <div style="display:flex;align-items:center">
            <span class="dots"></span>
            <span class="page-num">${3 + i * 2}</span>
          </div>
        </div>`).join('')}
      </div>
    `).join('')}
  </div>
  <div class="page-footer">
    <span>TravelPort — Software Requirements Specification</span>
    <span class="page-num">2</span>
  </div>
</div>

<!-- SECTION 1: INTRODUCTION -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Software Requirements Specification</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">1</div>
      <div>
        <div class="section-title">Introduction</div>
        <div class="section-desc">Purpose, scope, definitions and references</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>1.1 Purpose</h3>
      <p>This Software Requirements Specification (SRS) describes the functional and non-functional requirements for <strong>TravelPort</strong>, a Goibibo-inspired full-stack travel booking portal. It is intended for developers, QA engineers, and project stakeholders as the authoritative specification for system behaviour.</p>
    </div>

    <div class="sub-section">
      <h3>1.2 Scope</h3>
      <p>TravelPort provides end-to-end travel booking capabilities including flight search and booking, hotel discovery and reservation, bus/train/cab search (deterministic mock), digital wallet, coupon system, SMTP email notifications, PDF invoice generation, and a role-based admin panel.</p>
      <div class="card-grid-3">
        <div class="stat-card"><div class="num">900+</div><div class="label">Seed Flights</div></div>
        <div class="stat-card"><div class="num">60+</div><div class="label">Hotels</div></div>
        <div class="stat-card"><div class="num">49+</div><div class="label">API Endpoints</div></div>
      </div>
    </div>

    <div class="sub-section">
      <h3>1.3 Definitions &amp; Acronyms</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Term</th><th>Definition</th></tr></thead>
          <tbody>
            ${[
              ['JWT', 'JSON Web Token — stateless bearer token for API authentication (15-minute TTL)'],
              ['SRS', 'Software Requirements Specification — this document'],
              ['EF Core', 'Entity Framework Core — ORM used for .NET database access'],
              ['DTO', 'Data Transfer Object — contract between API layers'],
              ['SMTP', 'Simple Mail Transfer Protocol — used for transactional email via Office365'],
              ['BCrypt', 'Password hashing algorithm (cost factor 12) used for credential storage'],
              ['CI/CD', 'Continuous Integration / Continuous Deployment via GitHub Actions'],
              ['REST', 'Representational State Transfer — architectural style for the HTTP API'],
            ].map(([t, d]) => `<tr><td><code>${t}</code></td><td>${d}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>1.4 References</h3>
      <ul>
        <li><strong>ARCHITECTURE.md</strong> — System architecture and layer design</li>
        <li><strong>API_DOCUMENTATION.md</strong> — Full REST API reference</li>
        <li><strong>DATABASE_DESIGN.md</strong> — Entity-relationship diagram and schema</li>
        <li><strong>SECURITY_GUIDE.md</strong> — Authentication, authorization and security policies</li>
      </ul>
    </div>
  </div>
  <div class="page-footer">
    <span>TravelPort — Software Requirements Specification</span>
    <span class="page-num">3</span>
  </div>
</div>

<!-- SECTION 2: SYSTEM OVERVIEW -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Software Requirements Specification</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">2</div>
      <div>
        <div class="section-title">System Overview</div>
        <div class="section-desc">Product perspective, user classes and operating environment</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.1 Product Perspective</h3>
      <p>TravelPort is a standalone web application. It uses a React 18 SPA frontend communicating with a .NET 8 REST API backed by SQL Server. All data flows through the API gateway; no direct DB access from the client.</p>
      <div class="arch-box">
        <div class="arch-box-label">System Layers</div>
        <div class="arch-layers" style="margin-top:12px">
          <div class="arch-layer layer-1">Client Layer — React 18 + TypeScript + Tailwind + Redux Toolkit (Vite 6)</div>
          <div style="text-align:center;font-size:18px;color:#94a3b8">↕ HTTPS / REST</div>
          <div class="arch-layer layer-2">API Gateway — .NET 8 Web API | JWT Auth | Rate Limiting (Swagger/OpenAPI)</div>
          <div style="text-align:center;font-size:18px;color:#94a3b8">↕</div>
          <div class="arch-layer layer-3">Application Services — FlightService | HotelService | BookingService | WalletService | AdminService</div>
          <div style="text-align:center;font-size:18px;color:#94a3b8">↕</div>
          <div class="arch-layer layer-4">Persistence — EF Core 8 | SQL Server Express | ICacheService (in-memory / Redis)</div>
          <div style="text-align:center;font-size:18px;color:#94a3b8">↕</div>
          <div class="arch-layer layer-5">Infrastructure — SMTP Email | Razorpay | Duffel (optional) | Nginx Reverse Proxy</div>
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.2 User Classes</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Role</th><th>Description</th><th>Access Level</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-blue">Guest</span></td><td>Unauthenticated visitor; can search flights, hotels, buses, trains, cabs and validate coupons</td><td>Read-only search</td></tr>
            <tr><td><span class="badge badge-green">User</span></td><td>Registered traveller; can book, pay, cancel, download invoices and manage wallet</td><td>Full self-service</td></tr>
            <tr><td><span class="badge badge-pink">Admin</span></td><td>System operator; can view analytics, manage users (block/unblock), manage all bookings and CRUD coupons</td><td>Full system access</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.3 Operating Environment</h3>
      <div class="card-grid">
        <div class="info-card">
          <div class="label">Development</div>
          <div class="value">Windows / macOS / Linux</div>
          <div class="sub">Node 20+ · .NET 8 SDK · SQL Server Express</div>
        </div>
        <div class="info-card">
          <div class="label">Production (Docker)</div>
          <div class="value">Any Docker host</div>
          <div class="sub">docker-compose · SQL Server 2022 container · Nginx SPA+proxy</div>
        </div>
        <div class="info-card">
          <div class="label">Browsers</div>
          <div class="value">Chrome 90+ · Firefox 88+ · Safari 14+</div>
          <div class="sub">Mobile Chrome/Safari supported</div>
        </div>
        <div class="info-card">
          <div class="label">CI/CD</div>
          <div class="value">GitHub Actions</div>
          <div class="sub">pre-commit test gate · Docker Hub registry · approval-gated image publish</div>
        </div>
      </div>
    </div>
  </div>
  <div class="page-footer">
    <span>TravelPort — Software Requirements Specification</span>
    <span class="page-num">4</span>
  </div>
</div>

<!-- SECTION 3: FUNCTIONAL REQUIREMENTS -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Software Requirements Specification</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">3</div>
      <div>
        <div class="section-title">Functional Requirements</div>
        <div class="section-desc">Detailed behaviour for each module</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.1 Authentication Module</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Requirement</th><th>Priority</th></tr></thead>
          <tbody>
            ${[
              ['FR-AUTH-01', 'System shall allow new users to register with email, password and full name', 'High'],
              ['FR-AUTH-02', 'System shall issue a JWT access token (15 min TTL) and refresh token (7 day TTL) on login', 'High'],
              ['FR-AUTH-03', 'System shall auto-rotate refresh tokens; old token revoked after use', 'High'],
              ['FR-AUTH-04', 'System shall support forgot-password flow: time-limited reset link via email (1 hour TTL)', 'High'],
              ['FR-AUTH-05', 'Passwords must be hashed with BCrypt cost factor 12 before storage', 'High'],
              ['FR-AUTH-06', 'Admin role must be enforced via JWT claims on all /admin/* routes', 'High'],
            ].map(([id, req, p]) => `<tr><td><code>${id}</code></td><td>${req}</td><td><span class="badge ${p === 'High' ? 'badge-red' : 'badge-orange'}">${p}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.2 Flight Booking Module</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Requirement</th><th>Priority</th></tr></thead>
          <tbody>
            ${[
              ['FR-FLT-01', 'System shall search flights by origin, destination, date, passengers and class; cache 5 min', 'High'],
              ['FR-FLT-02', 'Search results shall be filterable by airline, stops, departure time, and price range', 'High'],
              ['FR-FLT-03', 'System shall display fare families (Economy/Premium Economy/Business) with distinct pricing', 'High'],
              ['FR-FLT-04', 'System shall collect per-traveller name, age, gender and ID type before booking', 'High'],
              ['FR-FLT-05', 'Booking shall atomically deduct wallet (if used) and decrement available seats', 'High'],
              ['FR-FLT-06', 'System shall apply validated coupons and reduce FinalAmount accordingly', 'Medium'],
              ['FR-FLT-07', 'System shall send booking-confirmed email with PDF e-ticket attached', 'High'],
              ['FR-FLT-08', 'System shall allow cancellation with wallet refund for eligible bookings', 'High'],
              ['FR-FLT-09', 'BookingExpiryWorker shall auto-cancel Pending bookings older than 30 minutes', 'Medium'],
            ].map(([id, req, p]) => `<tr><td><code>${id}</code></td><td>${req}</td><td><span class="badge ${p === 'High' ? 'badge-red' : 'badge-orange'}">${p}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.3 Hotel Booking Module</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Requirement</th><th>Priority</th></tr></thead>
          <tbody>
            ${[
              ['FR-HTL-01', 'System shall search hotels by city, check-in/out, guests, star rating and sort order; cache 5 min', 'High'],
              ['FR-HTL-02', 'Hotel results shall support filter by star rating, price range, and amenities', 'High'],
              ['FR-HTL-03', 'Booking shall capture guest name, email and phone number', 'High'],
              ['FR-HTL-04', 'System shall generate hotel invoice PDF with stay dates, room details, GST breakdown', 'High'],
              ['FR-HTL-05', 'Booking references shall use HT2026XXXXXX prefix format', 'Low'],
            ].map(([id, req, p]) => `<tr><td><code>${id}</code></td><td>${req}</td><td><span class="badge ${p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-orange' : 'badge-blue'}">${p}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.4 Transport Module (Bus / Train / Cab)</h3>
      <p>Bus, Train and Cab search returns deterministic mock data — no database persistence. Results are consistent per route (same operator, pricing, schedule) across calls.</p>
      <div class="callout callout-info">
        <div class="callout-icon">ℹ</div>
        <div class="callout-content">
          <div class="callout-title">Mock Data Note</div>
          <div class="callout-text">Bus (14 operators, 10–22 results/route), Train (39 named trains, 5 classes, 6–15 results/route) and Cab (Ola/Uber/Meru/Zoom, distance-based pricing) are implemented as in-memory search providers. Booking endpoints for these modes are a planned future feature.</div>
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.5 Payment &amp; Wallet</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Requirement</th><th>Priority</th></tr></thead>
          <tbody>
            ${[
              ['FR-PAY-01', 'System shall integrate Razorpay checkout; falls back to mock payment in dev mode', 'High'],
              ['FR-PAY-02', 'Each user shall have exactly one wallet, created on registration', 'High'],
              ['FR-PAY-03', 'Wallet top-up maximum is ₹1,00,000 per transaction', 'High'],
              ['FR-PAY-04', 'Wallet deduction and booking creation shall be committed atomically (single UoW)', 'High'],
              ['FR-PAY-05', 'WalletTransaction shall record every credit/debit with description and reference ID', 'High'],
              ['FR-PAY-06', 'System shall support 11 coupons (flight-specific and hotel-specific variants)', 'Medium'],
              ['FR-PAY-07', 'User may save credit/debit cards (last 4 digits only); one card may be set as default', 'High'],
              ['FR-PAY-08', 'At booking time, user selects Wallet, Saved Card, or New Card as payment method', 'High'],
              ['FR-PAY-09', 'Payment page shall support Card (live preview), UPI (QR + timer), Net Banking (bank picker + timer)', 'High'],
              ['FR-PAY-10', 'Cancellation shall atomically credit 90% of final amount to wallet and persist immediately', 'High'],
              ['FR-PAY-11', 'Booking confirmation email shall be sent to the contact email entered at booking, not the account email', 'Medium'],
            ].map(([id, req, p]) => `<tr><td><code>${id}</code></td><td>${req}</td><td><span class="badge ${p === 'High' ? 'badge-red' : 'badge-orange'}">${p}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.6 Admin Panel</h3>
      <ul>
        <li><strong>Dashboard:</strong> Monthly revenue chart, bookings by type, bookings by status</li>
        <li><strong>Users:</strong> Paginated user list with block/unblock action</li>
        <li><strong>Bookings:</strong> All bookings with status filter; manual cancellation</li>
        <li><strong>Coupons:</strong> Full CRUD — create, edit, toggle active, delete coupons</li>
        <li><strong>Analytics:</strong> <code>GET /admin/analytics</code> — real SQL aggregations (not mocked)</li>
      </ul>
    </div>
  </div>
  <div class="page-footer">
    <span>TravelPort — Software Requirements Specification</span>
    <span class="page-num">5</span>
  </div>
</div>

<!-- SECTION 4 & 5: NFRs + USE CASES -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Software Requirements Specification</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">4</div>
      <div>
        <div class="section-title">Non-Functional Requirements</div>
        <div class="section-desc">Performance, security, reliability and usability</div>
      </div>
    </div>

    <div class="card-grid">
      ${[
        ['Performance', 'badge-blue', 'Flight/hotel search responds in < 500 ms (cache hit < 50 ms). API supports 100 concurrent users on a single 2-core server.'],
        ['Security', 'badge-red', 'JWT (15 min) + Refresh Tokens (7 days). BCrypt cost 12. Secrets in env vars only. HTTPS enforced in production. SQL injection prevention via EF Core parameterization.'],
        ['Reliability', 'badge-green', 'Background workers (BookingExpiryWorker, RefreshTokenCleanupWorker) recover gracefully on shutdown. DataSeeder is idempotent — existing data preserved on restart. Commits and CI are gated by automated backend and frontend tests.'],
        ['Usability', 'badge-pink', 'Goibibo-style UI with skeleton loaders, responsive layout (lg breakpoint), accessible form controls and keyboard navigation. Mobile filter drawer planned (Phase 9).'],
      ].map(([title, badge, desc]) => `
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="badge ${badge}">${title}</span>
          </div>
          <p style="margin:0;font-size:12.5px">${desc}</p>
        </div>
      `).join('')}
    </div>

    <div class="section-header" style="margin-top:20px">
      <div class="section-number">5</div>
      <div>
        <div class="section-title">Key Use Cases</div>
        <div class="section-desc">Primary user journeys through the system</div>
      </div>
    </div>

    <h4 style="margin-bottom:12px">UC-01: Book a Flight</h4>
    <div class="flow">
      ${[
        ['1', 'Search', 'User enters origin, destination, date and passenger count on the home page'],
        ['2', 'Browse', 'Results load with airline filters, stop filters, sort tabs (Cheapest/Fastest/Earliest)'],
        ['3', 'Select Fare', 'User clicks VIEW FARES; fare-family popup shows Economy / Premium Economy / Business'],
        ['4', 'Traveller Details', 'User fills per-traveller name, age, gender and ID number'],
        ['5', 'Apply Coupon', 'Optional coupon code reduces FinalAmount; discount displayed in summary'],
        ['6', 'Pay', 'Razorpay checkout (or wallet deduction); booking confirmed atomically'],
        ['7', 'Confirmation', 'Email with PDF e-ticket sent; booking appears in My Bookings with FL prefix'],
      ].map(([n, t, d]) => `
        <div class="flow-step">
          <div class="flow-line"></div>
          <div class="flow-dot">${n}</div>
          <div class="flow-body"><h4>${t}</h4><p>${d}</p></div>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer">
    <span>TravelPort — Software Requirements Specification</span>
    <span class="page-num">6</span>
  </div>
</div>

</body></html>`;
}

// ─── TECHNICAL DESIGN ─────────────────────────────────────────────────────────
function technicalHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TravelPort — Technical Design Document</title>
<style>${baseCSS}</style>
</head>
<body>

<!-- COVER -->
<div class="page">
  <div class="cover" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 40%,${BRAND.primary} 100%)">
    <div class="cover-logo">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="6" width="36" height="36" rx="8" stroke="white" stroke-width="2.5"/>
        <path d="M14 24h20M24 14v20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="5" fill="white" fill-opacity="0.2" stroke="white" stroke-width="2"/>
      </svg>
    </div>
    <div class="cover-badge">Technical Design Document</div>
    <h1>TravelPort</h1>
    <h2>Architecture, Data Design &amp; Integration Guide</h2>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="label">Version</div><div class="value">v1.0.0</div></div>
      <div class="cover-meta-item"><div class="label">Backend</div><div class="value">.NET 8 Clean Architecture</div></div>
      <div class="cover-meta-item"><div class="label">Frontend</div><div class="value">React 18 + TypeScript</div></div>
      <div class="cover-meta-item"><div class="label">Database</div><div class="value">SQL Server + EF Core 8</div></div>
    </div>
    <div class="cover-footer">TravelPort · Technical Design · © 2026</div>
  </div>
</div>

<!-- TOC -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Technical Design Document</div>
  </div>
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-subtitle">Technical Design Document — TravelPort v1.0.0</div>
    ${[
      ['1', 'Clean Architecture Overview', ['1.1 Layer Responsibilities', '1.2 Dependency Rules']],
      ['2', 'Backend Design', ['2.1 Domain Entities', '2.2 Application Services', '2.3 Repositories & UoW', '2.4 Caching Strategy']],
      ['3', 'Frontend Architecture', ['3.1 Feature Module Structure', '3.2 State Management', '3.3 API Integration']],
      ['4', 'Database Design', ['4.1 Core Tables', '4.2 Relationships', '4.3 Indexes & Migrations']],
      ['5', 'Authentication &amp; Security', ['5.1 JWT Flow', '5.2 Refresh Token Rotation']],
      ['6', 'Background Services', []],
      ['7', 'External Integrations', ['7.1 Razorpay', '7.2 SMTP Email', '7.3 Duffel (Optional)']],
    ].map(([num, title, subs], i) => `
      <div class="toc-section">
        <div class="toc-item main">
          <div style="display:flex;align-items:center;gap:10px"><div class="toc-num">${num}</div>${title}</div>
          <div style="display:flex;align-items:center"><span class="dots"></span><span class="page-num">${3 + i * 2}</span></div>
        </div>
        ${subs.map(s => `<div class="toc-item sub"><span>${s}</span><div style="display:flex;align-items:center"><span class="dots"></span><span class="page-num">${3 + i * 2}</span></div></div>`).join('')}
      </div>
    `).join('')}
  </div>
  <div class="page-footer"><span>TravelPort — Technical Design Document</span><span class="page-num">2</span></div>
</div>

<!-- SECTION 1: ARCHITECTURE -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Technical Design Document</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">1</div>
      <div>
        <div class="section-title">Clean Architecture Overview</div>
        <div class="section-desc">Layer responsibilities and dependency rules</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>1.1 Layer Responsibilities</h3>
      <div class="arch-layers" style="gap:4px;margin-bottom:20px">
        <div class="arch-layer layer-1" style="padding:14px 20px;text-align:left">
          <strong>API (Presentation)</strong> — Controllers, Middleware (JWT, exception handling, logging), Action Filters, Program.cs (DI root)
        </div>
        <div style="text-align:center;font-size:13px;color:#94a3b8;padding:2px 0">depends on ↓</div>
        <div class="arch-layer layer-2" style="padding:14px 20px;text-align:left">
          <strong>Application (Business Logic)</strong> — AuthService, FlightService, HotelService, BookingService, WalletService, AdminService; DTOs, FluentValidation validators, ICacheService, IUnitOfWork
        </div>
        <div style="text-align:center;font-size:13px;color:#94a3b8;padding:2px 0">depends on ↓</div>
        <div class="arch-layer layer-3" style="padding:14px 20px;text-align:left">
          <strong>Domain (Core)</strong> — Entities (User, Flight, Hotel, Booking, Wallet, WalletTransaction, Coupon, RefreshToken), Enums (BookingStatus, BookingType, TravelClass), ValueObjects — ZERO external dependencies
        </div>
        <div style="text-align:center;font-size:13px;color:#94a3b8;padding:2px 0">Infrastructure &amp; Persistence implement interfaces defined in ↑</div>
        <div class="arch-layer layer-4" style="padding:14px 20px;text-align:left">
          <strong>Persistence</strong> — TravelPortDbContext, Repositories (Flight, Hotel, Booking, Wallet, Coupon, User, Admin), EF Core Migrations, DataSeeder
        </div>
        <div class="arch-layer layer-5" style="padding:14px 20px;text-align:left">
          <strong>Infrastructure</strong> — JwtService, CacheService, SmtpEmailService, RazorpayService, DuffelProvider; BackgroundServices (BookingExpiryWorker, RefreshTokenCleanupWorker)
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>1.2 Dependency Rule</h3>
      <pre>Domain ← Application ← Infrastructure ← API
              ↑                 ↑
         Persistence        External APIs

<span class="comment"># Arrows point INWARD. Outer layers know about inner layers.
# Inner layers (Domain) know nothing about outer layers.
# This is enforced via project references in .csproj files.</span></pre>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Technical Design Document</span><span class="page-num">3</span></div>
</div>

<!-- SECTION 2: BACKEND DESIGN -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Technical Design Document</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">2</div>
      <div>
        <div class="section-title">Backend Design</div>
        <div class="section-desc">Entities, services, repositories and caching</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.1 Core Domain Entities</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Entity</th><th>Key Fields</th><th>Notes</th></tr></thead>
          <tbody>
            ${[
              ['User', 'Id, Email, PasswordHash, Role, IsBlocked, WalletId', 'Wallet created on registration via cascade'],
              ['Flight', 'Id, FlightNumber, Origin, Destination, Airline, DepartureTime, ArrivalTime, AvailableSeats, BasePrice', '900+ seeded across 42 routes'],
              ['Hotel', 'Id, Name, City, StarRating, PricePerNight, Amenities, RoomTypes', '60+ across 12 cities'],
              ['Booking', 'Id, BookingReference (FL/HT prefix), UserId, FlightId?, HotelId?, FinalAmount, Status, BookingType', 'Status: Pending → Confirmed / Cancelled'],
              ['Wallet', 'Id, UserId, Balance', 'One wallet per user; balance validated before deduction'],
              ['WalletTransaction', 'Id, WalletId, Amount, Type (Credit/Debit), Description, ReferenceId', 'Immutable audit trail'],
              ['Coupon', 'Id, Code, DiscountType (Percentage/Fixed), DiscountValue, MinOrderValue, IsActive, CouponType', 'Flight-specific or Hotel-specific'],
              ['RefreshToken', 'Id, UserId, Token, ExpiresAt, IsRevoked', 'Cleaned up by background worker every 24h'],
            ].map(([e, f, n]) => `<tr><td><strong>${e}</strong></td><td><code style="font-size:10.5px">${f}</code></td><td>${n}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.2 Caching Strategy</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Cache Key Pattern</th><th>TTL</th><th>Invalidated On</th></tr></thead>
          <tbody>
            <tr><td><code>flights:{Origin}:{Destination}:{Date}:{Pax}:{Class}</code></td><td>5 min</td><td>Flight booking (seat count change)</td></tr>
            <tr><td><code>flight:{id}</code></td><td>30 min</td><td>Flight booking</td></tr>
            <tr><td><code>hotels:{City}:{In}:{Out}:{Guests}:{Rating}:{Sort}</code></td><td>5 min</td><td>Hotel booking</td></tr>
            <tr><td><code>hotel:{id}</code></td><td>30 min</td><td>Hotel booking</td></tr>
          </tbody>
        </table>
      </div>
      <p><code>ICacheService</code> wraps <code>IDistributedCache</code> with JSON serialization. Default: <code>AddDistributedMemoryCache()</code>. Production swap: replace with <code>AddStackExchangeRedisCache()</code> in Program.cs — zero service-layer changes.</p>
    </div>

    <div class="sub-section">
      <h3>2.3 Atomic Booking + Wallet</h3>
      <pre><span class="keyword">// FlightService.BookAsync — simplified flow</span>
<span class="number">1.</span> ValidateFlightExists(flightId)
<span class="number">2.</span> CheckSeatsAvailable(flight, passengerCount)
<span class="number">3.</span> couponDiscount = ApplyCoupon(couponCode, baseAmount)  <span class="comment">// optional</span>
<span class="number">4.</span> <span class="keyword">if</span> (useWallet) _wallet.DeductAsync(userId, finalAmount)  <span class="comment">// NO SaveChanges yet</span>
<span class="number">5.</span> booking = <span class="keyword">new</span> Booking { ... Status = Pending }
<span class="number">6.</span> _bookings.AddAsync(booking)
<span class="number">7.</span> flight.AvailableSeats -= passengerCount
<span class="number">8.</span> _unitOfWork.SaveChangesAsync()  <span class="comment">// ← ONE atomic commit: booking + wallet + seats</span>
<span class="number">9.</span> _cache.RemoveAsync(<span class="string">"flights:{key}"</span>)
<span class="number">10.</span> _email.SendBookingConfirmed(booking)</pre>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Technical Design Document</span><span class="page-num">4</span></div>
</div>

<!-- SECTION 3: FRONTEND -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Technical Design Document</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">3</div>
      <div>
        <div class="section-title">Frontend Architecture</div>
        <div class="section-desc">Feature modules, state management and API integration</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.1 Feature Module Structure</h3>
      <pre>frontend/src/
├── api/
│   ├── <span class="string">axios.ts</span>          <span class="comment">← Axios instance + JWT interceptor (auto-refresh)</span>
│   └── <span class="string">endpoints.ts</span>      <span class="comment">← All API URL constants (no hardcoded URLs elsewhere)</span>
├── components/
│   ├── common/           <span class="comment">← Button, Select, Modal, Skeleton, ConfirmDialog</span>
│   └── ui/               <span class="comment">← Design system primitives</span>
├── features/
│   ├── auth/             <span class="comment">← authSlice (Redux), LoginForm, RegisterForm</span>
│   ├── flights/          <span class="comment">← FilterSidebar, FlightCard, FarePopup, TravellerDetails</span>
│   ├── hotels/           <span class="comment">← HotelCard, HotelFilters, RoomSelector</span>
│   ├── bookings/         <span class="comment">← BookingCard, BookingDetailPage, PDFDownload</span>
│   └── admin/            <span class="comment">← AdminPage (4 tabs: Dashboard, Users, Bookings, Coupons)</span>
├── pages/                <span class="comment">← Route-level components (FlightsPage, HotelsPage, etc.)</span>
├── services/             <span class="comment">← flightService, hotelService, bookingService, userService</span>
├── store/                <span class="comment">← Redux store + authSlice</span>
├── types/index.ts        <span class="comment">← All shared TypeScript interfaces</span>
└── routes/               <span class="comment">← AppRouter, PrivateRoute, AdminRoute</span></pre>
    </div>

    <div class="sub-section">
      <h3>3.2 JWT Interceptor Pattern</h3>
      <pre><span class="comment">// api/axios.ts</span>
api.interceptors.response.use(
  (res) => res,
  <span class="keyword">async</span> (error) => {
    <span class="keyword">if</span> (error.response?.status === <span class="number">401</span> && !originalRequest._retry) {
      originalRequest._retry = <span class="keyword">true</span>;
      <span class="keyword">const</span> token = <span class="keyword">await</span> refreshAccessToken();  <span class="comment">// POST /auth/refresh</span>
      api.defaults.headers.common[<span class="string">'Authorization'</span>] = <span class="string">\`Bearer \${token}\`</span>;
      <span class="keyword">return</span> api(originalRequest);
    }
    <span class="keyword">return</span> Promise.reject(error);
  }
);</pre>
    </div>

    <div class="sub-section">
      <h3>3.3 Key Design Choices</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Decision</th><th>Choice</th><th>Reason</th></tr></thead>
          <tbody>
            ${[
              ['State management', 'Redux Toolkit', 'Predictable auth state; DevTools support; minimal boilerplate'],
              ['Validation', 'Zod', 'Runtime type safety matching backend FluentValidation contracts'],
              ['Styling', 'Tailwind CSS v3', 'Utility-first; no CSS-in-JS overhead; purged in production'],
              ['Build tool', 'Vite 6', 'Fast HMR; native ESM; proxy config for /api → backend'],
              ['HTTP', 'Axios', 'Interceptor support for JWT refresh; typed response wrapper'],
              ['Named exports', 'All components', 'Avoids default-export aliasing confusion at import sites'],
            ].map(([d, c, r]) => `<tr><td>${d}</td><td><code>${c}</code></td><td>${r}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Technical Design Document</span><span class="page-num">5</span></div>
</div>

<!-- SECTION 4–7: DB + Auth + Background + Integrations -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Technical Design Document</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">4</div>
      <div>
        <div class="section-title">Database Design</div>
        <div class="section-desc">Core tables, relationships and migration strategy</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>4.1 Entity Relationships</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Relationship</th><th>Cardinality</th><th>FK</th></tr></thead>
          <tbody>
            ${[
              ['User → Wallet', '1 : 1', 'Wallet.UserId (Cascade delete)'],
              ['User → RefreshToken', '1 : many', 'RefreshToken.UserId'],
              ['User → Booking', '1 : many', 'Booking.UserId'],
              ['Wallet → WalletTransaction', '1 : many', 'WalletTransaction.WalletId'],
              ['Flight → Booking', '1 : many (nullable)', 'Booking.FlightId'],
              ['Hotel → Booking', '1 : many (nullable)', 'Booking.HotelId'],
              ['Hotel → RoomType', '1 : many', 'RoomType.HotelId'],
            ].map(([r, c, f]) => `<tr><td>${r}</td><td><span class="badge badge-blue">${c}</span></td><td><code>${f}</code></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="sub-section">
      <h3>4.2 Migration Strategy</h3>
      <p>EF Core Code-First migrations. Auto-applied on API startup via <code>db.Database.Migrate()</code> in <code>Program.cs</code>. DataSeeder runs after migration — idempotent checks prevent re-seeding on restart.</p>
    </div>

    <div class="section-header" style="margin-top:24px">
      <div class="section-number">5</div>
      <div>
        <div class="section-title">Authentication Flow</div>
        <div class="section-desc">JWT + Refresh token rotation</div>
      </div>
    </div>

    <div class="flow">
      ${[
        ['1', 'Login', 'POST /auth/login → validate credentials (BCrypt) → issue JWT (15 min) + RefreshToken (7 days, stored in DB)'],
        ['2', 'API Call', 'Client sends Authorization: Bearer {access_token} header'],
        ['3', '401 Detected', 'Axios interceptor catches 401 → POST /auth/refresh → new access token issued'],
        ['4', 'Token Rotation', 'Old refresh token revoked; new pair issued. IsRevoked flag set in DB.'],
        ['5', 'Cleanup', 'RefreshTokenCleanupWorker deletes revoked/expired tokens every 24 hours'],
      ].map(([n, t, d]) => `
        <div class="flow-step">
          <div class="flow-line"></div>
          <div class="flow-dot">${n}</div>
          <div class="flow-body"><h4>${t}</h4><p>${d}</p></div>
        </div>
      `).join('')}
    </div>

    <div class="section-header" style="margin-top:16px">
      <div class="section-number">7</div>
      <div>
        <div class="section-title">External Integrations</div>
      </div>
    </div>
    <div class="card-grid-3">
      ${[
        ['Razorpay', 'Payment gateway. Enabled via config flag. Mock fallback in dev returns success.'],
        ['SMTP / Office365', 'Transactional email. HTML table layouts for Gmail/Outlook compatibility. TLS 587.'],
        ['Duffel', 'Real flight search API. Disabled by default — rich DB seed data used instead.'],
      ].map(([t, d]) => `
        <div class="info-card"><div class="label">${t}</div><div class="sub" style="color:#334155;font-size:12px;margin-top:4px">${d}</div></div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Technical Design Document</span><span class="page-num">6</span></div>
</div>

</body></html>`;
}

// ─── DEPLOYMENT GUIDE ─────────────────────────────────────────────────────────
function deploymentHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TravelPort — Deployment Guide</title>
<style>${baseCSS}</style>
</head>
<body>

<div class="page">
  <div class="cover" style="background:linear-gradient(135deg,#065f46 0%,#047857 40%,${BRAND.primary} 100%)">
    <div class="cover-logo">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M8 40V20l16-12 16 12v20H30V28h-12v12H8z" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="19" y="28" width="10" height="12" rx="2" stroke="white" stroke-width="2"/>
      </svg>
    </div>
    <div class="cover-badge">Deployment Guide</div>
    <h1>TravelPort</h1>
    <h2>Docker · GitHub Actions CI/CD · Server Provisioning</h2>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="label">Version</div><div class="value">v1.0.0</div></div>
      <div class="cover-meta-item"><div class="label">Platform</div><div class="value">Docker + Linux VPS</div></div>
      <div class="cover-meta-item"><div class="label">CI/CD</div><div class="value">GitHub Actions</div></div>
      <div class="cover-meta-item"><div class="label">Registry</div><div class="value">Docker Hub</div></div>
    </div>
    <div class="cover-footer">TravelPort · Deployment Guide · © 2026</div>
  </div>
</div>

<!-- TOC -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Deployment Guide</div>
  </div>
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-subtitle">Deployment Guide — TravelPort v1.0.0</div>
    ${[
      ['1', 'Prerequisites', ['1.1 Local Dev', '1.2 Production Server']],
      ['2', 'Docker Setup', ['2.1 docker-compose Services', '2.2 Environment Variables', '2.3 Build & Run']],
      ['3', 'CI/CD Pipeline', ['3.1 GitHub Actions Workflow', '3.2 Required Secrets', '3.3 Deploy Job']],
      ['4', 'Manual Deployment', ['4.1 Server Bootstrap', '4.2 Rolling Update']],
      ['5', 'Database Management', ['5.1 Auto Migrations', '5.2 Backup & Restore']],
      ['6', 'Troubleshooting', []],
    ].map(([num, title, subs], i) => `
      <div class="toc-section">
        <div class="toc-item main">
          <div style="display:flex;align-items:center;gap:10px"><div class="toc-num">${num}</div>${title}</div>
          <div style="display:flex;align-items:center"><span class="dots"></span><span class="page-num">${3 + i * 2}</span></div>
        </div>
        ${subs.map(s => `<div class="toc-item sub"><span>${s}</span><div style="display:flex;align-items:center"><span class="dots"></span><span class="page-num">${3 + i * 2}</span></div></div>`).join('')}
      </div>
    `).join('')}
  </div>
  <div class="page-footer"><span>TravelPort — Deployment Guide</span><span class="page-num">2</span></div>
</div>

<!-- SECTION 1: PREREQUISITES -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Deployment Guide</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">1</div>
      <div>
        <div class="section-title">Prerequisites</div>
        <div class="section-desc">Required tools for local development and production</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <h4 style="margin-bottom:12px">Local Development</h4>
        <ul>
          <li><strong>Node.js 20+</strong> — Frontend build</li>
          <li><strong>.NET 8 SDK</strong> — Backend build &amp; EF tools</li>
          <li><strong>SQL Server Express</strong> — <code>localhost\\SQLEXPRESS</code></li>
          <li><strong>Docker Desktop</strong> (optional) — for container testing</li>
          <li><strong>Git</strong> — Source control</li>
        </ul>
      </div>
      <div class="card">
        <h4 style="margin-bottom:12px">Production Server</h4>
        <ul>
          <li><strong>Ubuntu 22.04+</strong> (or any Linux)</li>
          <li><strong>Docker Engine 24+</strong></li>
          <li><strong>Docker Compose v2</strong></li>
          <li><strong>SSH access</strong> — For GHA deployment</li>
          <li><strong>Ports open:</strong> 80 (HTTP), 443 (HTTPS)</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Deployment Guide</span><span class="page-num">3</span></div>
</div>

<!-- SECTION 2: DOCKER -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Deployment Guide</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">2</div>
      <div>
        <div class="section-title">Docker Setup</div>
        <div class="section-desc">Three-container stack: SQL Server + .NET API + Nginx/React</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>2.1 docker-compose Services</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Service</th><th>Image</th><th>Port</th><th>Health Check</th></tr></thead>
          <tbody>
            <tr><td><code>sqlserver</code></td><td>mcr.microsoft.com/mssql/server:2022-latest</td><td>1433 (internal)</td><td>sqlcmd SELECT 1</td></tr>
            <tr><td><code>api</code></td><td>docker.io/{owner}/travelport-api</td><td>8080 (internal)</td><td>GET /health → 200</td></tr>
            <tr><td><code>web</code></td><td>docker.io/{owner}/travelport-web</td><td>80 → host</td><td>HTTP 200 on /</td></tr>
          </tbody>
        </table>
      </div>
      <p>The <code>web</code> (Nginx) container serves the React SPA and reverse-proxies <code>/api/*</code> requests to the <code>api</code> container on port 8080.</p>
    </div>

    <div class="sub-section">
      <h3>2.2 Environment Variables</h3>
      <p>Copy <code>.env.example</code> to <code>.env</code> and fill in the required values:</p>
      <pre><span class="comment"># Required</span>
DB_SA_PASSWORD=<span class="string">YourStr0ngP@ssword!</span>
JWT_SECRET=<span class="string">minimum-32-character-random-secret-key</span>
JWT_ISSUER=<span class="string">TravelPort</span>
JWT_AUDIENCE=<span class="string">TravelPortApp</span>
ASPNETCORE_ENVIRONMENT=<span class="string">Production</span>

<span class="comment"># Email (Office365)</span>
EMAIL_ENABLED=<span class="string">true</span>
EMAIL_HOST=<span class="string">smtp.office365.com</span>
EMAIL_PORT=<span class="number">587</span>
EMAIL_USERNAME=<span class="string">noreply@yourdomain.com</span>
EMAIL_PASSWORD=<span class="string">your-smtp-password</span>

<span class="comment"># Payment (Razorpay — optional)</span>
RAZORPAY_ENABLED=<span class="string">false</span>
RAZORPAY_KEY_ID=<span class="string">rzp_test_xxx</span>
RAZORPAY_KEY_SECRET=<span class="string">your-secret</span></pre>
    </div>

    <div class="sub-section">
      <h3>2.3 Build &amp; Run</h3>
      <pre><span class="comment"># First run — build images and start all services</span>
cp .env.example .env
<span class="comment"># Edit .env with your values</span>
docker compose build
docker compose up -d

<span class="comment"># Later runs — api/web use pull_policy: always, so docker compose up -d</span>
<span class="comment"># fetches the newest :latest images from Docker Hub before restart</span>
docker compose up -d

<span class="comment"># Verify services</span>
docker compose ps
docker compose logs api --tail=50

<span class="comment"># App URLs</span>
<span class="comment"># Frontend:  http://localhost</span>
<span class="comment"># API Swagger: http://localhost/api/swagger</span></pre>

      <div class="callout callout-info">
        <div class="callout-icon">ℹ</div>
        <div class="callout-content">
          <div class="callout-title">First Start Timing</div>
          <div class="callout-text">SQL Server takes ~45 seconds to initialize. The API container waits via a healthcheck dependency. EF Core migrations and data seeding run automatically on API startup — no manual steps required.</div>
        </div>
      </div>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Deployment Guide</span><span class="page-num">4</span></div>
</div>

<!-- SECTION 3: CI/CD -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Deployment Guide</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">3</div>
      <div>
        <div class="section-title">CI/CD Pipeline</div>
        <div class="section-desc">GitHub Actions 3-job workflow</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.1 Workflow Jobs</h3>
      <div class="flow">
        ${[
          ['1', 'build-and-verify', 'Triggered on push to Development or PR. Runs dotnet test + dotnet build for the backend and vitest + npm run build for the frontend. All checks must pass before proceeding.'],
          ['2', 'docker-build-push', 'Runs only on push to Development (not on PRs). Requires manual approval, then builds multi-stage Docker images for API and Web and pushes tagged images to Docker Hub.'],
          ['3', 'verify-images', 'Pulls the newly published API and Web images from Docker Hub to confirm they are available for downstream docker compose deployments.'],
        ].map(([n, t, d]) => `
          <div class="flow-step">
            <div class="flow-line"></div>
            <div class="flow-dot">${n}</div>
            <div class="flow-body"><h4>${t}</h4><p>${d}</p></div>
          </div>
        `).join('')}
      </div>
      <div class="callout callout-info">
        <div class="callout-icon">â„¹</div>
        <div class="callout-content">
          <div class="callout-title">Local Commit Rule</div>
          <div class="callout-text">Developers enable <code>git config core.hooksPath .githooks</code> once per clone so the shared repository test gate runs before every commit.</div>
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.2 Required GitHub Secrets</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Secret Name</th><th>Value</th></tr></thead>
          <tbody>
            ${[
              ['DOCKERHUB_USERNAME', 'Docker Hub namespace used for API and Web images'],
              ['DOCKERHUB_TOKEN', 'Docker Hub access token with push permission'],
              ['DB_SA_PASSWORD', 'SQL Server SA password (strong, 16+ chars)'],
              ['JWT_SECRET', 'Minimum 32-character random string'],
              ['EMAIL_USERNAME', 'SMTP sender email address'],
              ['EMAIL_PASSWORD', 'SMTP password or app password'],
              ['RAZORPAY_KEY_ID', 'Razorpay Key ID (optional)'],
              ['RAZORPAY_KEY_SECRET', 'Razorpay Key Secret (optional)'],
            ].map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="callout callout-warning">
        <div class="callout-icon">⚠</div>
        <div class="callout-content">
          <div class="callout-title">Security Warning</div>
          <div class="callout-text">Never commit secrets to appsettings.json or any tracked file. Secrets flow via GitHub Secrets → server .env file at deploy time. The .env file is in .gitignore.</div>
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>3.3 Rollback</h3>
      <pre><span class="comment"># SSH into server and roll back to previous image tag</span>
docker compose pull travelport-api:previous-tag
docker compose up -d

<span class="comment"># Or use git tag to redeploy a previous release</span>
git checkout v1.0.0
git push origin Development  <span class="comment"># triggers pipeline</span></pre>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Deployment Guide</span><span class="page-num">5</span></div>
</div>

<!-- SECTION 4–6: MANUAL + DB + TROUBLESHOOTING -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">Deployment Guide</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number">4</div>
      <div>
        <div class="section-title">Manual Deployment</div>
        <div class="section-desc">First-time server bootstrap</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>4.1 Server Bootstrap</h3>
      <pre><span class="comment"># 1. Install Docker on Ubuntu</span>
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

<span class="comment"># 2. Clone repository</span>
git clone https://github.com/YourOrg/Goibibo-AI-Assignment.git
cd Goibibo-AI-Assignment

<span class="comment"># 3. Create .env from secrets</span>
cat > .env <<EOF
DB_SA_PASSWORD=...
JWT_SECRET=...
<span class="comment"># ... all other vars</span>
EOF

<span class="comment"># 4. Start or restart pre-built images</span>
<span class="comment"># docker-compose.yml uses pull_policy: always for api/web</span>
docker compose up -d</pre>
    </div>

    <div class="section-header" style="margin-top:20px">
      <div class="section-number">5</div>
      <div>
        <div class="section-title">Database Management</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>5.1 Reset Database (Dev Only)</h3>
      <pre><span class="comment"># Drop + recreate (when DataSeeder changes)</span>
cd backend
dotnet ef database drop --project src/Persistence --startup-project src/API --force
dotnet ef database update --project src/Persistence --startup-project src/API</pre>
    </div>

    <div class="section-header" style="margin-top:20px">
      <div class="section-number">6</div>
      <div>
        <div class="section-title">Troubleshooting</div>
      </div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead><tr><th>Symptom</th><th>Likely Cause</th><th>Fix</th></tr></thead>
        <tbody>
          ${[
            ['API returns 500 on start', 'DB not ready yet', 'Wait 45–60 s for SQL Server healthcheck to pass'],
            ['Login returns 401 immediately', 'JWT_SECRET mismatch between API instances', 'Ensure same JWT_SECRET in .env on all nodes'],
            ['Email not sent', 'SMTP FromEmail ≠ Username', 'Set FromEmail = Username in config (Office365 enforces this)'],
            ['docker compose build fails', 'Node/dotnet version mismatch in Dockerfile', 'Check Dockerfile FROM versions match project requirements'],
            ['Bookings disappear on restart', 'DataSeeder not idempotent', 'Already fixed — seeder skips if data exists'],
            ['Docker Hub push 401/403', 'Invalid DOCKERHUB credentials or token scope', 'Regenerate the Docker Hub access token and update the GitHub Actions secrets'],
          ].map(([s, c, f]) => `<tr><td>${s}</td><td>${c}</td><td>${f}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — Deployment Guide</span><span class="page-num">6</span></div>
</div>

</body></html>`;
}

// ─── API REFERENCE ─────────────────────────────────────────────────────────────
function apiRefHTML() {
  const endpoints = [
    { group: 'Authentication', color: '#7c3aed', endpoints: [
      { method: 'POST', path: '/api/v1/auth/register', auth: false, desc: 'Register new user account', body: '{ email, password, fullName }', response: '{ token, refreshToken, user }' },
      { method: 'POST', path: '/api/v1/auth/login', auth: false, desc: 'Login and obtain JWT tokens', body: '{ email, password }', response: '{ token, refreshToken, user }' },
      { method: 'POST', path: '/api/v1/auth/refresh', auth: false, desc: 'Exchange refresh token for new access token', body: '{ refreshToken }', response: '{ token, refreshToken }' },
      { method: 'POST', path: '/api/v1/auth/forgot-password', auth: false, desc: 'Send password reset email link', body: '{ email }', response: '{ message }' },
      { method: 'POST', path: '/api/v1/auth/reset-password', auth: false, desc: 'Reset password using token from email', body: '{ token, newPassword }', response: '{ message }' },
    ]},
    { group: 'Flights', color: '#0369a1', endpoints: [
      { method: 'GET', path: '/api/v1/flights/search', auth: false, desc: 'Search available flights', body: 'Query: origin, destination, date, passengers, class', response: '{ flights[] }' },
      { method: 'POST', path: '/api/v1/flights/book', auth: true, desc: 'Book a flight', body: '{ flightId, passengers, fareClass, couponCode?, useWallet, travellers[] }', response: '{ booking }' },
    ]},
    { group: 'Hotels', color: '#065f46', endpoints: [
      { method: 'GET', path: '/api/v1/hotels/search', auth: false, desc: 'Search hotels by city and dates', body: 'Query: city, checkIn, checkOut, guests, minStars, sortBy', response: '{ hotels[] }' },
      { method: 'POST', path: '/api/v1/hotels/book', auth: true, desc: 'Book a hotel room', body: '{ hotelId, roomTypeId, checkIn, checkOut, guests, couponCode?, useWallet, guestName, guestEmail, guestPhone }', response: '{ booking }' },
    ]},
    { group: 'Transport (Search Only)', color: '#92400e', endpoints: [
      { method: 'GET', path: '/api/v1/buses/search', auth: false, desc: 'Search bus routes (deterministic mock)', body: 'Query: origin, destination, date, passengers', response: '{ buses[] }' },
      { method: 'GET', path: '/api/v1/trains/search', auth: false, desc: 'Search train routes (deterministic mock)', body: 'Query: origin, destination, date, passengers, class', response: '{ trains[] }' },
      { method: 'GET', path: '/api/v1/cabs/search', auth: false, desc: 'Search cab options (deterministic mock)', body: 'Query: pickup, dropoff, date', response: '{ cabs[] }' },
    ]},
    { group: 'Bookings', color: '#1a56db', endpoints: [
      { method: 'GET', path: '/api/v1/bookings', auth: true, desc: 'Get all bookings for authenticated user (paginated)', body: 'Query: page, pageSize', response: '{ bookings[], total }' },
      { method: 'GET', path: '/api/v1/bookings/{id}', auth: true, desc: 'Get a single booking by ID', body: '—', response: '{ booking }' },
      { method: 'POST', path: '/api/v1/bookings/{id}/cancel', auth: true, desc: 'Cancel a booking and refund wallet', body: '—', response: '{ booking }' },
      { method: 'GET', path: '/api/v1/bookings/{id}/invoice', auth: true, desc: 'Download PDF invoice / e-ticket', body: '—', response: 'application/pdf' },
    ]},
    { group: 'Payments', color: '#b45309', endpoints: [
      { method: 'POST', path: '/api/v1/payments/initiate', auth: true, desc: 'Create Razorpay order for booking', body: '{ bookingId }', response: '{ orderId, amount, currency }' },
      { method: 'POST', path: '/api/v1/payments/verify', auth: true, desc: 'Verify Razorpay payment signature', body: '{ orderId, paymentId, signature }', response: '{ success }' },
    ]},
    { group: 'Users', color: '#5b21b6', endpoints: [
      { method: 'GET', path: '/api/v1/users/profile', auth: true, desc: 'Get authenticated user profile', body: '—', response: '{ user }' },
      { method: 'PUT', path: '/api/v1/users/profile', auth: true, desc: 'Update user profile', body: '{ fullName, phone }', response: '{ user }' },
      { method: 'GET', path: '/api/v1/users/wallet', auth: true, desc: 'Get wallet balance and recent transactions', body: '—', response: '{ balance, recentTransactions[] }' },
      { method: 'POST', path: '/api/v1/users/wallet/topup', auth: true, desc: 'Add funds to wallet (max ₹1,00,000)', body: '{ amount }', response: '{ wallet }' },
      { method: 'GET', path: '/api/v1/users/cards', auth: true, desc: 'List saved payment cards (last 4 digits only)', body: '—', response: '{ cards[] }' },
      { method: 'POST', path: '/api/v1/users/cards', auth: true, desc: 'Save a new card (stores last 4 digits only)', body: '{ cardHolderName, cardNumber, expiryMonth, expiryYear, cardType, nickName?, setAsDefault? }', response: '{ card }' },
      { method: 'DELETE', path: '/api/v1/users/cards/{id}', auth: true, desc: 'Remove a saved card', body: '—', response: '{ success }' },
      { method: 'PUT', path: '/api/v1/users/cards/{id}/default', auth: true, desc: 'Set a card as the default payment card', body: '—', response: '{ card }' },
    ]},
    { group: 'Coupons', color: '#0f766e', endpoints: [
      { method: 'POST', path: '/api/v1/coupons/validate', auth: false, desc: 'Validate a coupon code and get discount', body: '{ code, orderAmount, couponType }', response: '{ discount, finalAmount }' },
    ]},
    { group: 'Admin (Admin Role Required)', color: '#be185d', endpoints: [
      { method: 'GET', path: '/api/v1/admin/dashboard', auth: true, desc: 'Get dashboard stats (revenue, users, bookings)', body: '—', response: '{ stats }' },
      { method: 'GET', path: '/api/v1/admin/analytics', auth: true, desc: 'Get monthly revenue + bookings-by-type charts', body: '—', response: '{ analytics }' },
      { method: 'GET', path: '/api/v1/admin/users', auth: true, desc: 'Paginated user list', body: 'Query: page, search', response: '{ users[], total }' },
      { method: 'POST', path: '/api/v1/admin/users/{id}/block', auth: true, desc: 'Block or unblock a user account', body: '{ block: boolean }', response: '{ user }' },
      { method: 'GET', path: '/api/v1/admin/bookings', auth: true, desc: 'All bookings with status filter', body: 'Query: status, page', response: '{ bookings[], total }' },
      { method: 'GET', path: '/api/v1/admin/coupons', auth: true, desc: 'List all coupons', body: '—', response: '{ coupons[] }' },
      { method: 'POST', path: '/api/v1/admin/coupons', auth: true, desc: 'Create a new coupon', body: '{ code, discountType, discountValue, minOrderValue, couponType }', response: '{ coupon }' },
      { method: 'PUT', path: '/api/v1/admin/coupons/{id}', auth: true, desc: 'Update an existing coupon', body: '{ ...coupon fields }', response: '{ coupon }' },
      { method: 'DELETE', path: '/api/v1/admin/coupons/{id}', auth: true, desc: 'Delete a coupon', body: '—', response: '{ success }' },
    ]},
  ];

  const methodColor = { GET: '#059669', POST: '#1a56db', PUT: '#d97706', DELETE: '#dc2626', PATCH: '#7c3aed' };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TravelPort — API Reference</title>
<style>
${baseCSS}
.endpoint-group { margin-bottom: 32px; }
.group-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  padding: 12px 16px; border-radius: 10px;
  border-left: 4px solid;
}
.group-title { font-size: 16px; font-weight: 700; }
.endpoint-card {
  border: 1px solid ${BRAND.border}; border-radius: 10px;
  margin-bottom: 12px; overflow: hidden;
}
.endpoint-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: ${BRAND.light};
  border-bottom: 1px solid ${BRAND.border};
}
.method-badge {
  padding: 3px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 700; color: #fff; min-width: 52px; text-align: center;
}
.endpoint-path {
  font-family: 'JetBrains Mono', monospace; font-size: 12.5px;
  font-weight: 500; color: ${BRAND.dark}; flex: 1;
}
.endpoint-auth { font-size: 10px; }
.endpoint-body { padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.endpoint-field label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND.gray}; display: block; margin-bottom: 4px; }
.endpoint-field .val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #334155; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; border: 1px solid ${BRAND.border}; }
.endpoint-desc { font-size: 12.5px; color: ${BRAND.gray}; padding: 0 16px 10px; }
</style>
</head>
<body>

<!-- COVER -->
<div class="page">
  <div class="cover" style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,${BRAND.primary} 100%)">
    <div class="cover-logo">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="14" width="36" height="28" rx="6" stroke="white" stroke-width="2.5"/>
        <path d="M14 14V10a2 2 0 012-2h16a2 2 0 012 2v4" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M14 26h20M14 32h14" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      </svg>
    </div>
    <div class="cover-badge">API Reference</div>
    <h1>TravelPort</h1>
    <h2>Complete REST API Documentation — 49+ Endpoints</h2>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item"><div class="label">Base URL (Dev)</div><div class="value">http://localhost:5000</div></div>
      <div class="cover-meta-item"><div class="label">Base URL (Docker)</div><div class="value">http://localhost/api</div></div>
      <div class="cover-meta-item"><div class="label">Auth</div><div class="value">Bearer JWT</div></div>
      <div class="cover-meta-item"><div class="label">Format</div><div class="value">JSON · UTF-8</div></div>
    </div>
    <div class="cover-footer">TravelPort · API Reference · © 2026</div>
  </div>
</div>

<!-- GLOBAL NOTES -->
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">API Reference</div>
  </div>
  <div class="content">
    <div class="section-header">
      <div class="section-number" style="background:linear-gradient(135deg,#312e81,${BRAND.primary})">!</div>
      <div>
        <div class="section-title">Global API Conventions</div>
        <div class="section-desc">Response wrapper, error format and authentication</div>
      </div>
    </div>

    <div class="sub-section">
      <h3>Response Wrapper</h3>
      <p>All endpoints wrap their response in <code>ApiResponse&lt;T&gt;</code>:</p>
      <pre><span class="comment">// Success</span>
{
  <span class="string">"success"</span>: <span class="keyword">true</span>,
  <span class="string">"data"</span>: { <span class="comment">/* typed payload */</span> },
  <span class="string">"message"</span>: <span class="string">"Operation completed"</span>,
  <span class="string">"statusCode"</span>: <span class="number">200</span>
}

<span class="comment">// Error</span>
{
  <span class="string">"success"</span>: <span class="keyword">false</span>,
  <span class="string">"data"</span>: <span class="keyword">null</span>,
  <span class="string">"message"</span>: <span class="string">"Validation failed"</span>,
  <span class="string">"errors"</span>: [<span class="string">"Email is required"</span>, <span class="string">"Password too short"</span>],
  <span class="string">"statusCode"</span>: <span class="number">400</span>
}</pre>
    </div>

    <div class="sub-section">
      <h3>Authentication</h3>
      <p>Protected endpoints require an <code>Authorization: Bearer {token}</code> header. Tokens expire in 15 minutes. Use <code>POST /auth/refresh</code> to obtain a new access token.</p>
      <div class="callout callout-info">
        <div class="callout-icon">ℹ</div>
        <div class="callout-content">
          <div class="callout-title">Swagger UI</div>
          <div class="callout-text">Interactive API explorer: <strong>http://localhost:5000/swagger</strong> (dev) · <strong>http://localhost/api/swagger</strong> (Docker). Click "Authorize" and enter <code>Bearer {your-token}</code> to test protected endpoints.</div>
        </div>
      </div>
    </div>

    <div class="sub-section">
      <h3>HTTP Status Codes</h3>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
          <tbody>
            ${[['200 OK', 'Success'],['201 Created', 'Resource created'],['400 Bad Request', 'Validation failure — see errors[]'],['401 Unauthorized', 'Missing or expired JWT'],['403 Forbidden', 'Authenticated but insufficient role (Admin required)'],['404 Not Found', 'Resource does not exist'],['409 Conflict', 'Duplicate resource (e.g. email already registered)'],['500 Internal Server Error', 'Unhandled server error — check API logs']].map(([c,m]) => `<tr><td><code>${c}</code></td><td>${m}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — API Reference</span><span class="page-num">2</span></div>
</div>

<!-- ENDPOINT PAGES -->
${endpoints.map((group, gi) => `
<div class="page">
  <div class="page-header">
    <div class="brand">✈ TravelPort</div>
    <div class="doc-name">API Reference</div>
  </div>
  <div class="content">
    <div class="endpoint-group">
      <div class="group-header" style="background:${group.color}10;border-color:${group.color}">
        <div class="section-number" style="background:${group.color};width:36px;height:36px;font-size:14px">${gi + 1}</div>
        <div class="group-title" style="color:${group.color}">${group.group}</div>
        <span class="badge" style="background:${group.color}20;color:${group.color}">${group.endpoints.length} endpoint${group.endpoints.length !== 1 ? 's' : ''}</span>
      </div>

      ${group.endpoints.map(ep => `
        <div class="endpoint-card">
          <div class="endpoint-header">
            <span class="method-badge" style="background:${methodColor[ep.method] || '#64748b'}">${ep.method}</span>
            <span class="endpoint-path">${ep.path}</span>
            <span class="endpoint-auth badge ${ep.auth ? 'badge-blue' : 'badge-green'}">${ep.auth ? '🔒 Auth Required' : '🌐 Public'}</span>
          </div>
          <div class="endpoint-desc">${ep.desc}</div>
          <div class="endpoint-body">
            <div class="endpoint-field"><label>Request Body / Query</label><div class="val">${ep.body}</div></div>
            <div class="endpoint-field"><label>Response Data</label><div class="val">${ep.response}</div></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  <div class="page-footer"><span>TravelPort — API Reference</span><span class="page-num">${gi + 3}</span></div>
</div>
`).join('')}

</body></html>`;
}

// ─── Generate all PDFs ────────────────────────────────────────────────────────
async function generatePDF(html, filename, label) {
  console.log(`  Generating ${label}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  const filePath = path.join(OUTPUT_DIR, filename);
  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    displayHeaderFooter: false,
  });
  await browser.close();
  const size = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`  ✔ ${filename} (${size} KB) → docs/pdfs/`);
}

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   TravelPort Documentation PDF Generator  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const docs = [
    [srsHTML(),        'SRS.pdf',               'Software Requirements Specification'],
    [technicalHTML(),  'TECHNICAL_DESIGN.pdf',  'Technical Design Document'],
    [deploymentHTML(), 'DEPLOYMENT_GUIDE.pdf',  'Deployment Guide'],
    [apiRefHTML(),     'API_REFERENCE.pdf',     'API Reference'],
  ];

  for (const [html, file, label] of docs) {
    await generatePDF(html, file, label);
  }

  console.log('\n✅ All 4 PDFs generated successfully in docs/pdfs/\n');
  console.log('  • SRS.pdf                — Software Requirements Specification');
  console.log('  • TECHNICAL_DESIGN.pdf   — Architecture & Data Design');
  console.log('  • DEPLOYMENT_GUIDE.pdf   — Docker & CI/CD Deployment');
  console.log('  • API_REFERENCE.pdf      — Complete REST API Reference (49+ endpoints)');
  console.log('');
})();
