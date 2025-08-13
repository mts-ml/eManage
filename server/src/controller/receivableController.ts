import { Request, Response } from 'express'

import { Sale } from '../model/Sales.js'
import { TransactionUpdatePayload } from '../types/types.js'


export async function receivableController(req: Request<{ id: string }, {}, TransactionUpdatePayload>, res: Response) {
    try {
        const { id } = req.params
        const { 
            status, 
            firstPaymentDate, 
            finalPaymentDate, 
            bank, 
            totalPaid, 
            remainingAmount, 
            observations 
        } = req.body

        // Monta objeto para atualizar somente os campos que vieram (inclusive null para limpar)
        const updateFields: Partial<TransactionUpdatePayload> = {}

        if ('status' in req.body) updateFields.status = status
        if ('firstPaymentDate' in req.body) updateFields.firstPaymentDate = firstPaymentDate
        if ('finalPaymentDate' in req.body) updateFields.finalPaymentDate = finalPaymentDate
        if ('bank' in req.body) updateFields.bank = bank
        if ('totalPaid' in req.body) updateFields.totalPaid = totalPaid
        if ('remainingAmount' in req.body) updateFields.remainingAmount = remainingAmount
        if ('observations' in req.body) updateFields.observations = observations

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

export const updateReceivable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, totalPaid, remainingAmount, firstPaymentDate, finalPaymentDate, bank, observations, payments } = req.body;

    // Validar se a venda existe
    const sale = await Sale.findById(id);
    if (!sale) {
      res.status(404).json({ message: 'Venda não encontrada' });
      return;
    }

    // Preparar campos para atualização
    const updateFields: any = {};

    if (status !== undefined) updateFields.status = status;
    if (totalPaid !== undefined) updateFields.totalPaid = totalPaid;
    if (remainingAmount !== undefined) updateFields.remainingAmount = remainingAmount;
    if (firstPaymentDate !== undefined) updateFields.firstPaymentDate = firstPaymentDate;
    if (finalPaymentDate !== undefined) updateFields.finalPaymentDate = finalPaymentDate;
    if (bank !== undefined) updateFields.bank = bank;
    if (observations !== undefined) updateFields.observations = observations;
    if (payments !== undefined) updateFields.payments = payments;

    // Atualizar a venda
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedSale) {
      res.status(500).json({ message: 'Erro ao atualizar venda' });
      return;
    }

    res.json({
      message: 'Venda atualizada com sucesso',
      data: updatedSale
    });

  } catch (error) {
    console.error('Erro ao atualizar recebível:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
