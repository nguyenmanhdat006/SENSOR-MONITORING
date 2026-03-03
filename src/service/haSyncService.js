const axios = require('axios');
const { Point } = require('@influxdata/influxdb-client');
const { client, org, bucket } = require('../config/influx');

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
  }

  await writeApi.close();
  return `Đã ghi ${count} records vào InfluxDB`;
}

module.exports = { syncHomeAssistantToInflux };