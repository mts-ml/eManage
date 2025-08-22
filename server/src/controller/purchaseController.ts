import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Purchase } from "../model/Purchases.js"
import { PurchasePayload } from "../types/types.js"
import { getNextPurchaseNumber } from "../utils/utils.js"
import { Supplier } from "../model/Suppliers.js"
import { Product } from "../model/Products.js"
import { logError } from "../utils/logger.js"


export async function getAllPurchases(req: Request, res: Response, next: NextFunction) {
    try {
        const purchases = await Purchase.find({}).sort({ date: -1 })
        
        if (purchases.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(purchases)
    } catch (error) {
        logError("PurchaseController", `getAllPurchases error: ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function createNewPurchase(req: Request<{}, {}, Omit<PurchasePayload, "purchaseNumber">>, res: Response, next: NextFunction) {
    try {
        const purchaseProps = req.body

        const supplier = await Supplier.findById(purchaseProps.supplierId)
        
        const productIds = purchaseProps.items.map(item => new mongoose.Types.ObjectId(item.productId))
        
        const products = await Product.find({ _id: { $in: productIds } })

        const newPurchase = {
            ...purchaseProps,
            supplierId: purchaseProps.supplierId,
            supplierName: supplier?.name || "Fornecedor Desconhecido",
            purchaseNumber: await getNextPurchaseNumber(),
            totalPaid: 0,
            remainingAmount: purchaseProps.total,
            status: "Pendente",
            firstPaymentDate: null,
            finalPaymentDate: null,
            bank: "",
            observations: "",
            payments: [],
            items: purchaseProps.items.map(item => {
                const product = products.find(p => p._id.toString() === item.productId)
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
                const product = products.find(p => p._id.toString() === item.productId)

                if (product) {
                    product.stock += item.quantity
                    await product.save()
                }
            })
        )

        const updatedProducts = await Product.find({ _id: { $in: productIds } })

        res.status(201).json({
            purchase: createdPurchase,
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
        logError("PurchaseController", `createNewPurchase error: ${JSON.stringify(error)}`)
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
        logError("PurchaseController", `updatePurchase error: ${JSON.stringify(error)}`)
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
        const purchaseToDelete = await Purchase.findById(id)
        if (!purchaseToDelete) {
            res.status(404).json({ message: "Compra não encontrada." })
            return
        }

        const productIds = purchaseToDelete.items.map(item => item.productId)

        // Decrementar estoque dos produtos (reverter o incremento da compra)
        await Promise.all(
            purchaseToDelete.items.map(async item => {
                await Product.updateOne(
                    { _id: item.productId },
                    { $inc: { stock: -item.quantity } }
                )
            })
        )

        await Purchase.findByIdAndDelete(id)
        
        const updatedProducts = await Product.find({ _id: { $in: productIds } })
        
        res.json({ 
            message: `Compra cancelada e estoque ajustado com sucesso.`,
            updatedProducts: updatedProducts.map(product => ({
                id: product._id,
                name: product.name,
                stock: product.stock,
                salePrice: product.salePrice,
                purchasePrice: product.purchasePrice
            }))
        })
    } catch (error) {
        logError("PurchaseController - deletePurchase error", error)
        next(error)
    }
}

export async function getPurchasesHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const purchases = await Purchase.find({})
            .sort({ date: -1, purchaseNumber: -1 })
            .select('-__v')
        
        if (purchases.length === 0) {
            res.json([])
            return
        }

        res.json(purchases)
    } catch (error) {
        logError("PurchaseController", `getPurchasesHistory error: ${JSON.stringify(error)}`)
        next(error)
    }
}
