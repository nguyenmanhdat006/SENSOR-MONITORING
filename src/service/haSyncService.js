const axios = require('axios');
const { Point } = require('@influxdata/influxdb-client');
const { client, org, bucket } = require('../config/influx');
const { sendAlert, formatAlertMessage } = require('./emailService');
const { alertRules } = require('../config/alertRule');

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

const allowKeywords = [
  'power',
  'electric_consumption',
  'temperature',
  'humidity',
  'battery',
  'carbon_dioxide'
];


const alertCache = new Map();
const ALERT_COOLDOWN = 30 * 60 * 1000; // 30 phút

function shouldSendAlert(entityId) {
  const lastAlert = alertCache.get(entityId);
  const now = Date.now();
  
  if (!lastAlert || (now - lastAlert) > ALERT_COOLDOWN) {
    alertCache.set(entityId, now);
    return true;
  }
  return false;
}

function checkAlertRules(item, value) {
  const alerts = [];
  
  for (const rule of alertRules) {
    if (item.entity_id.includes(rule.keyword) && rule.condition(value)) {
      alerts.push({
        entityId: item.entity_id,
        name: item.attributes.friendly_name || item.entity_id,
        value: value,
        unit: item.attributes.unit_of_measurement || rule.unit,
        threshold: rule.threshold,
        message: rule.message
      });
    }
  }
  
  return alerts;
}

async function syncHomeAssistantToInflux() {
  const writeApi = client.getWriteApi(org, bucket);
  const response = await axios.get(`${HA_URL}/api/states`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = response.data;
  let count = 0;
  const allAlerts = [];

  for (const item of data) {
    if (!item.entity_id.startsWith('sensor.')) continue;
    if (!allowKeywords.some(k => item.entity_id.includes(k))) continue;

    const raw = item.state;
    if (raw === 'unknown' || raw === 'unavailable') continue;

    const value = parseFloat(raw);
    if (isNaN(value)) continue;

   
    const point = new Point('sensor_measurements')
      .tag('entity_id', item.entity_id)
      .tag('name', item.attributes.friendly_name || item.entity_id)
      .tag('unit', item.attributes.unit_of_measurement || '')
      .floatField('value', value)
      .timestamp(new Date(item.last_updated));

    writeApi.writePoint(point);
    count++;

    // 🚨 Kiểm tra cảnh báo
    const alerts = checkAlertRules(item, value);
    if (alerts.length > 0 && shouldSendAlert(item.entity_id)) {
      allAlerts.push(...alerts);
    }
  }

  await writeApi.close();

  // 📧 Gửi email nếu có cảnh báo
  if (allAlerts.length > 0) {
    const subject = `Notification ${allAlerts.length} something exceeded threshold`;
    const message = formatAlertMessage(allAlerts);
    await sendAlert(subject, message);
  }

  return `Đã ghi ${count} records vào InfluxDB. Cảnh báo: ${allAlerts.length}`;
}

module.exports = { syncHomeAssistantToInflux };