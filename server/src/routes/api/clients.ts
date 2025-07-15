import express from 'express'

import { createNewClient, updateClient, getAllClients, deleteClient } from '../../controller/clientsController.js'
import { handleClientValidation } from '../../middleware/clientValidation.js'


const router = express.Router()

router.route('/')
    .get(getAllClients)
    .post(handleClientValidation, createNewClient)
router.put('/:id', handleClientValidation, updateClient)
router.delete('/:id', deleteClient)

export default router
