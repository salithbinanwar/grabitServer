import express from 'express'
import asyncHandler from 'express-async-handler'
import { protect } from '../middleware/authMiddleware.js'
import User from '../models/User.js'
import generateToken from '../utils/generateToken.js'

const router = express.Router()

// Check if users exist (first time setup)
router.get(
  '/setup-needed',
  asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments()
    res.json({ setupNeeded: userCount === 0 })
  }),
)

// Check if specific role exists
router.post(
  '/check-role',
  asyncHandler(async (req, res) => {
    const { role } = req.body
    const user = await User.findOne({ role })
    res.json({ exists: !!user })
  }),
)

// First time setup - create both users or single user
router.post(
  '/setup',
  asyncHandler(async (req, res) => {
    const { senderPassword, collectorPassword } = req.body

    const existingSender = await User.findOne({ role: 'sender' })
    const existingCollector = await User.findOne({ role: 'collector' })

    const created = []
    const errors = []

    // Create sender if password provided and doesn't exist
    if (senderPassword && senderPassword !== 'temp' && !existingSender) {
      try {
        const sender = new User({ role: 'sender', password: senderPassword })
        await sender.save()
        created.push('sender')
      } catch (error) {
        errors.push('sender')
      }
    }

    // Create collector if password provided and doesn't exist
    if (
      collectorPassword &&
      collectorPassword !== 'temp' &&
      !existingCollector
    ) {
      try {
        const collector = new User({
          role: 'collector',
          password: collectorPassword,
        })
        await collector.save()
        created.push('collector')
      } catch (error) {
        errors.push('collector')
      }
    }

    if (created.length === 0 && errors.length === 0) {
      res.status(400).json({ message: 'No accounts were created' })
    } else {
      res.status(201).json({
        message: `${created.join(', ')} account(s) created successfully`,
        created,
        errors,
      })
    }
  }),
)

// Login user
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { role, password } = req.body

    const user = await User.findOne({ role })

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id, user.role)
      res.json({
        _id: user._id,
        role: user.role,
        message: 'Logged in successfully',
      })
    } else {
      res.status(401)
      throw new Error('Invalid credentials')
    }
  }),
)

// Logout user / clear cookie
router.post('/logout', (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0),
  })
  res.status(200).json({ message: 'Logged out successfully' })
})

// Get current user (check if still logged in)
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(200).json({ user: null })
    }
    res.json({
      _id: req.user._id,
      role: req.user.role,
    })
  }),
)

export default router
