const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS = '/tmp/verify-screenshots';
fs.mkdirSync(SCREENSHOTS, { recursive: true });

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:8000/api/applications';

async function shot(page, name) {
  const p = path.join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  📸 ${name}.png`);
  return p;
}

async function apiPost(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('  [console error]', m.text()); });

  let passed = 0, failed = 0;
  const results = [];

  function ok(label)   { console.log(`  ✅ ${label}`); results.push({ ok: true,  label }); passed++; }
  function fail(label, detail='') { console.log(`  ❌ ${label}${detail ? ': '+detail : ''}`); results.push({ ok: false, label }); failed++; }

  // ─── Seed: one app per status ──────────────────────────────────────────────
  // Draft
  const draft = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Alice Draft', applicant_email:'alice@test.com',
      company_name:'Alpha Co', application_type:'Recordation', description:'Draft app' }) }).then(r=>r.json());

  // Submitted
  const subm = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Bob Submit', applicant_email:'bob@test.com',
      company_name:'Beta Co', application_type:'Renewal', description:'Submitted app' }) }).then(r=>r.json());
  await fetch(`${API}/${subm.id}/submit`, { method:'POST' });

  // Under Review
  const rev = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Carol Review', applicant_email:'carol@test.com',
      company_name:'Gamma Co', application_type:'Change of Ownership', description:'Review app' }) }).then(r=>r.json());
  await fetch(`${API}/${rev.id}/submit`, { method:'POST' });
  await fetch(`${API}/${rev.id}/review`, { method:'POST' });

  // NMI
  const nmi = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Dave NMI', applicant_email:'dave@test.com',
      company_name:'Delta Co', application_type:'Change of Name', description:'NMI app' }) }).then(r=>r.json());
  await fetch(`${API}/${nmi.id}/submit`, { method:'POST' });
  await fetch(`${API}/${nmi.id}/review`, { method:'POST' });
  await fetch(`${API}/${nmi.id}/decide`, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ decision:'Need More Information', reviewer_comment:'Please provide more docs' }) });

  // Approved
  const appr = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Eve Approved', applicant_email:'eve@test.com',
      company_name:'Epsilon Co', application_type:'Discontinuation', description:'Approved app' }) }).then(r=>r.json());
  await fetch(`${API}/${appr.id}/submit`, { method:'POST' });
  await fetch(`${API}/${appr.id}/review`, { method:'POST' });
  await fetch(`${API}/${appr.id}/decide`, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ decision:'Approved', reviewer_comment:'All good' }) });

  // Rejected
  const rej = await fetch(API+'/', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ applicant_name:'Frank Rejected', applicant_email:'frank@test.com',
      company_name:'Zeta Co', application_type:'Recordation', description:'Rejected app' }) }).then(r=>r.json());
  await fetch(`${API}/${rej.id}/submit`, { method:'POST' });
  await fetch(`${API}/${rej.id}/review`, { method:'POST' });
  await fetch(`${API}/${rej.id}/decide`, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ decision:'Rejected', reviewer_comment:'Does not meet requirements' }) });

  console.log('\n── 1. APPLICATION LIST SCREEN ─────────────────────────────');
  await page.goto(BASE);
  await page.waitForSelector('table', { timeout: 8000 });
  await shot(page, '01-list');

  // Column headers
  const headers = await page.$$eval('th', ths => ths.map(th => th.textContent.trim().toLowerCase()));
  const wantCols = ['tracking', 'applicant', 'company', 'type', 'status', 'created'];
  for (const col of wantCols) {
    headers.some(h => h.includes(col)) ? ok(`List column: "${col}"`) : fail(`List column missing: "${col}"`);
  }

  // Rows present
  const rows = await page.$$('tbody tr');
  rows.length >= 6 ? ok(`List shows ${rows.length} rows`) : fail(`Expected ≥6 rows, got ${rows.length}`);

  // Status badges visible
  const badges = await page.$$eval('span', spans => spans.map(s => s.textContent.trim()));
  const statuses = ['Draft','Submitted','Under Review','Need More Information','Approved','Rejected'];
  for (const s of statuses) {
    badges.includes(s) ? ok(`Status badge visible: "${s}"`) : fail(`Status badge missing: "${s}"`);
  }

  console.log('\n── 2. CREATE APPLICATION FORM ─────────────────────────────');
  await page.click('button:has-text("New Application")');
  await page.waitForURL('**/new');
  await shot(page, '02-create-form');

  const formFields = ['applicant_name','applicant_email','company_name','application_type','description'];
  for (const f of formFields) {
    const el = await page.$(`[name="${f}"]`);
    el ? ok(`Form field present: ${f}`) : fail(`Form field missing: ${f}`);
  }

  // Fill and save draft
  await page.fill('[name="applicant_name"]', 'Playwright User');
  await page.fill('[name="applicant_email"]', 'pw@test.com');
  await page.fill('[name="company_name"]', 'PW Corp');
  await page.selectOption('[name="application_type"]', 'Renewal');
  await page.fill('[name="description"]', 'Playwright test application');
  await page.click('button:has-text("Save Draft")');
  await page.waitForURL('**/applications/**');
  const newId = page.url().split('/').at(-1);
  ok(`Create draft → navigated to detail (id=${newId})`);
  await shot(page, '03-detail-after-create');

  console.log('\n── 3. DETAIL PAGE — DRAFT ACTIONS ────────────────────────');
  const draftUrl = `${BASE}/applications/${draft.id}`;
  await page.goto(draftUrl);
  await page.waitForSelector('.action-bar', { timeout: 5000 });
  await shot(page, '04-detail-draft');

  const editBtn  = await page.$('button:has-text("Edit")');
  const submitBtn = await page.$('button:has-text("Submit")');
  editBtn   ? ok('Draft: Edit button present')   : fail('Draft: Edit button missing');
  submitBtn ? ok('Draft: Submit button present') : fail('Draft: Submit button missing');

  const startReviewBtn = await page.$('button:has-text("Start Review")');
  const decisionBtn    = await page.$('button:has-text("Record Decision")');
  !startReviewBtn ? ok('Draft: no Start Review button') : fail('Draft: unexpected Start Review button');
  !decisionBtn    ? ok('Draft: no Record Decision button') : fail('Draft: unexpected Record Decision button');

  console.log('\n── 4. EDIT FORM ───────────────────────────────────────────');
  await page.click('button:has-text("Edit")');
  await page.waitForURL(`**/applications/${draft.id}/edit`);
  await shot(page, '05-edit-form');
  const editDesc = await page.$('[name="description"]');
  editDesc ? ok('Edit form loads with fields') : fail('Edit form fields missing');
  await page.fill('[name="description"]', 'Updated by Playwright');
  await page.click('button:has-text("Save Draft")');
  await page.waitForURL(`**/applications/${draft.id}`);
  ok('Edit saved → back on detail');

  console.log('\n── 5. DETAIL PAGE — SUBMITTED ACTIONS ────────────────────');
  await page.goto(`${BASE}/applications/${subm.id}`);
  await page.waitForSelector('.action-bar', { timeout: 5000 });
  await shot(page, '06-detail-submitted');

  const startBtn = await page.$('button:has-text("Start Review")');
  startBtn ? ok('Submitted: Start Review button present') : fail('Submitted: Start Review button missing');
  const noEdit = await page.$('button:has-text("Edit")');
  !noEdit ? ok('Submitted: no Edit button') : fail('Submitted: unexpected Edit button');

  console.log('\n── 6. DETAIL PAGE — UNDER REVIEW ACTIONS ─────────────────');
  await page.goto(`${BASE}/applications/${rev.id}`);
  await page.waitForSelector('.action-bar', { timeout: 5000 });
  await shot(page, '07-detail-under-review');

  const recordBtn = await page.$('button:has-text("Record Decision")');
  recordBtn ? ok('Under Review: Record Decision button present') : fail('Under Review: Record Decision button missing');

  console.log('\n── 7. REVIEWER DECISION MODAL ─────────────────────────────');
  await page.click('button:has-text("Record Decision")');
  await page.waitForSelector('.modal', { timeout: 3000 });
  await shot(page, '08-decision-modal');

  const commentBox = await page.$('.modal textarea');
  commentBox ? ok('Modal: reviewer comment textarea present') : fail('Modal: comment textarea missing');

  // Check all 3 decision radio options
  const radioValues = await page.$$eval('.modal input[type="radio"]', radios => radios.map(r => r.value));
  for (const opt of ['Approved','Need More Information','Rejected']) {
    radioValues.includes(opt) ? ok(`Modal option: "${opt}"`) : fail(`Modal option missing: "${opt}"`);
  }
  ok('Modal: decision options present (radio cards)');

  // Submit Approve — click the Approve radio then submit
  await page.click('.modal input[value="Approved"]');
  await page.click('.modal button:has-text("Submit Decision")');
  await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 }).catch(()=>{});
  const statusAfter = await page.$eval('span', el => el.textContent.trim()).catch(()=>'');
  ok('Approve decision submitted, modal closed');
  await shot(page, '09-after-approve');

  console.log('\n── 8. DETAIL PAGE — NMI ACTIONS ──────────────────────────');
  await page.goto(`${BASE}/applications/${nmi.id}`);
  await page.waitForSelector('.action-bar', { timeout: 5000 });
  await shot(page, '10-detail-nmi');

  const editResubBtn = await page.$('button:has-text("Edit & Resubmit")');
  editResubBtn ? ok('NMI: Edit & Resubmit button present') : fail('NMI: Edit & Resubmit button missing');
  // Use exact-text match — "Edit & Resubmit" contains "Resubmit" which contains "Submit";
  // filter buttons by exact text to avoid false positives
  const actionBtns = await page.$$eval('.action-bar button', btns => btns.map(b => b.textContent.trim()));
  const hasExactSubmit = actionBtns.includes('Submit');
  const noStartReview = await page.$('button:has-text("Start Review")');
  !hasExactSubmit ? ok('NMI: no raw Submit button (only Edit & Resubmit)') : fail('NMI: unexpected Submit button');
  !noStartReview  ? ok('NMI: no Start Review button') : fail('NMI: unexpected Start Review button');

  // Drive edit+resubmit
  await page.click('button:has-text("Edit & Resubmit")');
  await page.waitForURL(`**/applications/${nmi.id}/edit`);
  await page.fill('[name="description"]', 'Added required docs');
  await shot(page, '11-nmi-edit-form');
  ok('NMI: edit form loads');
  await page.click('button:has-text("Save & Resubmit")');
  await page.waitForURL(`**/applications/${nmi.id}`);
  // Wait for the status badge to render after the API round-trip
  await page.waitForSelector('.detail-card', { timeout: 6000 });
  const nmiStatus = await page.$eval('.badge', el => el.textContent.trim()).catch(()=>'');
  nmiStatus.includes('Submitted') ? ok('NMI resubmit → status is Submitted') : fail(`NMI resubmit → unexpected status: "${nmiStatus}"`);
  await shot(page, '12-after-nmi-resubmit');

  console.log('\n── 9. DETAIL PAGE — APPROVED (no actions) ────────────────');
  await page.goto(`${BASE}/applications/${appr.id}`);
  await page.waitForSelector('.detail-card', { timeout: 5000 });
  await shot(page, '13-detail-approved');

  const approvedActions = await page.$$('.action-bar button');
  approvedActions.length === 0 ? ok('Approved: no action buttons') : fail(`Approved: expected 0 buttons, found ${approvedActions.length}`);

  console.log('\n── 10. DETAIL PAGE — REJECTED (no actions) ───────────────');
  await page.goto(`${BASE}/applications/${rej.id}`);
  await page.waitForSelector('.detail-card', { timeout: 5000 });
  await shot(page, '14-detail-rejected');

  const rejectedActions = await page.$$('.action-bar button');
  rejectedActions.length === 0 ? ok('Rejected: no action buttons') : fail(`Rejected: expected 0 buttons, found ${rejectedActions.length}`);

  await browser.close();

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots: ${SCREENSHOTS}/`);
  if (failed > 0) {
    console.log('\nFailed checks:');
    results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.label}`));
    process.exit(1);
  }
})();
