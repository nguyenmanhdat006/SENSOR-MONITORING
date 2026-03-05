require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncHomeAssistantToInflux } = require('./service/haSyncService');

const { sendAlert, formatAlertMessage } = require('./service/emailService');
const { alertRules } = require('./config/alertRule');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/demo-anomaly', async (req, res) => {
  const { sensorData, userEmail } = req.body;
  if (!sensorData || typeof sensorData !== 'object') {
    return res.status(400).json({ success: false, error: 'Missing or invalid sensorData' });
  }

  const alerts = [];
  for (const rule of alertRules) {
    const value = sensorData[rule.keyword];
    if (value !== undefined && rule.condition(value)) {
      alerts.push({
        sensor: rule.keyword,
        value,
        threshold: rule.threshold,
        status: rule.message
      });
    }
  }

  if (alerts.length > 0) {
    const subject = 'Sensor Anomaly Alert';
    const html = formatAlertMessage(alerts);
    const toEmail = userEmail || process.env.ALERT_EMAIL;
    await sendAlert(subject, html, toEmail);
    return res.json({ success: true, alerts });
  }
  return res.json({ success: true, alerts: [] });
});


app.post('/api/sync-data', async (req, res) => {
  try {
    const result = await syncHomeAssistantToInflux();
    res.json({ success: true, message: result });
  } catch (err) {
    console.error('[ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


setInterval(async () => {
  try {
    const result = await syncHomeAssistantToInflux();
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] `, result);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString('vi-VN')}] Sync error:`, err.message);
  }
}, 30000); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`API: POST http://localhost:${PORT}/api/sync-data`);
  console.log(`Auto-sync: Every 30 seconds`);
});
