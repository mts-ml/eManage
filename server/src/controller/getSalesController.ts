import { NextFunction, Request, Response } from "express"
import { Sale } from "../model/Sales"


export async function getSales(req: Request, res: Response, next: NextFunction) {
    try {
        const lastSale = await Sale.findOne().sort({ saleNumber: -1 })
        if (!lastSale) {
            res.sendStatus(204)
            return
        }

        res.json({ sale: lastSale })
    } catch (error) {
        console.error(`getSales error: ${JSON.stringify(error)}`)
        next(error)
    }
}
