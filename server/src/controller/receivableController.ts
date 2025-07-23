import { Request, Response, NextFunction } from 'express'

import { ReceivableProps } from '../types/types.js'
import { Sale } from '../model/Sales.js'


export async function receivableController(
    req: Request<{ id: string }, {}, ReceivableProps>, res: Response) {
    try {
        const { id } = req.params
        const { status, paymentDate, bank } = req.body

        // Monta objeto para atualizar somente os campos que vieram (inclusive null para limpar)
        const updateFields: Partial<ReceivableProps> = {}

        if ('status' in req.body) updateFields.status = status
        if ('paymentDate' in req.body) updateFields.paymentDate = paymentDate
        if ('bank' in req.body) updateFields.bank = bank

        // Atualiza e retorna novo documento (new: true)
        const updatedSale = await Sale.findByIdAndUpdate(id, updateFields, { new: true })

        if (!updatedSale) {
            res.status(404).json({ message: 'Venda não encontrada' })
            return
        }

        res.json(updatedSale)
    } catch (error) {
        console.error('Erro ao atualizar receivable:', error)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
}
