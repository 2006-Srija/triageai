import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('Admin'));

// GET /api/analytics — ticket analytics for Admin dashboard
router.get('/', async (req, res) => {
  const tenantId = req.user.tenant_id;

  try {
    // Total ticket count
    const { count: totalTickets, error: countErr } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (countErr) throw countErr;

    // Tickets by category
    const { data: byCategory } = await supabase
      .from('tickets')
      .select('category')
      .eq('tenant_id', tenantId);

    const categoryCounts = {};
    for (const t of byCategory || []) {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    }

    // Tickets by priority
    const priorityCounts = {};
    for (const t of byCategory || []) {
      // We need priority data, so fetch separately
    }

    const { data: priorityData } = await supabase
      .from('tickets')
      .select('priority')
      .eq('tenant_id', tenantId);

    const priorityCounts2 = {};
    for (const t of priorityData || []) {
      priorityCounts2[t.priority] = (priorityCounts2[t.priority] || 0) + 1;
    }

    // Security flagged tickets count
    const { count: securityFlagged, error: flagErr } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('security_flag', true);

    if (flagErr) throw flagErr;

    // Tickets by status
    const { data: statusData } = await supabase
      .from('tickets')
      .select('status')
      .eq('tenant_id', tenantId);

    const statusCounts = {};
    for (const t of statusData || []) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    }

    res.json({
      totalTickets: totalTickets || 0,
      securityFlagged: securityFlagged || 0,
      byCategory: categoryCounts,
      byPriority: priorityCounts2,
      byStatus: statusCounts,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
