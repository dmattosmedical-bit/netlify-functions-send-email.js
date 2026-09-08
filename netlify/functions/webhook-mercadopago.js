exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);

    // Mercado Pago envia notificações com type e data.id
    if (body.type === 'payment' || body.topic === 'payment') {
      const paymentId = body.data?.id || body.resource?.split('/').pop();

      if (!paymentId) {
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      // Buscar detalhes do pagamento na API do MP
      const payResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      });

      const payment = await payResponse.json();

      if (!payResponse.ok) {
        console.error('Erro ao buscar pagamento:', payment);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      const status = payment.status; // approved, rejected, pending, in_process
      const externalRef = payment.external_reference;
      const amount = payment.transaction_amount;
      const payerEmail = payment.payer?.email || '';
      const payerName = payment.payer?.first_name || payment.payer?.name || '';
      const paymentMethod = payment.payment_method_id;

      console.log(`Pagamento ${paymentId} - Status: ${status} - Pedido: ${externalRef} - Valor: ${amount}`);

      // Só processar se aprovado
      if (status === 'approved') {
        // 1. Enviar e-mail de confirmação para o cliente
        try {
          await fetch(`${process.env.URL}/.netlify/functions/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pedidoId: externalRef,
              cliente: { nome: payerName, email: payerEmail, telefone: payment.metadata?.cliente_telefone || '' },
              total: amount,
              status: 'approved',
              pagamento: { metodo: paymentMethod, id: paymentId }
            })
          });
        } catch (e) {
          console.error('Erro ao enviar email:', e.message);
        }

        // 2. Notificar a loja
        try {
          await fetch(`${process.env.URL}/.netlify/functions/notify-store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pedidoId: externalRef,
              cliente: { nome: payerName, email: payerEmail },
              total: amount,
              status: 'approved',
              pagamento: { metodo: paymentMethod, id: paymentId }
            })
          });
        } catch (e) {
          console.error('Erro ao notificar loja:', e.message);
        }

        // 3. Enviar WhatsApp
        try {
          await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pedidoId: externalRef,
              cliente: { nome: payerName, email: payerEmail, telefone: payment.metadata?.cliente_telefone || '' },
              total: amount,
              status: 'approved'
            })
          });
        } catch (e) {
          console.error('Erro ao enviar WhatsApp:', e.message);
        }
      }

      // Log para pagamentos pendentes (Pix, boleto)
      if (status === 'pending') {
        console.log(`Pagamento pendente - Pedido: ${externalRef} - Método: ${paymentMethod}`);
      }
    }

    // Sempre responder 200 para o MP não reenviar a notificação
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error('Erro webhook:', error);
    // Ainda retornar 200 para evitar reenvios desnecessários
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, error: error.message })
    };
  }
};
