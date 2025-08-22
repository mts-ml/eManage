import { NextFunction, Request, Response } from "express"

import { Sale } from "../model/Sales.js"
import { logError } from "../utils/logger.js"


export async function getSale(req: Request, res: Response, next: NextFunction) {
    try {
        const lastSale = await Sale.findOne().sort({ saleNumber: -1 })
        if (!lastSale) {
            res.sendStatus(204)
            return
        }

        res.json({ sale: lastSale })
    } catch (error) {
        logError("GetLastSaleController", error)
        next(error)
    }
}
