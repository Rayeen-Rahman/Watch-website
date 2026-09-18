// backend/routes/newsletterRoutes.js
const express = require('express');
const router  = express.Router();
const NewsletterSubscriber = require('../models/NewsletterSubscriber');

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if already subscribed
    const exists = await NewsletterSubscriber.findOne({ email: emailLower });
    if (exists) {
      return res.status(200).json({ message: 'Already subscribed!' });
    }

    await NewsletterSubscriber.create({ email: emailLower });
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    if (err.name === 'ValidationError' || err.code === 11000) {
      return res.status(400).json({ message: err.message || 'Invalid email address' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
