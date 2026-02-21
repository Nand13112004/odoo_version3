require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/community');
const inviteRoutes = require('./routes/invites');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const fuelLogRoutes = require('./routes/fuelLogs');
const dashboardRoutes = require('./routes/dashboard');
const geminiRoutes = require('./routes/gemini');
const exportRoutes = require('./routes/export');

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001';
const io = new Server(server, {
  cors: { origin: corsOrigin.split(',').map(s => s.trim()), methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(cors({ origin: corsOrigin.split(',').map(s => s.trim()) }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;
