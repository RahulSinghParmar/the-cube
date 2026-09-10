import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const base = 'docs/architecture';
const names = await readdir(base);
const markdown = ['README.md', 'CONTRIBUTING.md', 'docs/AUDIT-AND-ROADMAP.md', ...names.filter(name => name.endsWith('.md')).map(name => `${base}/${name}`)];
let links = 0;
for (const file of markdown) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split('#')[0]);
    await access(resolve(dirname(file), path));
    links++;
  }
}

const api = JSON.parse(await readFile(`${base}/openapi.json`, 'utf8'));
assert.equal(api.openapi, '3.1.1');
const operations = new Set();
const usedSchemas = new Set();
let refs = 0;
function walk(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref) {
    assert.ok(value.$ref.startsWith('#/'), `External reference must be reviewed: ${value.$ref}`);
    const parts = value.$ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let target = api;
    for (const part of parts) target = target?.[part];
    assert.notEqual(target, undefined, `Unresolved reference: ${value.$ref}`);
    if (parts[0] === 'components' && parts[1] === 'schemas') usedSchemas.add(parts[2]);
    refs++;
  }
  if (value.type === 'object' && value.properties && value.required) {
    for (const property of value.required) assert.ok(property in value.properties, `Required property missing: ${property}`);
  }
  Object.values(value).forEach(walk);
}
walk(api);

for (const [path, entry] of Object.entries(api.paths)) {
  for (const method of ['get', 'put', 'post', 'delete', 'patch']) {
    const op = entry[method];
    if (!op) continue;
    assert.ok(op.operationId && !operations.has(op.operationId), `Duplicate/missing operationId: ${path}`);
    operations.add(op.operationId);
    assert.ok(op.responses['200'], `No success response: ${op.operationId}`);
    const security = op.security ?? api.security;
    assert.ok(security?.length && security.every(option => Object.keys(option).length > 0), `Missing security: ${op.operationId}`);
    for (const alternative of security) {
      for (const scheme of Object.keys(alternative)) assert.ok(api.components.securitySchemes[scheme], `Unknown scheme: ${scheme}`);
      if (method !== 'get' && alternative.sessionCookie) assert.ok(alternative.csrfToken, `Cookie mutation lacks CSRF: ${op.operationId}`);
    }
    const parameters = [...(entry.parameters || []), ...(op.parameters || [])];
    for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) {
      assert.ok(parameters.some(parameter => parameter.name === name && parameter.in === 'path' && parameter.required), `Missing path parameter: ${name}`);
    }
  }
}
for (const schema of Object.keys(api.components.schemas)) assert.ok(usedSchemas.has(schema), `Unreferenced schema: ${schema}`);
console.log(`Architecture checks passed: ${markdown.length} Markdown files, ${links} local links, ${operations.size} operations and ${refs} resolved API references.`);
console.log('These checks do not execute the SQL schema or prove runtime authorization/synchronization behavior.');
