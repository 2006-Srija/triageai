import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/settings — get organization settings
router.get('/', async (req, res) => {
  const tenantId = req.user.tenant_id;

  try {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, invite_code')
      .eq('id', tenantId)
      .single();

    if (orgError) throw orgError;

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;

    res.json({
      organization: org,
      users: users || [],
    });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/settings/regenerate-invite — Admin only
router.post(
  '/regenerate-invite',
  requireRole('Admin'),
  async (req, res) => {
    const tenantId = req.user.tenant_id;

    try {
      const newCode = crypto.randomBytes(6).toString('hex');
      const { data: org, error } = await supabase
        .from('organizations')
        .update({ invite_code: newCode })
        .eq('id', tenantId)
        .select('invite_code')
        .single();

      if (error) throw error;

      res.json({ invite_code: org.invite_code });
    } catch (err) {
      console.error('Regenerate invite error:', err);
      res.status(500).json({ error: 'Failed to regenerate invite code' });
    }
  }
);

export default router;
