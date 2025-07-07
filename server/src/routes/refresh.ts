import express from 'express'

import { handleRefreshToken } from '../controller/refreshTokenController.js'


const router = express.Router()

router.get('/', handleRefreshToken)

export default router
