import express from 'express'
import { handleLogout } from '../controller/logoutController.js'


const router = express.Router()

router.get('/', handleLogout)

export default router
