const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, firstName, lastName, verificationToken } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (email, password, first_name, last_name, verification_token) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      email, 
      hashedPassword, 
      firstName, 
      lastName, 
      verificationToken
    ]);
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, is_verified, created_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async verifyEmail(token) {
    const query = 'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?';
    const [result] = await pool.execute(query, [token]);
    return result.affectedRows > 0;
  }

  static async setResetToken(email, token, expires) {
    const query = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
    const [result] = await pool.execute(query, [token, expires, email]);
    return result.affectedRows > 0;
  }

  static async findByResetToken(token) {
    const query = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()';
    const [rows] = await pool.execute(query, [token]);
    return rows[0];
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const query = 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;