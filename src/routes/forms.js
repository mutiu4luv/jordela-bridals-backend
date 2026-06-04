const express = require('express')
const FormSubmission = require('../models/FormSubmission')
const { authenticateRequest, requireRole } = require('../middleware/auth')

const router = express.Router()

const requiredFields = ['brideName', 'bridePhone', 'weddingDate', 'customerSignature']

router.post('/', async (req, res, next) => {
  try {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body?.[field]
      return typeof value !== 'string' || value.trim().length === 0
    })

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Please complete the required fields before submitting.',
        missingFields,
      })
    }

    const createdSubmission = await FormSubmission.create({
      ...req.body,
      submittedBy: null,
    })

    return res.status(201).json({
      message: 'Form submitted successfully.',
      data: createdSubmission,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/', authenticateRequest, requireRole('admin'), async (_req, res, next) => {
  try {
    const submissions = await FormSubmission.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('submittedBy', 'name email role')

    return res.json({
      data: submissions,
    })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id', authenticateRequest, requireRole('admin'), async (req, res, next) => {
  try {
    const allowedUpdates = {}

    if (typeof req.body?.materialsReturned === 'boolean') {
      allowedUpdates.materialsReturned = req.body.materialsReturned
    }

    const updatedSubmission = await FormSubmission.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    }).populate('submittedBy', 'name email role')

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found.' })
    }

    return res.json({
      message: 'Submission updated successfully.',
      data: updatedSubmission,
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
