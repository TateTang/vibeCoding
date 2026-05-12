const {
  getArticles,
  getArticleById,
  incrementArticleViews,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../models/articleModel');
const { findCategoryByIdentifier } = require('../models/categoryModel');

function parsePositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

async function listArticles(req, res, next) {
  try {
    const page = parsePositiveInteger(req.query.page) || 1;
    const pageSize = parsePositiveInteger(req.query.pageSize) || parsePositiveInteger(req.query.limit) || 10;
    const category = req.query.category !== undefined
      ? String(req.query.category).trim()
      : req.query.categoryId !== undefined
        ? String(req.query.categoryId).trim()
        : undefined;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : undefined;

    const result = await getArticles({ page, pageSize, category, keyword });

    return res.json({
      list: result.list,
      total: result.total,
      page,
      pageSize,
    });
  } catch (error) {
    return next(error);
  }
}

async function getArticleDetail(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ message: '文章 ID 无效' });
    }

    const article = await getArticleById(id);

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    await incrementArticleViews(id);
    const updatedArticle = await getArticleById(id);

    return res.json({ post: updatedArticle });
  } catch (error) {
    return next(error);
  }
}

async function createArticleHandler(req, res, next) {
  try {
    const { title, content, cover, category, categoryId, tags } = req.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    const categoryInput = category !== undefined ? category : categoryId;

    if (!normalizedTitle || !normalizedContent) {
      return res.status(400).json({ message: 'title 和 content 为必填项' });
    }

    let resolvedCategoryId = null;
    if (categoryInput !== undefined && categoryInput !== null && String(categoryInput).trim() !== '') {
      const existedCategory = await findCategoryByIdentifier(categoryInput);

      if (!existedCategory) {
        return res.status(400).json({ message: '分类不存在' });
      }

      resolvedCategoryId = existedCategory.id;
    }

    const article = await createArticle({
      title: normalizedTitle,
      content: normalizedContent,
      cover: cover || null,
      categoryId: resolvedCategoryId,
      tags,
      authorId: req.user.id,
    });

    return res.status(201).json({ message: '创建成功', post: article });
  } catch (error) {
    return next(error);
  }
}

async function updateArticleHandler(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ message: '文章 ID 无效' });
    }

    const article = await getArticleById(id);

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (Number(article.author_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: '只能修改自己的文章' });
    }

    const payload = {};

    if (req.body.title !== undefined) {
      const normalizedTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';

      if (!normalizedTitle) {
        return res.status(400).json({ message: 'title 不能为空' });
      }

      payload.title = normalizedTitle;
    }

    if (req.body.content !== undefined) {
      const normalizedContent = typeof req.body.content === 'string' ? req.body.content.trim() : '';

      if (!normalizedContent) {
        return res.status(400).json({ message: 'content 不能为空' });
      }

      payload.content = normalizedContent;
    }

    if (req.body.cover !== undefined) {
      payload.cover = req.body.cover || null;
    }

    if (req.body.tags !== undefined) {
      payload.tags = req.body.tags;
    }

    if (req.body.category !== undefined || req.body.categoryId !== undefined) {
      const categoryInput = req.body.category !== undefined ? req.body.category : req.body.categoryId;

      if (categoryInput === null || String(categoryInput).trim() === '') {
        payload.category_id = null;
      } else {
        const existedCategory = await findCategoryByIdentifier(categoryInput);

        if (!existedCategory) {
          return res.status(400).json({ message: '分类不存在' });
        }

        payload.category_id = existedCategory.id;
      }
    }

    const updatedArticle = await updateArticle(id, payload);
    return res.json({ message: '更新成功', post: updatedArticle });
  } catch (error) {
    return next(error);
  }
}

async function deleteArticleHandler(req, res, next) {
  try {
    const id = parsePositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ message: '文章 ID 无效' });
    }

    const article = await getArticleById(id);

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (Number(article.author_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: '只能删除自己的文章' });
    }

    await deleteArticle(id, req.user.id);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listArticles,
  getArticleDetail,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
};
