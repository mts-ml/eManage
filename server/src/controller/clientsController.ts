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

        const duplicateEmail = await Client.findOne({ email: clientProps.email })
        if (duplicateEmail) {
            res.status(409).json({ message: "Email já cadastrado." })
            return
        }

        const duplicatecpfCnpj = await Client.findOne({ cpfCnpj: clientProps.cpfCnpj })
        if (duplicatecpfCnpj) {
            res.status(409).json({ message: "CPF/CNPJ já cadastrado." })
            return
        }

        const newClient = {
            name: clientProps.name,
            email: clientProps.email,
            phone: clientProps.phone,
            cpfCnpj: clientProps.cpfCnpj,
            address: clientProps.address,
            district: clientProps.district,
            city: clientProps.city,
            notes: clientProps.notes,
        }

        const createdClient = await Client.create(newClient)
        res.status(201).json({ createdClient })
    } catch (error) {
        console.error(`createNewClient error: ${JSON.stringify(error)}`)
        next(error)
    }
}

export async function updateClient(req: Request<{ id: string }, {}, ClientProps>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        const clientProps = req.body

        if (!id) {
            res.status(400).json({ message: "Id do cliente é obrigatório." })
            return
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
