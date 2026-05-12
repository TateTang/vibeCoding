const { findById, updateUser } = require('../models/userModel');

async function getProfile(req, res, next) {
  try {
    const user = await findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const allowedFields = ['username', 'email', 'avatar'];
    const payload = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        payload[key] = req.body[key];
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: '没有可更新的字段' });
    }

    const user = await updateUser(req.user.id, payload);
    return res.json({ message: '更新成功', user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
};
