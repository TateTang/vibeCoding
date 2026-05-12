const express = require('express');
const { listCategories, createCategoryHandler } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', listCategories);
router.post('/', createCategoryHandler);

module.exports = router;
