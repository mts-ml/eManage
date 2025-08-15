import { Request, Response } from 'express'

import { Purchase } from '../model/Purchases.js'
import { PurchasePayload } from '../types/types.js'


export const updatePayable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { status, totalPaid, remainingAmount, firstPaymentDate, finalPaymentDate, bank, observations, payments } = req.body

        // Validar se a compra existe
        const purchase = await Purchase.findById(id)
        if (!purchase) {
            res.status(404).json({ message: 'Compra não encontrada' })
            return
        }

        // Preparar campos para atualização
        const updateFields: Partial<PurchasePayload> = {}

        if (status !== undefined) updateFields.status = status
        if (totalPaid !== undefined) updateFields.totalPaid = totalPaid
        if (remainingAmount !== undefined) updateFields.remainingAmount = remainingAmount
        if (firstPaymentDate !== undefined) updateFields.firstPaymentDate = firstPaymentDate
        if (finalPaymentDate !== undefined) updateFields.finalPaymentDate = finalPaymentDate
        if (bank !== undefined) updateFields.bank = bank
        if (observations !== undefined) updateFields.observations = observations
        if (payments !== undefined) updateFields.payments = payments

        // Atualizar a compra
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        )

        if (!updatedPurchase) {
            res.status(500).json({ message: 'Erro ao atualizar compra' })
            return
        }

        res.json({
            message: 'Compra atualizada com sucesso',
            data: updatedPurchase
        })

    } catch (error) {
        console.error('Erro ao atualizar compra:', error)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}
