const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendAlert(subject, message) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${subject}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
}

function formatAlertMessage(alerts) {
  let html = `
    <h2>🚨 Cảnh báo từ Hệ thống Giám sát</h2>
    <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #ff6b6b; color: white;">
          <th>Cảm biến</th>
          <th>Giá trị hiện tại</th>
          <th>Ngưỡng</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
  `;

  alerts.forEach(alert => {
    html += `
      <tr>
        <td>${alert.name}</td>
        <td style="font-weight: bold; color: red;">${alert.value} ${alert.unit}</td>
        <td>${alert.threshold} ${alert.unit}</td>
        <td>⚠️ Vượt ngưỡng</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px; color: #666;">
      <em>Vui lòng kiểm tra lại hệ thống!</em>
    </p>
  `;

  return html;
}

module.exports = { sendAlert, formatAlertMessage };