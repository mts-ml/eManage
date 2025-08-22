import { NextFunction, Request, Response } from "express"

import { Purchase } from "../model/Purchases.js"
import { logError } from "../utils/logger.js"


export async function getPurchase(req: Request, res: Response, next: NextFunction) {
    try {
        const lastPurchase = await Purchase.findOne().sort({ purchaseNumber: -1 })
        if (!lastPurchase) {
            res.sendStatus(204)
            return
        }

        res.json({ purchase: lastPurchase })
    } catch (error) {
        logError("GetLastPurchaseController", error)
        next(error)
    }
}
