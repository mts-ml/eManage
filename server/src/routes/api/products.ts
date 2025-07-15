import express from 'express'

import { createNewProduct, deleteProduct, getAllProducts, updateProduct } from '../../controller/productController.js'
import { handleProductValidation } from '../../middleware/productValidation.js'


const router = express.Router()

router.route('/')
    .get(getAllProducts)
    .post(handleProductValidation, createNewProduct)
router.put('/:id', handleProductValidation, updateProduct)
router.delete('/:id', deleteProduct)

export default router
