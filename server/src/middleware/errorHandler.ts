import { NextFunction, Request, Response } from "express"


export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({ error: "JSON inválido no corpo da requisição." })
        return
    }

    next()
}
