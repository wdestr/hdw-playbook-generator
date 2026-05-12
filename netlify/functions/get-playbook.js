const { getStore } = require('@netlify/blobs');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const id = event.queryStringParameters?.id;
  if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_id' }) };

  const store = getStore('playbooks');
  const raw = await store.get(id);
  if (!raw) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not_found' }) };

  return { statusCode: 200, headers, body: raw };
};
