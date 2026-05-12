const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const {
  createUser,
  findByUsername,
  findByEmail,
} = require('../models/userModel');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const PASSWORD_MIN_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

function toSafeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    created_at: user.created_at,
  };
}

function validateRegisterPayload({ username, email, password }) {
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedUsername || !normalizedEmail || !password) {
    return 'username、email 和 password 为必填项';
  }

  if (normalizedUsername.length < USERNAME_MIN_LENGTH || normalizedUsername.length > USERNAME_MAX_LENGTH) {
    return '用户名长度需为 3 到 20 个字符';
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return '邮箱格式不正确';
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return '密码至少需要 6 位';
  }

  return null;
}

async function register(req, res, next) {
  try {
    const { username, email, password, avatar } = req.body;

    const validationError = validateRegisterPayload({ username, email, password });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existedUserByUsername = await findByUsername(normalizedUsername);
    if (existedUserByUsername) {
      return res.status(409).json({ message: '用户名已存在' });
    }

    const existedUserByEmail = await findByEmail(normalizedEmail);
    if (existedUserByEmail) {
      return res.status(409).json({ message: '邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      avatar,
    });

    return res.status(201).json({
      message: '注册成功',
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (!normalizedUsername || !password) {
      return res.status(400).json({ message: 'username 和 password 为必填项' });
    }

    const user = await findByUsername(normalizedUsername);

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const safeUser = toSafeUser(user);

    return res.json({
      message: '登录成功',
      token: createToken(safeUser),
      user: safeUser,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
