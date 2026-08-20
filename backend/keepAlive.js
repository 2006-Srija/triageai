import { supabase } from './config/supabase.js';

const KEEPALIVE_INTERVAL_MS = process.env.KEEPALIVE_INTERVAL_MS || 10 * 60 * 1000;

// Warming both services:
//  - Each interval we run a lightweight Supabase query so the DB stays initialized.
//  - A lightweight query costs far less than the table growing; a SELECT 1 is enough.
//  - Supabase may auto-pause after ~6 days even with activity; this keeps it warm.
//  - Render's free tier sleeps after ~15min without HTTP traffic. Combined with an
//    external uptime ping (UptimeRobot) hitting /api/health, this loop runs each time
//    Render spins up and keeps the DB connection warm.
async function keepAlive() {
  try {
    // Use the service role client so we don't need a user session.
    // A trivial count query warms the connection pool.
    await supabase.from('tickets').select('id', { count: 'exact', head: true });
    console.log(`[keepAlive] Supabase warmed at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[keepAlive] Supabase ping failed:', err.message);
  }
}

export function startKeepAlive() {
  console.log(`[keepAlive] Starting. Pinging Supabase every ${KEEPALIVE_INTERVAL_MS / 1000}s`);
  // Ping immediately on boot, then on the interval.
  keepAlive();
  const timer = setInterval(keepAlive, KEEPALIVE_INTERVAL_MS);
  timer.unref?.();
  return timer;
}
