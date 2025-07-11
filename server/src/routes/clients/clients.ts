import express from 'express'

import { createNewClient, updateClient, getAllClients } from '../../controller/clientsController.js'
import { handleClientValidation } from '../../middleware/clientValidation.js'


const router = express.Router()

router.route('/')
    .get(getAllClients)
    .post(handleClientValidation, createNewClient)
router.put('/:id', handleClientValidation, updateClient)

export default router
