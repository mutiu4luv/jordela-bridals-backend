const express = require('express')
const FormSubmission = require('../models/FormSubmission')
const { authenticateRequest, requireRole } = require('../middleware/auth')

const router = express.Router()

const requiredFields = ['brideName', 'bridePhone', 'weddingDate', 'customerSignature']
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function readPageValue(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? fallbackValue), 10)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue
}

function readLimitValue(value) {
  const parsedValue = Number.parseInt(String(value ?? DEFAULT_PAGE_SIZE), 10)
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.min(parsedValue, MAX_PAGE_SIZE)
}

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

    if (req.body?.policyAcknowledged !== true) {
      return res.status(400).json({
        message: 'You must acknowledge the policy before submitting.',
        missingFields: ['policyAcknowledged'],
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

router.get('/summary', authenticateRequest, requireRole('admin'), async (_req, res, next) => {
  try {
    const [total, returned, latestSubmission] = await Promise.all([
      FormSubmission.countDocuments(),
      FormSubmission.countDocuments({ materialsReturned: true }),
      FormSubmission.findOne().sort({ createdAt: -1 }).select('createdAt'),
    ])

    return res.json({
      data: {
        total,
        returned,
        pending: total - returned,
        latestCreatedAt: latestSubmission?.createdAt ?? null,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/', authenticateRequest, requireRole('admin'), async (req, res, next) => {
  try {
    const page = readPageValue(req.query.page, 1)
    const limit = readLimitValue(req.query.limit)
    const skip = (page - 1) * limit

    const [submissions, total] = await Promise.all([
      FormSubmission.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('submittedBy', 'name email role'),
      FormSubmission.countDocuments(),
    ])

    return res.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + submissions.length < total,
      },
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
