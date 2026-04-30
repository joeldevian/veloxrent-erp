const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function create(req, res) {
  try {
    const { full_name, email, password, role } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{
      full_name, email: email.toLowerCase().trim(), password_hash, role: role || 'operator'
    }]).select('id, full_name, email, role, is_active, created_at').single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: true, message: 'El email ya está registrado' });
      throw error;
    }
    res.status(201).json({ error: false, message: 'Usuario creado', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al crear usuario' });
  }
}

async function update(req, res) {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    const { data, error } = await supabase.from('users')
      .update(updateData).eq('id', req.params.id)
      .select('id, full_name, email, role, is_active').single();
    if (error) throw error;
    res.json({ error: false, message: 'Usuario actualizado', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al actualizar usuario' });
  }
}

async function deactivate(req, res) {
  try {
    const { data, error } = await supabase.from('users')
      .update({ is_active: false }).eq('id', req.params.id)
      .select('id, full_name, is_active').single();
    if (error) throw error;
    res.json({ error: false, message: 'Usuario desactivado', data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al desactivar usuario' });
  }
}

async function getAll(req, res) {
  try {
    const { data, error } = await supabase.from('users')
      .select('id, full_name, email, role, is_active, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ error: false, data });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error al obtener usuarios' });
  }
}

module.exports = { create, update, deactivate, getAll };
