const express = require('express');
const healthRoutes = require('./routes/health');

const app = express();

app.use(express.json());
app.use('/health', healthRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

module.exports = app;