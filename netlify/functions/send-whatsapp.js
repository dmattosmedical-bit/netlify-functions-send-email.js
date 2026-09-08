// ============================================================
// SEND WHATSAPP - SKINCARE PRO STORE
// Envia mensagem de confirmação por WhatsApp após pagamento aprovado
// ============================================================

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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const pedido = JSON.parse(event.body);
    const { pedidoId, cliente, itens, total } = pedido;

    // Validação do telefone
    if (!cliente || !cliente.telefone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Telefone do cliente não fornecido" }),
      };
    }

    const telefone = cliente.telefone.replace(/\D/g, "");
    const telefoneFinal = telefone.startsWith("55") ? telefone : "55" + telefone;

    const TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = pedido.whatsapp_business_id || process.env.WHATSAPP_PHONE_ID;

    if (!TOKEN || !PHONE_NUMBER_ID) {
      console.error("Variáveis WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configuradas");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "Configuração do WhatsApp ausente" }),
      };
    }

    // CORRIGIDO: Tratar itens ausentes (o webhook não envia os itens) + crases no template literal
    const itensTexto = (itens && Array.isArray(itens) && itens.length > 0)
      ? itens.map((i) => `• ${i.nome || i.title || 'Produto'} (${i.quantidade || i.qty || 1}x)`).join("\n")
      : "Detalhes dos itens disponíveis no painel da loja";

    // CORRIGIDO: crases no template literal inteiro
    const mensagem = `✅ *Pedido confirmado!*\n\n*Skincare Pro Store*\n\nPedido: ${pedidoId}\nOlá ${cliente.nome}!\n\nSeu pedido foi recebido:\n${itensTexto}\n\n*Total: R$ ${total.toLocaleString("pt-BR")},00*\n\n📦 Prazo: 2-3 dias úteis\n📧 Rastreio será enviado em breve\n🧾 Nota fiscal inclusa\n\nDúvidas? (31) 98481-5086`;

    // CORRIGIDO: crases na URL e no Authorization
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telefoneFinal,
          type: "text",
          text: { body: mensagem },
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "WhatsApp enviado", waId: result.messages?.[0]?.id }),
      };
    } else {
      console.error("Erro WhatsApp API:", result);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: result.error?.message || "Erro ao enviar WhatsApp" }),
      };
    }
  } catch (error) {
    console.error("Erro send-whatsapp:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
