import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { ownerOnly } from '../middleware/owner.js'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCart,
  addToCart,
  removeFromCart,
  updateCart,
  clearCart,
  createOrder,
  listOrders,
  getOrder,
} from '../controllers/shopController.js'

const router = Router()

// Public: list products
router.get('/products', listProducts)

// Owner: manage products
router.post('/products', authMiddleware, ownerOnly, createProduct)
router.put('/products/:id', authMiddleware, ownerOnly, updateProduct)
router.delete('/products/:id', authMiddleware, ownerOnly, deleteProduct)

// User: cart
router.get('/cart', authMiddleware, getCart)
router.post('/cart/add', authMiddleware, addToCart)
router.post('/cart/remove', authMiddleware, removeFromCart)
router.post('/cart/update', authMiddleware, updateCart)
router.post('/cart/clear', authMiddleware, clearCart)

// Orders
router.post('/orders', authMiddleware, createOrder)
router.get('/orders', authMiddleware, listOrders)
router.get('/orders/:id', authMiddleware, getOrder)

export default router

