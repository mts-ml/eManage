import express from "express"

import { getPurchase } from "../../../controller/getLastPurchaseController.js"


const router = express.Router()

router.get('/', getPurchase)

export default router
