// ============================================================
// SERVERLESS FUNCTION - SKINCARE PRO STORE
// Cria a preferência de pagamento no Mercado Pago
// O ACCESS TOKEN fica seguro como variável de ambiente no Netlify
// ============================================================

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
  // Permite CORS (necessário para o frontend chamar esta function)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Responde ao preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Rejeita métodos que não sejam POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Validação básica
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Items array is required' })
      };
    }

    // Chama a API do Mercado Pago para criar a preferência
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
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

    // Retorna o preferenceId e init_point para o frontend
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
