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
    const pedido = JSON.parse(event.body);
    const { pedidoId, cliente, itens, total, data } = pedido;

    const dataFormatada = new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itensHtml = itens
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${item.nome}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantidade}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">R$ ${(item.preco * item.quantidade).toLocaleString("pt-BR")},00</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fafafa;padding:0;">
        <div style="background:#e11d48;padding:32px 24px;text-align:center;">
          <h1 style="color:white;font-size:24px;margin:0;">Skincare Pro Store</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px;">Pedido confirmado!</p>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:18px;color:#0f0f14;">Olá <strong>${cliente.nome}</strong>,</p>
          <p style="font-size:15px;color:#6b7280;">Recebemos seu pedido com sucesso! Em breve você receberá o código de rastreio por e-mail e WhatsApp.</p>
          <div style="background:white;border-radius:12px;padding:24px;margin:24px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Número do pedido:</p>
            <p style="font-size:20px;font-weight:800;color:#e11d48;margin:0 0 16px;">${pedidoId}</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Data:</p>
            <p style="font-size:15px;color:#0f0f14;margin:0 0 16px;">${dataFormatada}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">Produto</th>
                  <th style="padding:8px;text-align:center;border-bottom:2px solid #e5e7eb;">Qtd</th>
                  <th style="padding:8px;text-align:right;border-bottom:2px solid #e5e7eb;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itensHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 8px;font-weight:800;font-size:16px;text-align:right;">Total:</td>
                  <td style="padding:12px 8px;font-weight:800;font-size:18px;color:#e11d48;text-align:right;">R$ ${total.toLocaleString("pt-BR")},00</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:24px 0;">
            <p style="margin:0;font-size:14px;color:#15803d;">📦 <strong>Prazo de entrega:</strong> 2 a 3 dias úteis</p>
            <p style="margin:8px 0 0;font-size:14px;color:#15803d;">📧 <strong>Rastreio:</strong> Será enviado automaticamente por e-mail e WhatsApp</p>
            <p style="margin:8px 0 0;font-size:14px;color:#15803d;">🧾 <strong>Nota fiscal:</strong> Enviada junto com o pedido</p>
          </div>
          <p style="font-size:14px;color:#6b7280;margin-top:24px;">Precisa de ajuda? Responda este e-mail ou fale no WhatsApp: (31) 98481-5086</p>
        </div>
        <div style="background:#0f0f14;padding:24px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">© 2026 Skincare Pro Store. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Skincare Pro Store" <${process.env.GMAIL_USER}>`,
      to: cliente.email,
      subject: `Pedido confirmado! ${pedidoId} — Skincare Pro Store`,
      html,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "E-mail enviado ao cliente" }),
    };
  } catch (error) {
    console.error("Erro send-email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
