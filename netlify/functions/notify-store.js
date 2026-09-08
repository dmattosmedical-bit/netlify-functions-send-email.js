// ============================================================
// NOTIFY STORE - SKINCARE PRO STORE
// Envia notificação para a loja quando um novo pedido é aprovado
// ============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
    const { pedidoId, cliente, itens, total, data } = pedido;

    // CORRIGIDO: Tratar itens ausentes (o webhook não envia os itens)
    const itensTexto = (itens && Array.isArray(itens) && itens.length > 0)
      ? itens.map((i) =>
          `• ${i.nome || i.title || 'Produto'} — ${i.quantidade || i.qty || 1}x — R$ ${((i.preco || i.unit_price || 0) * (i.quantidade || i.qty || 1)).toLocaleString("pt-BR")},00`
        ).join("\n")
      : "Detalhes dos itens não disponíveis (verifique no painel do Mercado Pago)";

    const dataFormatada = data
      ? new Date(data).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fafafa;">
        <div style="background:#e11d48;padding:24px;text-align:center;">
          <h1 style="color:white;font-size:22px;margin:0;">🔔 Novo Pedido Recebido</h1>
        </div>
        <div style="padding:24px;">
          <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="font-size:18px;color:#e11d48;margin:0 0 16px;">Pedido ${pedidoId}</h2>
            <p style="font-size:14px;color:#6b7280;margin:4px 0;"><strong>Data:</strong> ${dataFormatada}</p>
            <p style="font-size:14px;color:#6b7280;margin:4px 0;"><strong>Cliente:</strong> ${cliente.nome}</p>
            <p style="font-size:14px;color:#6b7280;margin:4px 0;"><strong>E-mail:</strong> ${cliente.email}</p>
            <p style="font-size:14px;color:#6b7280;margin:4px 0;"><strong>WhatsApp:</strong> ${cliente.telefone || 'Não informado'}</p>
          </div>
          <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h3 style="font-size:16px;margin:0 0 12px;">Itens do Pedido:</h3>
            <pre style="font-size:14px;color:#0f0f14;white-space:pre-wrap;margin:0;">${itensTexto}</pre>
            <p style="font-size:20px;font-weight:800;color:#e11d48;margin-top:16px;">Total: R$ ${total.toLocaleString("pt-BR")},00</p>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#92400e;">⚡ <strong>Próximos passos:</strong> Confirme o pagamento, prepare o pedido e use a função send-tracking para enviar o código de rastreio.</p>
          </div>
        </div>
      </div>
    `;

    // CORRIGIDO: crases no from e subject
    await transporter.sendMail({
      from: `"Skincare Pro Store (Pedidos)" <${process.env.GMAIL_USER}>`,
      to: pedido.store_email || "dmattosmedical@gmail.com",
      subject: `🔔 Novo Pedido ${pedidoId} — ${cliente.nome}`,
      html,
      replyTo: cliente.email,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Loja notificada" }),
    };
  } catch (error) {
    console.error("Erro notify-store:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
