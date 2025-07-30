import express from 'express'

import { createNewSupplier, deleteSupplier, getAllSuppliers, updateSupplier } from '../../controller/supplierController.js'
import { handleSupplierValidation } from '../../middleware/supplierValidation.js'


const router = express.Router()

router.route('/')
    .get(getAllSuppliers)
    .post(handleSupplierValidation, createNewSupplier)
router.put('/:id', handleSupplierValidation, updateSupplier)
router.delete('/:id', deleteSupplier)

export default router
