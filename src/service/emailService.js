const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendAlert(subject, message, toEmail) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: toEmail || process.env.ALERT_EMAIL,
    subject: subject,
    html: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${subject} to ${mailOptions.to}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

function formatAlertMessage(alerts) {
  let html = `
    <h2>🚨 Alert from Monitoring System</h2>
    <p><strong>Time:</strong> ${new Date().toLocaleString('en-US')}</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #ff6b6b; color: white;">
          <th>Sensor</th>
          <th>Current Value</th>
          <th>Threshold</th>
          <th>Status</th>
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
        <td>⚠️ Exceeded threshold</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px; color: #666;">
      <em>Please check the system!</em>
    </p>
  `;

  return html;
}

module.exports = { sendAlert, formatAlertMessage };