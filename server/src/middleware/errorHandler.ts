import { NextFunction, Request, Response } from "express"

import { logError } from "../utils/logger.js"


export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({ error: "JSON inválido no corpo da requisição." })
        return
    }

    logError("ErrorHandler", error.stack)

    res.status(500).json({ error: "Erro interno do servidor." })
}
