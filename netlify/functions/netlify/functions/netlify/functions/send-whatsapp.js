exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const pedido = JSON.parse(event.body);
    const { pedidoId, cliente, itens, total } = pedido;

    const telefone = cliente.telefone.replace(/\D/g, "");
    const telefoneFinal = telefone.startsWith("55") ? telefone : "55" + telefone;

    const TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = pedido.whatsapp_business_id || process.env.WHATSAPP_PHONE_ID;

    if (!TOKEN || !PHONE_NUMBER_ID) {
      console.error("Variáveis WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configuradas");
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: "Configuração do WhatsApp ausente" }),
      };
    }

    const itensTexto = itens
      .map((i) => `• ${i.nome} (${i.quantidade}x)`)
      .join("\n");

    const mensagem = `✅ *Pedido confirmado!*\n\n*Skincare Pro Store*\n\nPedido: ${pedidoId}\nOlá ${cliente.nome}!\n\nSeu pedido foi recebido:\n${itensTexto}\n\n*Total: R$ ${total.toLocaleString("pt-BR")},00*\n\n📦 Prazo: 2-3 dias úteis\n📧 Rastreio será enviado em breve\n🧾 Nota fiscal inclusa\n\nDúvidas? (31) 98481-5086`;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
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
        body: JSON.stringify({ success: true, message: "WhatsApp enviado", waId: result.messages?.[0]?.id }),
      };
    } else {
      console.error("Erro WhatsApp API:", result);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: result.error?.message || "Erro ao enviar WhatsApp" }),
      };
    }
  } catch (error) {
    console.error("Erro send-whatsapp:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
