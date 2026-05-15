// Route Tester: Enumerate routes from app.js and route files, then hit each endpoint on a running server
// Usage (Windows cmd):
//   set BASE_URL=http://localhost:8000 && node tools\route_tester.js
// Or simply: node tools\route_tester.js (defaults to http://localhost:8000)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.cwd();

const APP_JS = path.join(ROOT, 'src', 'app.js');

// Load env file used by the server, so PORT matches
try {
  dotenv.config({ path: path.join(ROOT, 'env') });
} catch {}

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;

function joinUrl(base, p) {
  const u = `${base.replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`;
  return u.replace(/\/+$/, '');
}

function substituteParams(p) {
  return p.replace(/:([A-Za-z0-9_]+)/g, (m, name) => {
    if (/id|_id|Id|ID$/.test(name)) return '000000000000000000000000';
    return 'test';
  });
}

async function readText(file) {
  return fs.readFile(file, 'utf8');
}

function parseRouteImports(appJsText) {
  const importRegex = /import\s+([\w$]+)\s+from\s+['"](\.\/routes\/[^'";]+)['"];?/g;
  const result = new Map();
  let m;
  while ((m = importRegex.exec(appJsText))) {
    const varName = m[1];
    const rel = m[2];
    result.set(varName, path.join(ROOT, 'src', rel.replace(/^\.\//, '')));
  }
  return result; // varName -> absolute route file path
}

function parseAppUses(appJsText) {
  const useRegex = /app\.use\(\s*['"]([^'"\)]+)['"]\s*,\s*([\w$]+)\s*\)/g;
  const uses = [];
  let m;
  while ((m = useRegex.exec(appJsText))) {
    uses.push({ basePath: m[1], varName: m[2] });
  }
  return uses;
}

async function detectUploadBasePaths(appJsText, importMap, uses) {
  const uploadBases = new Set();
  for (const { basePath, varName } of uses) {
    const routeFile = importMap.get(varName);
    if (!routeFile) continue;
    try {
      const text = await readText(routeFile);
      if (/\bupload\s*\./.test(text) || /multer\s*\(/.test(text)) {
        uploadBases.add(basePath);
      }
    } catch {}
  }
  return uploadBases;
}

function parseRouterFile(text) {
  const entries = [];
  // Pattern 1: router.METHOD('/path', ...)
  const direct = /router\.(get|post|put|patch|delete|all)\(\s*(['"])(.*?)\2/gi;
  let m;
  while ((m = direct.exec(text))) {
    const method = m[1].toUpperCase();
    const p = m[3] || '/';
    entries.push({ methods: [method], path: p });
  }
  // Pattern 2: router.route('/path').get(...).post(...)
  const routeChain = /router\.route\(\s*(['"])(.*?)\1\s*\)([\s\S]*?);/gi;
  let c;
  while ((c = routeChain.exec(text))) {
    const p = c[2] || '/';
    const chain = c[3] || '';
    const methods = [];
    const methodRegex = /\.(get|post|put|patch|delete|all)\s*\(/gi;
    let mc;
    while ((mc = methodRegex.exec(chain))) {
      methods.push(mc[1].toUpperCase());
    }
    if (methods.length) entries.push({ methods, path: p });
  }
  if (!entries.length) {
    // Fallback: assume base '/'
    entries.push({ methods: ['GET'], path: '/' });
  }
  return entries;
}

async function gatherRoutes() {
  const appText = await readText(APP_JS);
  const importMap = parseRouteImports(appText);
  const uses = parseAppUses(appText);
  const uploadBases = await detectUploadBasePaths(appText, importMap, uses);

  const routes = [];
  for (const { basePath, varName } of uses) {
    const routeFile = importMap.get(varName);
    if (!routeFile) continue;
    let text;
    try {
      text = await readText(routeFile);
    } catch {
      continue;
    }
    const entries = parseRouterFile(text);
    for (const e of entries) {
      for (const method of e.methods) {
        routes.push({
          method: method === 'ALL' ? 'GET' : method,
          path: substituteParams(joinUrl(basePath, e.path)),
          basePath,
          relPath: e.path,
          routeFile,
          requiresUpload: uploadBases.has(basePath)
        });
      }
    }
  }
  // Remove duplicates
  const seen = new Set();
  const dedup = [];
  for (const r of routes) {
    const key = `${r.method} ${r.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(r);
    }
  }
  return dedup;
}

function httpRequest(method, urlStr, body, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const isHttps = urlObj.protocol === 'https:';
      const lib = isHttps ? https : http;
      const options = {
        method,
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + (urlObj.search || ''),
        headers,
      };
      const req = lib.request(options, (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString('utf8');
          resolve({ status: res.statusCode || 0, ok: (res.statusCode || 0) < 500, text, headers: res.headers });
        });
      });
      req.on('error', (err) => {
        resolve({ status: 0, ok: false, error: String(err) });
      });
      req.setTimeout(timeoutMs, () => {
        try { req.destroy(new Error('timeout')); } catch {}
      });
      if (body) req.write(body);
      req.end();
    } catch (err) {
      resolve({ status: 0, ok: false, error: String(err) });
    }
  });
}

async function fetchRequest(method, url, bodyObj) {
  const headers = { 'Accept': 'application/json' };
  let body;
  if (bodyObj && ['POST', 'PUT', 'PATCH'].includes(method)) {
    body = JSON.stringify(bodyObj);
    headers['Content-Type'] = 'application/json';
  }

  // Prefer global fetch if available
  if (typeof fetch === 'function') {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, { method, headers, body, signal: ctrl.signal });
      clearTimeout(t);
      const text = await res.text();
      return { status: res.status, ok: res.status < 500, text, headers: Object.fromEntries(res.headers.entries()) };
    } catch (err) {
      // fall back to http module
    }
  }
  return httpRequest(method, url, body, headers, 10000);
}

async function fetchMultipart(method, url, fields, fileFieldName = 'documents') {
  // Use global FormData/File/Blob if available (Node 18+)
  if (typeof FormData !== 'undefined') {
    const form = new FormData();
    // Append fields
    if (fields && typeof fields === 'object') {
      for (const [k, v] of Object.entries(fields)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          for (const item of v) {
            if (item === undefined || item === null) continue;
            form.append(k, String(item));
          }
        } else if (typeof v === 'object') {
          // Fall back to JSON for plain objects
          form.append(k, JSON.stringify(v));
        } else {
          form.append(k, String(v));
        }
      }
    }
    // Add some common required fields for award/academic-issue/collaboration if missing
    if (/academic-issue/.test(url)) {
      if (!fields?.mentor) form.append('mentor', '000000000000000000000012');
      // students is likely an array of ObjectIds; append at least one
      if (!fields?.students) form.append('students', '000000000000000000000013');
      if (!fields?.ratio) form.append('ratio', '1:30');
    }
    if (/award/.test(url)) {
      if (!fields?.yearAwarded) form.append('yearAwarded', '2024-01-01');
      if (!fields?.studentName) form.append('studentName', '000000000000000000000010');
      if (!fields?.studentAadhar) form.append('studentAadhar', '123456789012');
      if (!fields?.level) form.append('level', 'National');
      if (!fields?.type) form.append('type', 'Sports');
    }
    if (/collaboration/.test(url)) {
      if (!fields?.department) form.append('department', '000000000000000000000001');
      if (!fields?.activityType) form.append('activityType', 'MoU');
      if (!fields?.institution) form.append('institution', 'XYZ College');
      // Use expected enum values if the schema restricts it
      // Collaboration.model.js enum: ['ExchangeProgram','Joint Research','MoU','Other']
      if (!fields?.natureOfCollaboration) form.append('natureOfCollaboration', 'Joint Research');
    }
    if (/\/mou(\/|$)/.test(url)) {
      if (!fields?.department) form.append('department', '000000000000000000000001');
      if (!fields?.partner_institution) form.append('partner_institution', 'Partner Inst');
      if (!fields?.start_date) form.append('start_date', '2024-01-01');
      if (!fields?.end_date) form.append('end_date', '2025-01-01');
      if (!fields?.objective) form.append('objective', 'Collaboration');
      // activityConducted expects an array of ObjectIds; append multiple times if not already provided
      if (!fields?.activityConducted) {
        form.append('activityConducted', '000000000000000000000011');
        form.append('activityConducted', '000000000000000000000012');
      }
    }
    if (/\/new-course(\/|$)/.test(url)) {
      if (!fields?.course_name) form.append('course_name', 'Course X');
      if (!fields?.programme_name) form.append('programme_name', 'Programme A');
      if (!fields?.programme_code) form.append('programme_code', 'PRG-A');
      if (!fields?.course_code) form.append('course_code', 'CX101');
      if (!fields?.year_of_introduction) form.append('year_of_introduction', '2024');
    }
    if (/\/patent(\/|$)/.test(url)) {
      if (!fields?.patent_number) form.append('patent_number', 'PAT-123');
      if (!fields?.filing_date) form.append('filing_date', '2023-12-31');
      if (!fields?.patent_status) form.append('patent_status', 'Filed');
      if (!fields?.grant_date) form.append('grant_date', '2024-01-02');
      if (!fields?.patent_awarding_agency) form.append('patent_awarding_agency', 'Agency');
      // Optional: at least one inventor id
      if (!fields?.faculty_inventor) form.append('faculty_inventor', '000000000000000000000021');
    }
    if (/\/recognition(\/|$)/.test(url)) {
      if (!fields?.department) form.append('department', 'Dept of Science');
      if (!fields?.scheme) form.append('scheme', 'Govt Scheme X');
      if (!fields?.funding_agency) form.append('funding_agency', 'Govt Agency');
      if (!fields?.year_of_award) form.append('year_of_award', '2024');
      if (!fields?.funds_provided) form.append('funds_provided', '10000');
      if (!fields?.duration_of_award) form.append('duration_of_award', '1 year');
    }
    if (/\/staff-training(\/|$)/.test(url)) {
      if (!fields?.faculty) form.append('faculty', '000000000000000000000022');
      if (!fields?.program) form.append('program', 'Training A');
      if (!fields?.organizer) form.append('organizer', 'Organizer X');
      if (!fields?.start_date) form.append('start_date', '2024-06-01');
      if (!fields?.end_date) form.append('end_date', '2024-06-05');
    }
    if (/\/student-centric-method(\/|$)/.test(url)) {
      if (!fields?.course_name) form.append('course_name', 'Course A');
      if (!fields?.course_code) form.append('course_code', 'CA101');
      if (!fields?.programme_name) form.append('programme_name', 'Programme A');
      if (!fields?.ug_pg) form.append('ug_pg', 'UG');
      if (!fields?.method_details) form.append('method_details', 'Group discussion, peer learning');
    }
    if (/employability-course/.test(url)) {
      if (!fields?.course_name) form.append('course_name', 'Employability Skills');
      if (!fields?.course_code) form.append('course_code', 'EMP101');
      if (!fields?.programme_name) form.append('programme_name', 'BSc');
      if (!fields?.ug_pg) form.append('ug_pg', 'UG');
      if (!fields?.year_of_introduction) form.append('year_of_introduction', '2022');
    }
    if (/exam-qualification/.test(url)) {
      if (!fields?.student_name) form.append('student_name', 'John Doe');
      if (!fields?.year_of_qualifying) form.append('year_of_qualifying', '2024');
      if (!fields?.exam_level) form.append('exam_level', 'National');
      if (!fields?.exam_name) form.append('exam_name', 'GATE');
    }
    if (/extension-activity/.test(url)) {
      if (!fields?.resourcePerson) form.append('resourcePerson', 'Dr. Smith');
      if (!fields?.date) form.append('date', '2024-06-01');
      if (!fields?.location) form.append('location', 'Campus');
      if (!fields?.typeOfActivity) form.append('typeOfActivity', 'NSS');
      if (!fields?.noOfParticipants) form.append('noOfParticipants', '50');
    }
    // Prepare a small dummy file buffer
    const content = 'test file content';
    const blob = new Blob([content], { type: 'text/plain' });
    // Many routes expect multiple docs; attach at least one
    form.append(fileFieldName, blob, 'test.txt');

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { method, body: form, signal: ctrl.signal });
    clearTimeout(t);
    const text = await res.text();
    return { status: res.status, ok: res.status < 500, text, headers: Object.fromEntries(res.headers.entries()), used_multipart: true, file_attached: true };
  }
  // Fallback: if FormData unavailable, send JSON
  return fetchRequest(method, url, fields);
}

function classify(bodyText) {
  try {
    const json = JSON.parse(bodyText);
    if (json && typeof json === 'object') return { json, text: undefined };
  } catch {}
  return { json: undefined, text: bodyText };
}

function baseSegmentFromPath(path) {
  // expects '/api/v1/<segment>/...'
  const parts = path.split('/').filter(Boolean);
  // find 'api' then pick next two: v1 and segment
  const idx = parts.indexOf('api');
  if (idx >= 0 && parts[idx + 2]) return parts[idx + 2];
  // fallback: pick the last segment
  return parts[parts.length - 1] || '';
}

function bodyFor(method, path) {
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return undefined;
  // Minimal generic payload; can be customized via SAMPLE_BODY env
  if (process.env.SAMPLE_BODY) {
    try { return JSON.parse(process.env.SAMPLE_BODY); } catch {}
  }
  const seg = baseSegmentFromPath(path);
  // Route-specific fake bodies to satisfy common validations
  switch (seg) {
    case 'student':
      return { name: 'Test User', enrollment_number: 'TST-001' };
    case 'book-chapter':
      return { title: 'Sample Book', chapterTitles: ['Intro', 'Methods'], year: 2024 };
    case 'achievement':
      return { department: '000000000000000000000001', title: 'Dept Award', programCode: 'PRG101', courseCode: 'CSE100' };
    case 'department':
      return { name: 'Computer Science' };
    case 'programme':
      return { name: 'B.Tech', code: 'BTCS', year: 2024 };
    case 'career-guidance':
      return { year: 2024, program_name: 'Guidance Session', students_benefited: 25 };
    case 'professional-affiliation':
      return { faculty: '000000000000000000000002', organization: 'Org X', role: 'Member' };
    case 'phd-defense':
      return { student_name: 'Alice', thesis_title: 'AI Research', supervisor_name: 'Prof. Bob', date_of_defense: '2024-01-01' };
    case 'patent':
      return { patent_number: 'PAT-123', filing_date: '2023-12-31', patent_status: 'Filed', grant_date: '2024-01-02', patent_awarding_agency: 'Agency' };
    case 'grant':
      return { department: '000000000000000000000003', title: 'Grant X', amount: 10000 };
    case 'financial-support':
      return { faculty: '000000000000000000000004', conference_name: 'ICPC 2024', purpose: 'Travel Grant', support_amount: 5000, date: '2024-05-01' };
    case 'financial-aid':
      return { student: '000000000000000000000005', amount: 2000 };
    case 'higher-education-progress':
      return { student_name: 'John', organization: 'University Y', year: 2023 };
    case 'ict-usage':
      return { teacher: '000000000000000000000006', year: 2024 };
    case 'infrastructure-development':
      return { department: '000000000000000000000007', description: 'Lab Renovation', year: 2024 };
    case 'institutional-practice':
      return { department: '000000000000000000000008', practice_title: 'Best Practice' };
    case 'conference-publication':
      return { title: 'Conf Paper', conference_name: 'CONF 2024', year: 2024 };
    case 'journal-publication':
      return { title: 'Journal Paper', journal_name: 'JOURNAL A', year: 2024 };
    case 'library-book':
      return { title: 'Library Book', authors: ['Author A'], year_of_publication: 2020 };
    case 'mou':
      return { department: '000000000000000000000001', partner_institution: 'Partner Inst', start_date: '2024-01-01', end_date: '2025-01-01', objective: 'Collaboration', activityConducted: ['000000000000000000000011','000000000000000000000012'] };
    case 'mou-activity':
      return { name: 'Activity A', date: '2024-02-01', mouId: '000000000000000000000009' };
    case 'new-course':
      return { course_name: 'Course X', programme_name: 'Programme A', programme_code: 'PRG-A', course_code: 'CX101', year_of_introduction: 2024 };
    case 'recognition':
      return { department: 'Dept of Science', scheme: 'Govt Scheme X', funding_agency: 'Govt Agency', year_of_award: 2024, funds_provided: 10000, duration_of_award: '1 year' };
    case 'staff-training':
      return { faculty: '000000000000000000000022', program: 'Training A', organizer: 'Organizer X', start_date: '2024-06-01', end_date: '2024-06-05' };
    case 'faculty-visit':
      return { faculty: '0000000000000000000000ab', institution: 'ABC University', purpose: 'Collaboration', start_date: '2024-03-01', end_date: '2024-03-05' };
    case 'teacher-development':
      return { faculty: '0000000000000000000000ac', program_name: 'FDP on AI', duration: 3, organizer: 'IIT X', start_date: '2024-04-10', end_date: '2024-04-12' };
    case 'student-achievement':
      return { student_name: 'Jane Doe', particulars: 'Won inter-college competition', date: '2024-02-20' };
    case 'student-centric-method':
      return { course_name: 'Course A', course_code: 'CA101', programme_name: 'Programme A', ug_pg: 'UG', method_details: 'Group discussion, peer learning' };
    case 'equipment':
      return { assignedLab: 'Physics Lab', item: 'Oscilloscope', purchase_date: '2020-01-01', remarks: 'Test' };
    case 'exam-qualification':
      return { student: '00000000000000000000000b', exam_name: 'GATE', year: 2024, result: 'Qualified' };
    case 'e-content':
      return { faculty: '0000000000000000000000aa', title: 'E-Content A', platform: 'YouTube', link: 'https://example.com/video', launchingDate: '2024-01-15' };
    case 'capability-scheme':
      return { department: '00000000000000000000000c', title: 'Scheme A', start_year: 2024, studentsInvolved: 10, agenciesInvolved: ['Agency A'] };
    case 'academic-issue':
      return { title: 'Issue A', description: 'Some issue' };
    default:
      return {};
  }
}

function analyze(json, text) {
  let response_message;
  let requires_files = false;
  let validation_error = false;
  let hint;
  if (json) {
    // Our ApiResponse shape is usually { statusCode, data, message, success }
    if (json.message) response_message = json.message;
    if (json.error || (json.errors && json.errors.length)) validation_error = true;
    if (json.message && /No documents uploaded/i.test(json.message)) {
      requires_files = true;
      hint = 'This route likely requires multipart/form-data (file upload).';
    }
  } else if (text) {
    if (/No documents uploaded/i.test(text)) {
      requires_files = true;
      hint = 'This route likely requires multipart/form-data (file upload).';
    }
    if (/required|must be provided|validation/i.test(text)) {
      validation_error = true;
    }
  }
  return { response_message, requires_files, validation_error, hint };
}

async function main() {
  console.log(`[route-tester] Base URL: ${BASE_URL}`);
  // Preflight connectivity probe (404 is acceptable; status 0 means unreachable)
  try {
    const probe = await fetchRequest('GET', BASE_URL, undefined);
    if (!probe || probe.status === 0) {
      const reason = probe?.error || 'Server not reachable';
      console.error(`[route-tester] Could not reach ${BASE_URL}. Reason: ${reason}`);
      const report = {
        summary: {
          base_url: BASE_URL,
          total: 0,
          ok: 0,
          client_error: 0,
          server_error: 0,
          generated_at: new Date().toISOString(),
          duration_ms: 0,
        },
        note: `Base URL not reachable. Ensure server is running and BASE_URL is correct. Reason: ${reason}`,
        results: []
      };
      const outJson = path.join(ROOT, 'route-test-report.json');
      const outTxt = path.join(ROOT, 'route-test-report.txt');
      await fs.writeFile(outJson, JSON.stringify(report, null, 2), 'utf8');
      await fs.writeFile(outTxt, `Route Test Report\nBase URL: ${BASE_URL}\nERROR: Base URL not reachable. ${reason}\n`, 'utf8');
      process.exit(1);
      return;
    }
  } catch (e) {
    const reason = String(e?.message || e);
    console.error(`[route-tester] Could not reach ${BASE_URL}. Reason: ${reason}`);
    const report = {
      summary: {
        base_url: BASE_URL,
        total: 0,
        ok: 0,
        client_error: 0,
        server_error: 0,
        generated_at: new Date().toISOString(),
        duration_ms: 0,
      },
      note: `Base URL not reachable. Ensure server is running and BASE_URL is correct. Reason: ${reason}`,
      results: []
    };
    const outJson = path.join(ROOT, 'route-test-report.json');
    const outTxt = path.join(ROOT, 'route-test-report.txt');
    await fs.writeFile(outJson, JSON.stringify(report, null, 2), 'utf8');
    await fs.writeFile(outTxt, `Route Test Report\nBase URL: ${BASE_URL}\nERROR: Base URL not reachable. ${reason}\n`, 'utf8');
    process.exit(1);
    return;
  }
  const routes = await gatherRoutes();
  console.log(`[route-tester] Discovered ${routes.length} route-method combinations`);

  const results = [];
  const startAll = Date.now();
  for (const r of routes) {
    const url = joinUrl(BASE_URL, r.path);
    const payload = bodyFor(r.method, r.path);
    const start = Date.now();
    const useMultipart = ['POST','PUT','PATCH'].includes(r.method) && r.requiresUpload === true;
    const res = useMultipart ? await fetchMultipart(r.method, url, payload) : await fetchRequest(r.method, url, payload);
    const dur = Date.now() - start;
    const { json, text } = classify(res.text ?? '');
    const cls = res.status >= 500 || res.status === 0 ? 'server-error' : (res.status >= 400 ? 'client-error' : 'success');
    const analysis = analyze(json, text);
    const item = {
      method: r.method,
      path: r.path,
      url,
      status: res.status,
      ok: cls !== 'server-error',
      classification: cls,
      duration_ms: dur,
      request_payload: payload,
      response_json: json,
      response_text: json ? undefined : (text || undefined),
      analysis,
      error: res.error,
      routeFile: path.relative(ROOT, r.routeFile),
      used_multipart: !!res.used_multipart || useMultipart,
      file_attached: !!res.file_attached || useMultipart,
    };
    results.push(item);
    const label = res.ok ? 'OK' : 'FAIL';
    console.log(`${label.padEnd(4)} ${r.method.padEnd(6)} ${r.path} -> ${res.status} (${dur}ms)`);
  }
  const duration = Date.now() - startAll;

  const summary = {
    base_url: BASE_URL,
    total: results.length,
    ok: results.filter(r => r.classification === 'success').length,
    client_error: results.filter(r => r.classification === 'client-error').length,
    server_error: results.filter(r => r.classification === 'server-error').length,
    generated_at: new Date().toISOString(),
    duration_ms: duration,
  };

  const report = { summary, results };
  const outJson = path.join(ROOT, 'route-test-report.json');
  const outTxt = path.join(ROOT, 'route-test-report.txt');
  await fs.writeFile(outJson, JSON.stringify(report, null, 2), 'utf8');
  const lines = [
    `Route Test Report`,
    `Base URL: ${BASE_URL}`,
    `Discovered: ${results.length} endpoints`,
    `Success: ${summary.ok}  Client-Error: ${summary.client_error}  Server-Error: ${summary.server_error}`,
    '',
  ];
  for (const r of results) {
    const label = r.classification === 'success' ? 'OK  ' : (r.classification === 'client-error' ? '4XX ' : 'FAIL');
    lines.push(`${label} ${r.method.padEnd(6)} ${r.path} -> ${r.status} (${r.duration_ms}ms)`);
  }
  await fs.writeFile(outTxt, lines.join('\n'), 'utf8');

  console.log(`[route-tester] Report written to ${path.relative(ROOT, outJson)} and ${path.relative(ROOT, outTxt)}`);
  if (results.length > 0 && results.every(r => r.status === 0)) {
    console.warn(`[route-tester] All requests failed with status 0. This usually means the server was not reachable. Verify your server is running and BASE_URL is correct.`);
  }
}

main().catch((err) => {
  console.error('[route-tester] Error:', err);
  process.exitCode = 1;
});
