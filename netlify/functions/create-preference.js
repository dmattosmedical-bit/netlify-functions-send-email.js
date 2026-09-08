exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);

    // Montar a preferência para o Mercado Pago
    const preference = {
      items: body.itens.map(item => ({
        id: body.pedidoId,
        title: item.nome,
        unit_price: Number(item.preco),
        quantity: Number(item.quantidade),
        currency_id: 'BRL',
        description: 'Produto estético original - Skincare Pro Store'
      })),
      payer: {
        name: body.cliente.nome,
        email: body.cliente.email,
        phone: {
          number: body.cliente.telefone
        }
      },
      back_urls: {
        success: `${process.env.URL}/pedido-sucesso.html`,
        failure: `${process.env.URL}/pedido-erro.html`,
        pending: `${process.env.URL}/pedido-pendente.html`
      },
      auto_return: 'approved',
      statement_descriptor: 'SKINCARE PRO STORE',
      external_reference: body.pedidoId,
      notification_url: `${process.env.URL}/.netlify/functions/webhook-mercadopago`,
      metadata: {
        pedido_id: body.pedidoId,
        store_email: body.store_email,
        whatsapp_business_id: body.whatsapp_business_id,
        cliente_telefone: body.cliente.telefone
      }
    };

    // Chamada direta à API do Mercado Pago (sem dependências externas)
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preference)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Erro MP:', mpData);
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
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point
      })
    };
  } catch (error) {
    console.error('Erro create-preference:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
