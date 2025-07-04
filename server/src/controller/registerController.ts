import { Request, Response } from "express"
import bcrypt from 'bcrypt'

import { RegisterProps } from "../types/types.js"
import { User } from "../model/Users.js"


export async function registerController(req: Request<{}, {}, RegisterProps>, res: Response) {
    const { name, email, password } = req.body

    const duplicate = await User.findOne({ email })
    if (duplicate) {
        res.status(409).json({ message: "Email já cadastrado" })
        return
    }

    try {
        const hasPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            name,
            email,
            password: hasPassword
        })
        console.log(`registerController - Useuário criado - ${newUser}`)   
        
        res.status(201).json({ message: `Usuário ${newUser.name} criado com sucesso` })
    } catch (error) {
        console.log(error)        
        res.status(500).json({ message: "Erro interno no servidor." })
    }
}
