const express = require('express');
const {
  listArticles,
  getArticleDetail,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
} = require('../controllers/articleController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listArticles);
router.get('/:id', getArticleDetail);
router.post('/', authenticateToken, createArticleHandler);
router.put('/:id', authenticateToken, updateArticleHandler);
router.delete('/:id', authenticateToken, deleteArticleHandler);

module.exports = router;
