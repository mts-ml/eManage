import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Sale } from "../model/Sales.js"
import { PaymentStatus } from "../types/types.js"

export async function processPayment(
    req: Request<{ saleId: string }, {}, any>,
    res: Response,
    next: NextFunction
) {
    try {
        const { saleId } = req.params
        const paymentData = req.body

        // Validação de business logic: verificar se o ID da venda é válido
        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            res.status(400).json({ message: "ID da venda inválido" })
            return
        }

        // Buscar a venda no banco de dados
        const sale = await Sale.findById(saleId)
        if (!sale) {
            res.status(404).json({ message: "Venda não encontrada" })
            return
        }

        // Validação de business logic: verificar se a venda não está totalmente paga
        if (sale.status === PaymentStatus.PAID) {
            res.status(400).json({ message: "Venda já está totalmente paga" })
            return
        }

        // Validação de business logic: verificar se o valor pago não excede o valor pendente
        if (paymentData.amount > sale.remainingAmount) {
            res.status(400).json({ 
                message: `Valor pago (${paymentData.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) excede o valor pendente (${sale.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` 
            })
            return
        }

        // Atualizar totais da venda
        sale.totalPaid = (sale.totalPaid || 0) + paymentData.amount
        sale.remainingAmount = sale.total - sale.totalPaid

        // Atualizar status baseado no remainingAmount
        if (sale.remainingAmount === 0) {
            sale.status = PaymentStatus.PAID
            sale.finalPaymentDate = paymentData.paymentDate
            sale.bank = paymentData.bank || ""
        } else if (sale.totalPaid > 0) {
            sale.status = PaymentStatus.PARTIALLY_PAID
            if (!sale.firstPaymentDate) {
                sale.firstPaymentDate = paymentData.paymentDate
            }
        }

        // Salvar as alterações no banco de dados
        await sale.save()

        res.json(sale)
    } catch (error) {
        console.error(`processPayment error: ${JSON.stringify(error)}`)
        next(error)
    }
}
