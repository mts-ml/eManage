import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Sale } from "../model/Sales.js"
import { SalePayload } from "../types/types.js"
import { getNextSaleNumber } from "../utils/utils.js"
import { Client } from "../model/Clients.js"
import { Product } from "../model/Products.js"


export async function getAllSales(req: Request, res: Response, next: NextFunction) {
    try {
        const sales = await Sale.find()
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

        const client = await Client.findById(saleProps.clientId)
        const productIds = saleProps.items.map(item => new mongoose.Types.ObjectId(item.productId))
        const products = await Product.find({ _id: { $in: productIds } })

        const newSale = {
            ...saleProps,
            saleNumber: await getNextSaleNumber(),
            clientName: client?.name || "Cliente Desconhecido",
            items: saleProps.items.map(item => {
                const product = products.find(p => p.id === item.productId)
                return {
                    ...item,
                    productName: product?.name || "Produto Desconhecido"
                }
            })
        }
        const createdSale = await Sale.create(newSale)

        // Atualiza o estoque dos produtos
        await Promise.all(
            saleProps.items.map(async item => {
                const product = products.find(p => p.id === item.productId)

                if (product) {
                    product.stock -= item.quantity
                    await product.save()
                }
            })
        )

        res.status(201).json({
            sale: createdSale,
            updatedProducts: products.map(product => ({
                id: product.id,
                name: product.name,
                stock: product.stock,
                price: product.price
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
