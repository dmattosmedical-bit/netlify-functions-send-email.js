const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const {
      pedidoId,
      cliente,
      trackingCode,
      transportadora = "Correios",
      linkRastreio = `https://www.linkcorreios.com.br/?id=${trackingCode || ""}`,
    } = JSON.parse(event.body);

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fafafa;">
        <div style="background:#10b981;padding:32px 24px;text-align:center;">
          <h1 style="color:white;font-size:24px;margin:0;">📦 Pedido Despachado!</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px;">Seu código de rastreio está pronto</p>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:18px;color:#0f0f14;">Olá <strong>${cliente.nome}</strong>,</p>
          <p style="font-size:15px;color:#6b7280;">Seu pedido <strong>${pedidoId}</strong> foi despachado! Acompanhe sua entrega:</p>
          <div style="background:white;border-radius:12px;padding:24px;margin:24px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;">
            <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">Código de rastreio (${transportadora}):</p>
            <p style="font-size:28px;font-weight:800;color:#10b981;margin:0 0 16px;letter-spacing:2px;">${trackingCode}</p>
            <a href="${linkRastreio}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:16px;">Rastrear meu pedido</a>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#15803d;">⏱️ <strong>Prazo estimado:</strong> 2 a 3 dias úteis</p>
            <p style="margin:8px 0 0;font-size:14px;color:#15803d;">🧾 <strong>Nota fiscal:</strong> Vai junto com o produto</p>
          </div>
          <p style="font-size:14px;color:#6b7280;margin-top:24px;">Dúvidas? WhatsApp: (31) 98481-5086</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Skincare Pro Store" <${process.env.GMAIL_USER}>`,
      to: cliente.email,
      subject: `📦 Seu pedido foi despachado! Rastreio: ${trackingCode}`,
      html,
    });

    const TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

    if (TOKEN && PHONE_NUMBER_ID) {
      const telefone = cliente.telefone.replace(/\D/g, "");
      const telefoneFinal = telefone.startsWith("55") ? telefone : "55" + telefone;

      const mensagemWpp = `📦 *Pedido despachado!*\n\n${cliente.nome}, seu pedido ${pedidoId} foi enviado!\n\n*Código de rastreio:*\n${trackingCode}\n\nRastrear: ${linkRastreio}\n\n⏱️ Prazo: 2-3 dias úteis\nDúvidas? (31) 98481-5086`;

      try {
        await fetch(
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
              text: { body: mensagemWpp },
            }),
          }
        );
      } catch (whatsappError) {
        console.error("Erro WhatsApp no tracking:", whatsappError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Rastreio enviado por e-mail e WhatsApp",
      }),
    };
  } catch (error) {
    console.error("Erro send-tracking:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
