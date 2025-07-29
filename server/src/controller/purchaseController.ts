import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Purchase } from "../model/Purchases.js"
import { PurchasePayload } from "../types/types.js"
import { getNextPurchaseNumber } from "../utils/utils.js"
import { Client } from "../model/Clients.js"
import { Product } from "../model/Products.js"


export async function getAllPurchases(req: Request, res: Response, next: NextFunction) {
    try {
        const purchases = await Purchase.find()
        if (purchases.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(purchases)
    } catch (error) {
        console.error(`purchaseController - ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function createNewPurchase(req: Request<{}, {}, Omit<PurchasePayload, "purchaseNumber">>, res: Response, next: NextFunction) {
    try {
        const purchaseProps = req.body

        const client = await Client.findById(purchaseProps.clientId)
        const productIds = purchaseProps.items.map(item => new mongoose.Types.ObjectId(item.productId))
        const products = await Product.find({ _id: { $in: productIds } })

        const newPurchase = {
            ...purchaseProps,
            purchaseNumber: await getNextPurchaseNumber(),
            clientName: client?.name || "Cliente Desconhecido",
            status: "Em aberto",
            paymentDate: null,
            bank: "",
            items: purchaseProps.items.map(item => {
                const product = products.find(p => p.id === item.productId)
                return {
                    ...item,
                    productName: product?.name || "Produto Desconhecido"
                }
            })
        }
        const createdPurchase = await Purchase.create(newPurchase)

        // Atualiza o estoque dos produtos
        await Promise.all(
            purchaseProps.items.map(async item => {
                const product = products.find(p => p.id === item.productId)

                if (product) {
                    product.stock += item.quantity
                    await product.save()
                }
            })
        )

        res.status(201).json({
            purchase: createdPurchase,
            updatedProducts: products.map(product => ({
                id: product.id,
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

export async function updatePurchase(req: Request<{ id: string }, {}, Omit<PurchasePayload, "purchaseNumber">>, res: Response, next: NextFunction) {
    const { id } = req.params
    const purchaseProps = req.body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const updatedPurchase = await Purchase.findByIdAndUpdate(id, purchaseProps, {
            new: true,
            runValidators: true
        })

        if (!updatedPurchase) {
            res.status(404).json({ message: "Compra não encontrada." })
            return
        }

        res.json(updatedPurchase)
    } catch (error) {
        console.error(`Erro ao editar compra ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function deletePurchase(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const deletedPurchase = await Purchase.findByIdAndDelete(id)
        if (!deletedPurchase) {
            res.status(404).json({ message: "Compra não encontrada." })
            return
        }
        res.json({ message: `Compra deletada com sucesso.` })
    } catch (error) {
        console.error("Erro ao deletar compra", error)
        next(error)
    }
}
