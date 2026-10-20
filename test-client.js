'use strict';

const assert = require('node:assert/strict');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const userCredentials = { 'X-Login': 'user1', 'X-Password': 'password123' };
const adminCredentials = { 'X-Login': 'admin1', 'X-Password': 'password123' };
let passed = 0;
const createdIds = new Set();

async function check(name, method, path, expectedStatus, headers = {}, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const text = await response.text();
  assert.equal(response.status, expectedStatus, `${name}: ${text}`);
  let data = text;
  if (expectedStatus === 204) {
    assert.equal(text, '', '204 must have no response body');
  } else if (path !== '/') {
    assert.match(response.headers.get('content-type'), /application\/json/);
    data = JSON.parse(text);
    if (expectedStatus >= 400) assert.equal(typeof data.message, 'string');
  }
  passed++;
  console.log(`[PASS ${passed}] ${name}: ${method} ${path} -> ${response.status}`);
  console.log('Response:', text || '(empty body)');
  return data;
}

async function runTests() {
  console.log(`--- Running API Tests: ${BASE_URL} ---`);
  const home = await check('Public endpoint', 'GET', '/', 200);
  assert.equal(home, 'Hello World! The server is running.');
  await check('Missing credentials', 'GET', '/documents', 401);
  await check('Wrong password', 'GET', '/documents', 401,
    { ...userCredentials, 'X-Password': 'wrong' });
  await check('Unknown login', 'GET', '/documents', 401,
    { ...userCredentials, 'X-Login': 'unknown' });
  await check('Missing password', 'GET', '/documents', 401, { 'X-Login': 'user1' });
  const initial = await check('Documents as user', 'GET', '/documents', 200, userCredentials);
  assert.ok(Array.isArray(initial));
  for (const document of initial) {
    assert.ok(Number.isSafeInteger(document.id));
    assert.equal(typeof document.title, 'string');
    assert.equal(typeof document.content, 'string');
  }
  const asAdmin = await check('Documents as admin', 'GET', '/documents', 200, adminCredentials);
  assert.deepEqual(asAdmin, initial);
  await check('Employees without credentials', 'GET', '/employees', 401);
  await check('Employees forbidden for user', 'GET', '/employees', 403, userCredentials);
  await check('Role header cannot elevate user', 'GET', '/employees', 403,
    { ...userCredentials, 'X-Role': 'admin' });
  const employees = await check('Employees as admin', 'GET', '/employees', 200, adminCredentials);
  assert.deepEqual(employees, [
    { id: 101, name: 'John Doe', position: 'Lead Developer' },
    { id: 102, name: 'Jane Smith', position: 'Project Manager' },
  ]);
  await check('Create without credentials', 'POST', '/documents', 401, {},
    { title: 'Denied', content: 'Must not be saved' });
  for (const [name, body] of [
    ['Missing title', { content: '...' }],
    ['Missing content', { title: 'Test Doc' }],
    ['Empty strings', { title: '', content: '' }],
    ['Whitespace strings', { title: '  ', content: '\n' }],
    ['Wrong types', { title: 123, content: {} }],
    ['Array body', []],
  ]) await check(name, 'POST', '/documents', 400, userCredentials, body);
  await check('Missing body', 'POST', '/documents', 400, userCredentials);
  const malformed = await fetch(`${BASE_URL}/documents`, {
    method: 'POST', headers: { ...userCredentials, 'Content-Type': 'application/json' },
    body: '{"title":', signal: AbortSignal.timeout(5000),
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { message: 'Bad Request. Invalid JSON.' });
  console.log(`[PASS ${++passed}] Invalid JSON -> 400`);
  const unchanged = await check('Rejected writes do not change data', 'GET', '/documents', 200, userCredentials);
  assert.deepEqual(unchanged, initial);
  const payload = { title: 'Test Doc', content: 'Created by test-client.js' };
  const created = await check('Create as user', 'POST', '/documents', 201, userCredentials,
    { ...payload, id: 1, role: 'admin' });
  createdIds.add(created.id);
  assert.ok(Number.isSafeInteger(created.id));
  assert.ok(!initial.some(document => document.id === created.id));
  assert.deepEqual(created, { id: created.id, ...payload });
  const second = await check('Create as admin', 'POST', '/documents', 201, adminCredentials, payload);
  createdIds.add(second.id);
  assert.notEqual(second.id, created.id);
  const updated = await check('Created documents persist in memory', 'GET', '/documents', 200, userCredentials);
  assert.equal(updated.length, initial.length + 2);
  assert.deepEqual(updated.find(document => document.id === created.id), created);
  await check('Delete without credentials', 'DELETE', `/documents/${created.id}`, 401);
  for (const id of [`${created.id}abc`, `${created.id}.5`, '9007199254740992', '0']) {
    await check('Invalid or absent document ID', 'DELETE', `/documents/${id}`, 404, adminCredentials);
  }
  await check('Delete as admin', 'DELETE', `/documents/${created.id}`, 204, adminCredentials);
  createdIds.delete(created.id);
  await check('Repeated delete', 'DELETE', `/documents/${created.id}`, 404, adminCredentials);
  await check('Delete as user', 'DELETE', `/documents/${second.id}`, 204, userCredentials);
  createdIds.delete(second.id);
  await check('Unknown route as admin', 'GET', '/non-existent', 404, adminCredentials);
  await check('Unknown route without credentials', 'GET', '/non-existent', 404);
  const final = await check('Test data removed, original data preserved', 'GET', '/documents', 200, userCredentials);
  assert.deepEqual(final, initial);
  console.log(`--- ${passed} checks passed; all required statuses verified ---`);
}

runTests().catch(error => {
  console.error('TEST FAILED:', error.message);
  console.error('Start the server with npm start in another terminal first.');
  process.exitCode = 1;
}).finally(async () => {
  // При збої прибираємо лише документи, створені цим запуском тестів.
  for (const id of createdIds) {
    try {
      await fetch(`${BASE_URL}/documents/${id}`, {
        method: 'DELETE', headers: adminCredentials, signal: AbortSignal.timeout(5000),
      });
    } catch { /* Основна помилка вже надрукована вище. */ }
  }
});
