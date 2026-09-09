// ============================================================
// SERVERLESS FUNCTION - SKINCARE PRO STORE
// Cria a preferência de pagamento no Mercado Pago
// O ACCESS TOKEN fica seguro como variável de ambiente no Netlify
// ============================================================
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Items array is required' }) };
    }

    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN não configurado no ambiente do Netlify');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado' }) };
    }

    if (body.statement_descriptor && body.statement_descriptor.length > 16) {
      body.statement_descriptor = body.statement_descriptor.replace(/\s+/g, '').substring(0, 16);
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`  // ← CRASES CORRIGIDAS
      },
      body: JSON.stringify(body)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro API MP:', mpData);
      return {
        statusCode: mpResponse.status,
        headers,
        body: JSON.stringify({ error: mpData.message || 'Erro ao criar preferência' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        preferenceId: mpData.id,
        initPoint: mpData.init_point
      })
    };

  } catch (error) {
    console.error('Erro na function:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
