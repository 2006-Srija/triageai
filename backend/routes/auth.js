import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

function generateToken(user) {
  return jwt.sign(
    { user_id: user.id, tenant_id: user.tenant_id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// POST /api/auth/signup — create new organization + admin user
router.post(
  '/signup',
  [
    body('orgName').trim().notEmpty().withMessage('Organization name is required'),
    body('name').trim().notEmpty().withMessage('Your name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { orgName, name, email, password } = req.body;

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Create organization and user in a transaction
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single();

      if (orgError) throw orgError;

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          tenant_id: org.id,
          email,
          password_hash: passwordHash,
          name,
          role: 'Admin',
        })
        .select()
        .single();

      if (userError) {
        // Rollback org creation
        await supabase.from('organizations').delete().eq('id', org.id);
        throw userError;
      }

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id },
        organization: { id: org.id, name: org.name, invite_code: org.invite_code },
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Fetch org for invite code
      const { data: org } = await supabase
        .from('organizations')
        .select('name, invite_code')
        .eq('id', user.tenant_id)
        .single();

      const token = generateToken(user);
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id },
        organization: { id: user.tenant_id, name: org?.name || '', invite_code: org?.invite_code || '' },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// POST /api/auth/join — join existing organization via invite code
router.post(
  '/join',
  [
    body('inviteCode').trim().notEmpty().withMessage('Invite code is required'),
    body('name').trim().notEmpty().withMessage('Your name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { inviteCode, name, email, password } = req.body;

    try {
      // Look up org by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (orgError || !org) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }

      // Check if email already exists in this tenant
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          tenant_id: org.id,
          email,
          password_hash: passwordHash,
          name,
          role: 'Agent', // Joining users default to Agent role
        })
        .select()
        .single();

      if (userError) throw userError;

      const token = generateToken(user);
      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id },
        organization: { id: org.id, name: org.name, invite_code: org.invite_code },
      });
    } catch (err) {
      console.error('Join error:', err);
      res.status(500).json({ error: 'Failed to join organization' });
    }
  }
);

export default router;
