import { NextFunction, Request, Response } from 'express'

import { ItemPayload } from '../types/types.js'


export async function handleReceivableValidation(req: Request<{}, {}, ItemPayload>, res: Response, next: NextFunction) {
    const { status, paymentDate, bank } = req.body

    if (status === undefined && paymentDate === undefined && bank === undefined) {
        res.status(400).json({ message: "Pelo menos um dos campos (status, data de pagamento, banco) deve ser fornecido para atualização." })
        return
    }

    const validStatus = ["Em aberto", "Pago"]

    if (status !== undefined) {
        if (!validStatus.includes(status)) {
            res.status(400).json({ message: "Status inválido. Use 'Em aberto' ou 'Pago'." })
            return
        }

        if (status === "Pago") {
            if (!paymentDate) {
                res.status(400).json({ message: "Para status 'Pago', a data de pagamento é obrigatória." })
                return
            }
            if (isNaN(Date.parse(paymentDate))) {
                res.status(400).json({ message: "Data de pagamento inválida." })
                return
            }
            if (!bank) {
                res.status(400).json({ message: "Para status 'Pago', o banco é obrigatório." })
                return
            }
            if (typeof bank !== "string") {
                res.status(400).json({ message: "Banco deve ser uma string." })
                return
            }
        } else if (status === "Em aberto") {
            if (paymentDate) {
                res.status(400).json({ message: "Para status 'Em aberto', a data de pagamento não deve ser informada." })
                return
            }
            if (bank) {
                // You might decide that bank should also not be present for 'Em aberto'
                res.status(400).json({ message: "Para status 'Em aberto', o banco não deve ser informado." })
                return
            }
        }
    } else { // If status is not provided, but other fields are.
        // Diferente de null e undefined
        if (typeof paymentDate === "string" && isNaN(Date.parse(paymentDate))) {
            res.status(400).json({ message: "Data de pagamento inválida." })
            return
        }
        if (bank !== undefined && typeof bank !== "string") {
            res.status(400).json({ message: "Banco deve ser uma string." })
            return
        }
    }

    next()
}
