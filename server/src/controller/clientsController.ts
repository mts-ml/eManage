import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Client } from "../model/Clients.js"
import { ClientProps } from "../types/types.js"


export async function getAllClients(req: Request, res: Response, next: NextFunction) {
    try {
        const clients = await Client.find()
        if (clients.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(clients)
    } catch (error) {
        console.error(`clientsController - ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function createNewClient(req: Request<{}, {}, ClientProps>, res: Response, next: NextFunction) {
    try {
        const clientProps = req.body

        const normalizedEmail = clientProps.email.trim().toLowerCase()
        const duplicateEmail = await Client.findOne({ email: normalizedEmail })
        if (duplicateEmail) {
            res.status(409).json({ message: "Email já cadastrado." })
            return
        }

        clientProps.cpfCnpj = clientProps.cpfCnpj.replace(/\D/g, '')
        const duplicatecpfCnpj = await Client.findOne({ cpfCnpj: clientProps.cpfCnpj })
        if (duplicatecpfCnpj) {
            res.status(409).json({ message: "CPF/CNPJ já cadastrado." })
            return
        }

        const createdClient = await Client.create(clientProps)
        res.status(201).json(createdClient)
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
        console.error(`createNewClient error: ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function updateClient(req: Request<{ id: string }, {}, ClientProps>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const clientProps = req.body

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Id inválido ou ausente." })
            return
        }

        if (clientProps.cpfCnpj) {
            const cleanedCpfCnpj = clientProps.cpfCnpj.replace(/\D/g, '')
            clientProps.cpfCnpj = cleanedCpfCnpj
            const existingClient = await Client.findOne({ cpfCnpj: cleanedCpfCnpj })

            if (existingClient && existingClient._id.toString() !== id) {
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
        const updatedClient = await Client.findByIdAndUpdate(id, clientProps, {
            new: true, // Retorna o documento atualizado 
            runValidators: true // Garante que o schema do Mongoose valide os dados antes de salvar
        })

        if (!updatedClient) {
            res.status(404).json({ message: "Cliente não encontrado." })
            return
        }

        res.json(updatedClient)
    } catch (error) {
        console.error(`Erro ao editar cliente ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function deleteClient(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "Id inválido ou ausente." })
            return
        }

        const deletedClient = await Client.findByIdAndDelete(id)
        if (!deletedClient) {
            res.status(404).json({ message: "Cliente não encontrado." })
            return
        }

        res.json({ message: `Cliente ${deletedClient.name} deletado com sucesso.` })
    } catch (error) {
        console.error("Erro ao deletar cliente", error)
        next(error)
    }
}
