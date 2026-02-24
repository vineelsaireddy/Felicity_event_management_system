import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email || user.loginEmail, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const generateTicketId = () => {
  return 'TICKET-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};
