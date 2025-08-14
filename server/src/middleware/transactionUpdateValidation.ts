import { NextFunction, Request, Response } from 'express'

import { TransactionUpdatePayload } from '../types/types.js'
import { rejectExtraFields } from '../utils/utils.js'


export const handleTransactionUpdateValidation = (req: Request, res: Response, next: NextFunction): void => {
  const { status, totalPaid, remainingAmount, firstPaymentDate, finalPaymentDate, bank, observations, payments } = req.body;
  
  const allowedFields = ['status', 'totalPaid', 'remainingAmount', 'firstPaymentDate', 'finalPaymentDate', 'bank', 'observations', 'payments'];
  
  const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    res.status(400).json({ message: `Campos não permitidos: ${invalidFields.join(', ')}` });
    return;
  }

  if (status !== undefined) {
    const validStatus = ['Pendente', 'Parcialmente pago', 'Pago']
    if (!validStatus.includes(status)) {
      res.status(400).json({ message: 'Status inválido' })
      return
    }
  }

  if (status === 'Pago') {
    if (finalPaymentDate === undefined || finalPaymentDate === null || finalPaymentDate === '') {
      res.status(400).json({ message: 'Data do pagamento total é obrigatória quando status é Pago' })
      return
    }
  }

  if (status === 'Pendente') {
    if (finalPaymentDate !== undefined && finalPaymentDate !== null && finalPaymentDate !== '') {
      res.status(400).json({ message: 'Data do pagamento total não deve ser definida quando status é Pendente' })
      return
    }
  }

  // Validação de datas
  if (firstPaymentDate !== undefined && firstPaymentDate !== null && firstPaymentDate !== '') {
    if (isNaN(Date.parse(firstPaymentDate))) {
      res.status(400).json({ message: 'Data do primeiro pagamento inválida' })
      return
    }
  }

  if (finalPaymentDate !== undefined && finalPaymentDate !== null && finalPaymentDate !== '') {
    if (isNaN(Date.parse(finalPaymentDate))) {
      res.status(400).json({ message: 'Data do pagamento total inválida' })
      return
    }
  }

  // Validação de pagamentos
  if (payments !== undefined) {
    if (!Array.isArray(payments)) {
      res.status(400).json({ message: 'Pagamentos deve ser um array' })
      return
    }
    
    for (const payment of payments) {
      if (typeof payment.amount !== 'number' || payment.amount <= 0) {
        res.status(400).json({ message: 'Valor do pagamento deve ser um número positivo' })
        return
      }
      if (typeof payment.paymentDate !== 'string' || isNaN(Date.parse(payment.paymentDate))) {
        res.status(400).json({ message: 'Data do pagamento inválida' })
        return
      }
    }
  }

  next()
}
