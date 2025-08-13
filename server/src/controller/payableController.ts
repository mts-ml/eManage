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

export const updatePayable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, bank } = req.body;

        // Validar se a compra existe
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            res.status(404).json({ message: 'Compra não encontrada' });
            return;
        }

        // Preparar campos para atualização
        const updateFields: Partial<TransactionUpdatePayload> = {};

        if (status !== undefined) updateFields.status = status;
        if (bank !== undefined) updateFields.bank = bank;

        // Atualizar a compra
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedPurchase) {
            res.status(500).json({ message: 'Erro ao atualizar compra' });
            return;
        }

        res.json({
            message: 'Compra atualizada com sucesso',
            data: updatedPurchase
        });

    } catch (error) {
        console.error('Erro ao atualizar compra:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
