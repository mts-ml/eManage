import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Sale } from "../model/Sales.js"
import { SalePayload, PaymentStatus } from "../types/types.js"
import { getNextSaleNumber } from "../utils/utils.js"
import { Product } from "../model/Products.js"


export async function getAllSales(req: Request, res: Response, next: NextFunction) {
    try {
        const sales = await Sale.find({}).sort({ date: -1 })

        if (sales.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(sales)
    } catch (error) {
        console.error(`saleController - ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function createNewSale(req: Request<{}, {}, Omit<SalePayload, "saleNumber">>, res: Response, next: NextFunction) {
    try {
        const saleProps = req.body

        // Buscar produtos para obter nomes
        const productIds = saleProps.items.map(item => item.productId)
        const products = await Product.find({ _id: { $in: productIds } })

        // Verificar se há estoque suficiente
        const insufficientStock = saleProps.items.some(item => {
            const product = products.find(p => p._id.toString() === item.productId)

            return !product || product.stock < item.quantity
        })

        if (insufficientStock) {
            res.status(400).json({
                message: "Estoque insuficiente para um ou mais produtos"
            })
            return
        }

        const saleNumber = await getNextSaleNumber()

        // Criar nova venda
        const newSale = new Sale({
            saleNumber: saleNumber,
            clientName: saleProps.clientName,
            clientId: saleProps.clientId,
            date: saleProps.date,
            items: saleProps.items.map(item => {
                const product = products.find(p => p._id.toString() === item.productId)
                return {
                    ...item,
                    productName: product?.name || "Produto Desconhecido"
                }
            }),
            total: saleProps.total,
            status: saleProps.status || PaymentStatus.PENDING,
            totalPaid: saleProps.totalPaid || 0,
            remainingAmount: saleProps.remainingAmount || saleProps.total,
            firstPaymentDate: saleProps.firstPaymentDate || null,
            finalPaymentDate: saleProps.finalPaymentDate || null,
            bank: saleProps.bank || '',
            observations: saleProps.observations || '',
            payments: saleProps.payments || []
        });

        const createdSale = await Sale.create(newSale)

        // Atualiza o estoque dos produtos
        await Promise.all(
            saleProps.items.map(async item => {
                const result = await Product.updateOne(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } }
                )

                if (result.matchedCount === 0) {
                    throw new Error(`Estoque insuficiente para produto ${item.productName}`)
                }
            })
        )

        const updatedProducts = await Product.find({ _id: { $in: productIds } })

        res.status(201).json({
            sale: createdSale,
            updatedProducts: updatedProducts.map(product => ({
                id: product._id,
                name: product.name,
                stock: product.stock,
                salePrice: product.salePrice,
                purchasePrice: product.purchasePrice
            }))
        })
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as any).code === 11000
        ) {
            res.status(409).json({ message: "Registro já existe." })
            return
        }
        console.error(`createNewSale error: ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function updateSale(req: Request<{ id: string }, {}, Omit<SalePayload, "SaleNumber">>, res: Response, next: NextFunction) {
    const { id } = req.params
    const saleProps = req.body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const updatedSale = await Sale.findByIdAndUpdate(id, saleProps, {
            new: true,
            runValidators: true
        })

        if (!updatedSale) {
            res.status(404).json({ message: "Venda não encontrada." })
            return
        }

        res.json(updatedSale)
    } catch (error) {
        console.error(`Erro ao editar venda ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function deleteSale(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const deletedSale = await Sale.findByIdAndDelete(id)
        if (!deletedSale) {
            res.status(404).json({ message: "Venda não encontrada." })
            return
        }
        res.json({ message: `Venda deletada com sucesso.` })
    } catch (error) {
        console.error("Erro ao deletar venda", error)
        next(error)
    }
}

export async function getSalesHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const sales = await Sale.find({})
            .sort({ date: -1, saleNumber: -1 })
            .select('-__v')

        if (sales.length === 0) {
            res.json([])
            return
        }

        res.json(sales)
    } catch (error) {
        console.error(`getSalesHistory error: ${JSON.stringify(error)}`)
        next(error)
    }
}
