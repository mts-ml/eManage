import { NextFunction, Request, Response } from "express"

import { Product } from "../model/Products.js"
import { ProductProps } from "../types/types.js"
import mongoose from "mongoose"


export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
        const products = await Product.find()

        if (products.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(products)
    } catch (error) {
        console.error(`productsController - ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function createNewProduct(req: Request<{}, {}, ProductProps>, res: Response, next: NextFunction) {
    try {
        const productProps = req.body

        const duplicateProductName = await Product.findOne({ name: productProps.name })
        if (duplicateProductName) {
            res.status(409).json({ message: "Produto já cadastrado." })
            return
        }

        const createdProduct = await Product.create(productProps)
        res.status(201).json(createdProduct)
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

        console.error(`createNewProduct error: ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function updateProduct(req: Request<{ id: string }, {}, ProductProps>, res: Response, next: NextFunction) {
    const { id } = req.params
    const productProps = req.body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        /*{
              "_id": "abc123",
              "name": "Alho",
              }
            
              await Product.findByIdAndUpdate("abc123", { name: "Alho" }, { new: true })    */
        const updatedProduct = await Product.findByIdAndUpdate(id, productProps, {
            new: true, // Retorna o documento atualizado 
            runValidators: true // Garante que o schema do Mongoose valide os dados antes de salvar
        })

        if (!updatedProduct) {
            res.status(404).json({ message: "Produto não encontrado." })
            return
        }

        res.json(updatedProduct)
    } catch (error) {
        console.error(`Erro ao editar produto ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function deleteProduct(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const deleteProduct = await Product.findByIdAndDelete(id)
        if (!deleteProduct) {
            res.status(404).json({ message: "Produto não encontrado." })
            return
        }
        res.json({ message: `Produto - ${deleteProduct.name} deletado com sucesso.` })
    } catch (error) {
        console.error("Erro ao deletar produto", error)
        next(error)
    }
}
