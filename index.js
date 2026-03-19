import express from 'express';
import 'dotenv/config';
import { webhookHandler } from './handlers/webhookHandler.js';
import { sendImmediateNotification } from './jobs/sendImmediate.js';
import { initSend3DaysBeforeJob } from './jobs/send3DaysBefore.js';
import { initSend24hBeforeJob } from './jobs/send24hBefore.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ts: new Date() 
  });
});

// Webhook da Evolution API
app.post('/webhook/evolution', webhookHandler);

// Endpoint para notificação imediata
app.post('/notify/immediate', async (req, res) => {
  try {
    const { appointment_id } = req.body;
    
    if (!appointment_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'appointment_id is required' 
      });
    }

    await sendImmediateNotification(appointment_id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[IMMEDIATE] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Inicializar cron jobs
initSend3DaysBeforeJob();
initSend24hBeforeJob();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Worker running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Webhook: http://localhost:${PORT}/webhook/evolution`);
  console.log(`📍 Immediate notify: http://localhost:${PORT}/notify/immediate`);
});
