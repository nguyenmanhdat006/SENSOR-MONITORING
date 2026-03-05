const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

const defaultConfig = {
  email: 'admin@example.com',
  rules: {
    temperature: 39,
    power: 500,
    carbon_dioxide: 1000,
    electric_consumption: 500
  }
};

function ensureConfigExists() {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  }
}

function getConfig() {
  ensureConfigExists();
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config:', error);
    return defaultConfig;
  }
}

function saveConfig(newConfig) {
  ensureConfigExists();
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

function getAlertRules() {
  const config = getConfig();
  const rules = config.rules || defaultConfig.rules;
  
  return [
    {
      keyword: 'power',
      threshold: rules.power,
      unit: 'W',
      condition: (value) => value > rules.power,
      message: 'excess capacity'
    },
    {
      keyword: 'electric_consumption',
      threshold: rules.electric_consumption,
      unit: 'kWh',
      condition: (value) => value > rules.electric_consumption,
      message: 'Power consumption exceeds threshold'
    },
    {
      keyword: 'temperature',
      threshold: rules.temperature,
      unit: '°C',
      condition: (value) => value > rules.temperature,
      message: 'Temperature exceeds threshold'
    },
    {
      keyword: 'carbon_dioxide',
      threshold: rules.carbon_dioxide,
      unit: 'ppm',
      condition: (value) => value > rules.carbon_dioxide,
      message: 'Carbon dioxide concentration exceeds threshold'
    }
  ];
}

module.exports = { getConfig, saveConfig, getAlertRules };
