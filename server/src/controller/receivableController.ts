import { Request, Response } from 'express'

import { Sale } from '../model/Sales.js'
import { SalePayload } from '../types/types.js'
import { logError } from "../utils/logger.js"


export const updateReceivable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { status, totalPaid, remainingAmount, firstPaymentDate, finalPaymentDate, bank, observations, payments } = req.body

        // Validar se a venda existe
        const sale = await Sale.findById(id)
        if (!sale) {
            res.status(404).json({ message: 'Venda não encontrada' })
            return
        }

        // Preparar campos para atualização
        const updateFields: Partial<SalePayload> = {}

        if (status !== undefined) updateFields.status = status
        if (totalPaid !== undefined) updateFields.totalPaid = totalPaid
        if (remainingAmount !== undefined) updateFields.remainingAmount = remainingAmount
        if (firstPaymentDate !== undefined) updateFields.firstPaymentDate = firstPaymentDate
        if (finalPaymentDate !== undefined) updateFields.finalPaymentDate = finalPaymentDate
        if (bank !== undefined) updateFields.bank = bank
        if (observations !== undefined) updateFields.observations = observations
        if (payments !== undefined) updateFields.payments = payments

        // Atualizar a venda
        const updatedSale = await Sale.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        )

        if (!updatedSale) {
            res.status(500).json({ message: 'Erro ao atualizar venda' })
            return
        }

        res.json({
            message: 'Venda atualizada com sucesso',
            data: updatedSale
        })

    } catch (error) {
        logError("ReceivableController", error)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}
