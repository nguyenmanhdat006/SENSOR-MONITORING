require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncHomeAssistantToInflux } = require('./service/haSyncService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/sync-data', async (req, res) => {
  try {
    const result = await syncHomeAssistantToInflux();
    res.json({ message: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

setInterval(async () => {
  try {
    const result = await syncHomeAssistantToInflux();
    console.log(result);
  } catch (err) {
    console.error("Sync error:", err.message);
  }
}, 30000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});