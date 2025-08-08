import { Request, Response } from 'express'

import { TransactionUpdatePayload } from '../types/types.js'
import { Purchase } from '../model/Purchases.js'


export async function getAllPayables(req: Request, res: Response) {
    try {
        const payables = await Purchase.find({ status: "Em aberto" }).sort({ date: -1 })
        
        if (payables.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(payables)
    } catch (error) {
        console.error('Erro ao buscar payables:', error)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}

export async function payableController(req: Request<{ id: string }, {}, TransactionUpdatePayload>, res: Response) {
    try {
        const { id } = req.params
        const { status, paymentDate, bank, invoiceNumber } = req.body

        // Monta objeto para atualizar somente os campos que vieram (inclusive null para limpar)
        const updateFields: Partial<TransactionUpdatePayload> = {}

        if ('status' in req.body) updateFields.status = status
        if ('paymentDate' in req.body) updateFields.paymentDate = paymentDate
        if ('bank' in req.body) updateFields.bank = bank
        if ('invoiceNumber' in req.body) updateFields.invoiceNumber = invoiceNumber

        // Atualiza e retorna novo documento (new: true)
        const updatePurchase = await Purchase.findByIdAndUpdate(id, updateFields, { new: true })

        if (!updatePurchase) {
            res.status(404).json({ message: 'Compra não encontrada' })
            return
        }

        res.json(updatePurchase)
    } catch (error) {
        console.error('Erro ao atualizar payable:', error)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}
