const crypto = require('crypto')
const express = require('express')

const router = express.Router()

function buildSignature(parameters, apiSecret) {
  const serialized = Object.keys(parameters)
    .sort()
    .map((key) => `${key}=${parameters[key]}`)
    .join('&')

  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

function createFallbackResponse(fileName, dataUrl) {
  return {
    idCardUrl: dataUrl,
    idCardName: fileName,
    originalFilename: fileName,
  }
}

router.post('/id-card', async (req, res, next) => {
  try {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : ''
    const fileName =
      typeof req.body?.fileName === 'string' && req.body.fileName.trim().length > 0
        ? req.body.fileName.trim()
        : 'id-card'
    const mimeType =
      typeof req.body?.mimeType === 'string' && req.body.mimeType.trim().length > 0
        ? req.body.mimeType.trim()
        : 'image/jpeg'

    if (!dataUrl.startsWith('data:')) {
      return res.status(400).json({
        message: 'Please provide a valid image file.',
      })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
    const folder = process.env.CLOUDINARY_FOLDER?.trim() || 'jordela-bridals/id-cards'

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(200).json({
        message: 'Cloudinary is not configured. Saved as a local data URL fallback.',
        data: createFallbackResponse(fileName, dataUrl),
      })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const publicId = `${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`
    const parameters = {
      folder,
      public_id: publicId,
      timestamp,
    }
    const signature = buildSignature(parameters, apiSecret)

    const body = new URLSearchParams({
      file: dataUrl,
      api_key: apiKey,
      folder,
      public_id: publicId,
      timestamp: String(timestamp),
      signature,
    })

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      return res.status(502).json({
        message: payload?.error?.message || 'Unable to upload ID card.',
      })
    }

    return res.status(200).json({
      message: 'ID card uploaded successfully.',
      data: {
        idCardUrl: payload?.secure_url || dataUrl,
        idCardName: fileName,
        originalFilename: payload?.original_filename || fileName,
      },
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
