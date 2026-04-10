import express from 'express'
import asyncHandler from 'express-async-handler'
import Order from '../models/Order.js'

const router = express.Router()

// GET all orders (with filters)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { status, search, month, year } = req.query
      let filter = {}

      if (status) filter.status = status

      if (search) {
        filter.orderNumber = { $regex: search, $options: 'i' }
      }

      if (month && year) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        filter.createdAt = { $gte: startDate, $lte: endDate }
      }

      const orders = await Order.find(filter).sort({ createdAt: -1 })
      res.json(orders)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }),
)

// GET orders grouped by month
router.get(
  '/grouped-by-month',
  asyncHandler(async (req, res) => {
    try {
      const orders = await Order.find().sort({ createdAt: -1 })

      const grouped = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt)
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
        const monthName = date.toLocaleString('default', { month: 'long' })
        const year = date.getFullYear()

        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: monthName,
            year: year,
            monthNumber: date.getMonth() + 1,
            orders: [],
          }
        }
        acc[monthYear].orders.push(order)
        return acc
      }, {})

      res.json(grouped)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }),
)

// POST - Create new order
router.post(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { orderNumber, notes } = req.body

      const existingOrder = await Order.findOne({ orderNumber })
      if (existingOrder) {
        return res.status(409).json({ message: 'Order already exists' })
      }

      const order = new Order({
        orderNumber: orderNumber.trim(),
        notes: notes || '',
      })

      const savedOrder = await order.save()
      res.status(201).json(savedOrder)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }),
)

// POST - Bulk add orders
router.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    try {
      const { orders } = req.body
      const createdOrders = []
      const errors = []

      for (const orderData of orders) {
        try {
          const existingOrder = await Order.findOne({
            orderNumber: orderData.orderNumber,
          })
          if (!existingOrder) {
            const order = new Order({
              orderNumber: orderData.orderNumber.trim(),
              notes: orderData.notes || '',
            })
            const saved = await order.save()
            createdOrders.push(saved)
          } else {
            errors.push({
              orderNumber: orderData.orderNumber,
              error: 'Already exists',
            })
          }
        } catch (err) {
          errors.push({
            orderNumber: orderData.orderNumber,
            error: err.message,
          })
        }
      }

      res.status(201).json({
        created: createdOrders,
        errors,
        totalCreated: createdOrders.length,
      })
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }),
)

// PUT - Update order (notes only)
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const { notes } = req.body
      const order = await Order.findById(req.params.id)

      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }

      if (notes !== undefined) order.notes = notes

      const updatedOrder = await order.save()
      res.json(updatedOrder)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }),
)

// PUT - Mark order as collected
router.put(
  '/:id/collect',
  asyncHandler(async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }

      order.status = 'collected'
      const updatedOrder = await order.save()
      res.json(updatedOrder)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }),
)

// DELETE - Delete an order
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const order = await Order.findByIdAndDelete(req.params.id)
      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }
      res.json({ message: 'Order deleted successfully' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }),
)

export default router
