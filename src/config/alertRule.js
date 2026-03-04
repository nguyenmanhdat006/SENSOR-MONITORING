const alertRules = [
  {
    keyword: 'power',
    threshold: 500,
    unit: 'W',
    condition: (value) => value > 500,
    message: 'excess capacity'
  },
  {
    keyword: 'electric_consumption',
    threshold: 500,
    unit: 'kWh',
    condition: (value) => value > 500,
    message: 'Power consumption exceeds threshold'
  },
  {
    keyword: 'temperature',
    threshold: 39,
    unit: '°C',
    condition: (value) => value > 39,
    message: 'Temperature exceeds threshold'
  },
  {
    keyword: 'carbon_dioxide',
    threshold: 1000,
    unit: 'ppm',
    condition: (value) => value > 1000,
    message: 'Carbon dioxide concentration exceeds threshold'
  }
];

module.exports = { alertRules };