import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Supplier } from "../model/Suppliers.js"
import { SupplierProps } from "../types/types.js"
import { logError } from "../utils/logger.js"


export async function getAllSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
        const suppliers = await Supplier.find()
        if (suppliers.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(suppliers)
    } catch (error) {
        logError("SupplierController", error)
        next(error)
    }
}

export async function createNewSupplier(req: Request<{}, {}, SupplierProps>, res: Response, next: NextFunction) {
    try {
        const supplierProps = req.body

        const normalizedEmail = supplierProps.email.trim().toLowerCase()
        const duplicateEmail = await Supplier.findOne({ email: normalizedEmail })
        if (duplicateEmail) {
            res.status(409).json({ message: "Email já cadastrado." })
            return
        }

        supplierProps.cpfCnpj = supplierProps.cpfCnpj.replace(/\D/g, '')
        const duplicatecpfCnpj = await Supplier.findOne({ cpfCnpj: supplierProps.cpfCnpj })
        if (duplicatecpfCnpj) {
            res.status(409).json({ message: "CPF/CNPJ já cadastrado." })
            return
        }

        const createdSupplier = await Supplier.create(supplierProps)
        res.status(201).json(createdSupplier)
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
        logError("SupplierController", error)
        next(error)
    }
}

export async function updateSupplier(req: Request<{ id: string }, {}, SupplierProps>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const supplierProps = req.body

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Id inválido ou ausente." })
            return
        }

        if (supplierProps.cpfCnpj) {
            const cleanedCpfCnpj = supplierProps.cpfCnpj.replace(/\D/g, '')
            supplierProps.cpfCnpj = cleanedCpfCnpj
            const existingSupplier = await Supplier.findOne({ cpfCnpj: cleanedCpfCnpj })

            if (existingSupplier && existingSupplier._id.toString() !== id) {
                res.status(409).json({ message: "CPF/CNPJ já cadastrado." })
                return
            }
        }

        /*{
        "_id": "abc123",
        "name": "João",
        "email": "joao@email.com"
        }
      
        await Client.findByIdAndUpdate("abc123", { name: "Maria" }, { new: true })    */
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, supplierProps, {
            new: true, // Retorna o documento atualizado 
            runValidators: true // Garante que o schema do Mongoose valide os dados antes de salvar
        })

        if (!updatedSupplier) {
            res.status(404).json({ message: "Fornecedor não encontrado." })
            return
        }

        res.json(updatedSupplier)
    } catch (error) {
        logError("SupplierController", error)
        next(error)
    }
}

export async function deleteSupplier(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Id inválido ou ausente." })
            return
        }

        const deletedSupplier = await Supplier.findByIdAndDelete(id)
        if (!deletedSupplier) {
            res.status(404).json({ message: "Fornecedor não encontrado." })
            return
        }

        res.json({ message: `Fornecedor ${deletedSupplier.name} deletado com sucesso.` })
    } catch (error) {
        logError("SupplierController", error)
        next(error)
    }
}
