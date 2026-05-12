const { getAllCategories, createCategory } = require('../models/categoryModel');

async function listCategories(req, res, next) {
  try {
    const categories = await getAllCategories();
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
}

async function createCategoryHandler(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name 为必填项' });
    }

    const category = await createCategory({ name, description });
    return res.status(201).json({ message: '创建成功', category });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  createCategoryHandler,
};
