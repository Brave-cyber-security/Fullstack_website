import express from 'express';
import { isAuthenticated, isAdmin } from './auth.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

const router = express.Router();

// Public knowledge base search
router.get('/search', async (req, res) => {
  try {
    const { query, category, deviceType } = req.query;
    
    // Build filter
    const filter = { isPublished: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (deviceType) {
      filter.deviceTypes = deviceType;
    }
    
    let articles;
    
    if (query) {
      // Text search
      articles = await KnowledgeBase.find(
        { 
          $text: { $search: query },
          ...filter
        },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
    } else {
      // Regular search
      articles = await KnowledgeBase.find(filter)
        .sort({ viewCount: -1 });
    }
    
    res.render('knowledge/search', { 
      articles,
      searchParams: { query, category, deviceType }
    });
  } catch (error) {
    console.error('Knowledge base search error:', error);
    res.status(500).render('error', { error: 'Error searching knowledge base' });
  }
});

// View article
router.get('/article/:id', async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('author', 'firstName lastName');
    
    if (!article || !article.isPublished) {
      return res.status(404).render('error', { error: 'Article not found' });
    }
    
    // Increment view count
    article.viewCount += 1;
    await article.save();
    
    // Get related articles
    const relatedArticles = await KnowledgeBase.find({
      _id: { $ne: article._id },
      isPublished: true,
      $or: [
        { category: article.category },
        { deviceTypes: { $in: article.deviceTypes } },
        { tags: { $in: article.tags } }
      ]
    })
    .sort({ viewCount: -1 })
    .limit(3);
    
    res.render('knowledge/article', { article, relatedArticles });
  } catch (error) {
    console.error('View article error:', error);
    res.status(500).render('error', { error: 'Error loading article' });
  }
});

// Rate article helpfulness
router.post('/article/:id/rate', async (req, res) => {
  try {
    const { helpful } = req.body;
    const article = await KnowledgeBase.findById(req.params.id);
    
    if (!article) {
      return res.status(404).render('error', { error: 'Article not found' });
    }
    
    // Update helpfulness count
    if (helpful === 'yes') {
      article.helpfulCount += 1;
    } else if (helpful === 'no') {
      article.notHelpfulCount += 1;
    }
    
    await article.save();
    
    res.redirect(`/knowledge/article/${article._id}`);
  } catch (error) {
    console.error('Rate article error:', error);
    res.status(500).render('error', { error: 'Error rating article' });
  }
});

// Admin routes for knowledge base management
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const articles = await KnowledgeBase.find()
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName');
    
    res.render('admin/knowledge-list', { articles });
  } catch (error) {
    console.error('Knowledge base admin error:', error);
    res.status(500).render('error', { error: 'Error loading knowledge base articles' });
  }
});

// Add article form
router.get('/admin/new', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/knowledge-form', { article: {} });
});

// Add article
router.post('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { 
      title, content, category, deviceTypes,
      tags, isPublished
    } = req.body;
    
    // Validate input
    if (!title || !content || !category) {
      return res.render('admin/knowledge-form', {
        error: 'Title, content, and category are required',
        article: req.body
      });
    }
    
    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // Create article
    const article = new KnowledgeBase({
      title,
      content,
      category,
      deviceTypes: Array.isArray(deviceTypes) ? deviceTypes : [deviceTypes],
      tags: tagArray,
      author: req.session.user,
      isPublished: isPublished === 'on'
    });
    
    await article.save();
    
    res.redirect('/knowledge/admin');
  } catch (error) {
    console.error('Add article error:', error);
    res.status(500).render('error', { error: 'Error adding article' });
  }
});

// Edit article form
router.get('/admin/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    
    if (!article) {
      return res.status(404).render('error', { error: 'Article not found' });
    }
    
    res.render('admin/knowledge-form', { article });
  } catch (error) {
    console.error('Edit article form error:', error);
    res.status(500).render('error', { error: 'Error loading article edit form' });
  }
});

// Update article
router.post('/admin/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { 
      title, content, category, deviceTypes,
      tags, isPublished
    } = req.body;
    
    // Validate input
    if (!title || !content || !category) {
      return res.render('admin/knowledge-form', {
        error: 'Title, content, and category are required',
        article: { ...req.body, _id: req.params.id }
      });
    }
    
    const article = await KnowledgeBase.findById(req.params.id);
    
    if (!article) {
      return res.status(404).render('error', { error: 'Article not found' });
    }
    
    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // Update article
    article.title = title;
    article.content = content;
    article.category = category;
    article.deviceTypes = Array.isArray(deviceTypes) ? deviceTypes : [deviceTypes];
    article.tags = tagArray;
    article.isPublished = isPublished === 'on';
    
    await article.save();
    
    res.redirect('/knowledge/admin');
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).render('error', { error: 'Error updating article' });
  }
});

// Delete article
router.delete('/admin/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.redirect('/knowledge/admin');
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).render('error', { error: 'Error deleting article' });
  }
});

export const knowledgeBaseRoutes = router;
