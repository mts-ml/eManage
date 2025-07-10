import { NextFunction, Request, Response } from "express"


interface VerifyRolesProps extends Request {
    roles: number[]
}


export function verifyRoles(allowedRoles: number[]) {
    return (req: VerifyRolesProps, res: Response, next: NextFunction) => {
        if (!req.roles) {
            res.status(401).json({ message: "Usuário não autenticado"})
            return
        }

        const hasPermission = req.roles.some(role => allowedRoles.includes(role))
        if (!hasPermission) {
            res.status(403).json({ message: "Usuário não tem autorização para realizar essa ação." })
            return
        }
        next()
    }
}
