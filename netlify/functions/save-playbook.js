const { getStore } = require('@netlify/blobs');
const { randomUUID } = require('crypto');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'method_not_allowed' }) };

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const { intake, playbook } = body;
  if (!intake || !playbook) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_fields' }) };
  }

  const store = getStore('playbooks');
  const id = randomUUID();
  await store.set(id, JSON.stringify({ intake, playbook }), { metadata: { createdAt: Date.now() } });

  return { statusCode: 200, headers, body: JSON.stringify({ id }) };
};
