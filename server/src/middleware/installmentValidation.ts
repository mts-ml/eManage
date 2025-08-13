import { NextFunction, Request, Response } from "express"

import { rejectExtraFields } from "../utils/utils.js"

// Interface para validação de pagamento
interface PaymentRequest {
    amount: number
    paymentDate: string
    bank?: string
    notes?: string
    paymentType: "Entrada" | "Parcela" | "Pagamento parcial"
    installmentId?: string
    [key: string]: unknown
}

// Interface para criação de parcelas
interface CreateInstallmentsRequest {
    numberOfInstallments: number
    firstDueDate: string
    installmentAmount?: number
    [key: string]: unknown
}

export function handlePaymentValidation(
    req: Request<{ saleId: string }, {}, PaymentRequest>,
    res: Response,
    next: NextFunction
) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    // Campos permitidos na requisição
    const allowedFields = ["amount", "paymentDate", "bank", "notes", "paymentType", "installmentId"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const { amount, paymentDate, bank, notes, paymentType, installmentId } = req.body
    const errors: Record<string, string[]> = {}

    // Validação do valor (obrigatório e deve ser positivo)
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
        errors.amount = ["Valor deve ser um número válido"]
    } else if (amount <= 0) {
        errors.amount = ["Valor deve ser maior que zero"]
    }

    // Validação da data de pagamento (obrigatória)
    if (!paymentDate || typeof paymentDate !== "string") {
        errors.paymentDate = ["Data de pagamento é obrigatória e deve ser uma string"]
    } else if (paymentDate.trim().length === 0) {
        errors.paymentDate = ["Data de pagamento não pode estar vazia"]
    }

    // Validação do banco (opcional, mas se fornecido deve ser string válida)
    if (bank !== undefined) {
        if (typeof bank !== "string") {
            errors.bank = ["Banco deve ser uma string"]
        } else if (bank.trim().length === 0) {
            errors.bank = ["Banco não pode estar vazio"]
        } else {
            // Trim do banco se for string válida
            req.body.bank = bank.trim()
        }
    }

    // Validação das notas (opcional, mas se fornecido deve ser string válida)
    if (notes !== undefined) {
        if (typeof notes !== "string") {
            errors.notes = ["Notas devem ser uma string"]
        } else if (notes.length > 500) {
            errors.notes = ["Notas não podem ter mais de 500 caracteres"]
        } else {
            req.body.notes = notes.trim()
        }
    }

    // Validação do tipo de pagamento (obrigatório)
    const validPaymentTypes = ["Entrada", "Parcela", "Pagamento parcial"]
    if (!paymentType || typeof paymentType !== "string") {
        errors.paymentType = ["Tipo de pagamento é obrigatório"]
    } else if (!validPaymentTypes.includes(paymentType)) {
        errors.paymentType = [`Tipo de pagamento deve ser um dos seguintes: ${validPaymentTypes.join(", ")}`]
    }

    // Validação do ID da parcela (opcional, mas se fornecido deve ser string válida)
    if (installmentId !== undefined) {
        if (typeof installmentId !== "string") {
            errors.installmentId = ["ID da parcela deve ser uma string"]
        } else if (installmentId.trim().length === 0) {
            errors.installmentId = ["ID da parcela não pode estar vazio"]
        }
    }

    // Se houver erros, retorna com status 400
    if (Object.keys(errors).length > 0) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}

// Middleware para validação de criação de parcelas
export function handleCreateInstallmentsValidation(
    req: Request<{ saleId: string }, {}, CreateInstallmentsRequest>,
    res: Response,
    next: NextFunction
) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    // Campos permitidos na requisição
    const allowedFields = ["numberOfInstallments", "firstDueDate", "installmentAmount"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const { numberOfInstallments, firstDueDate, installmentAmount } = req.body
    const errors: Record<string, string[]> = {}

    // Validação do número de parcelas (obrigatório, mínimo 2)
    if (typeof numberOfInstallments !== "number" || !Number.isInteger(numberOfInstallments)) {
        errors.numberOfInstallments = ["Número de parcelas deve ser um número inteiro"]
    } else if (numberOfInstallments < 2) {
        errors.numberOfInstallments = ["Número de parcelas deve ser pelo menos 2"]
    }

    // Validação da data de vencimento da primeira parcela (obrigatória)
    if (!firstDueDate || typeof firstDueDate !== "string") {
        errors.firstDueDate = ["Data de vencimento da primeira parcela é obrigatória e deve ser uma string"]
    } else if (firstDueDate.trim().length === 0) {
        errors.firstDueDate = ["Data de vencimento da primeira parcela não pode estar vazia"]
    }

    // Validação do valor da parcela (opcional, mas se fornecido deve ser positivo)
    if (installmentAmount !== undefined) {
        if (typeof installmentAmount !== "number" || !Number.isFinite(installmentAmount)) {
            errors.installmentAmount = ["Valor da parcela deve ser um número válido"]
        } else if (installmentAmount <= 0) {
            errors.installmentAmount = ["Valor da parcela deve ser maior que zero"]
        }
    }

    // Se houver erros, retorna com status 400
    if (Object.keys(errors).length > 0) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}

export function handleInstallmentUpdateValidation(
    req: Request<{ saleId: string, installmentId: string }, {}, Partial<PaymentRequest>>,
    res: Response,
    next: NextFunction
) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    // Campos permitidos na requisição
    const allowedFields = ["amount", "paymentDate", "bank", "notes", "paymentType", "installmentId"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const { amount, paymentDate, bank, notes, paymentType, installmentId } = req.body

    // Verificar se pelo menos um campo foi fornecido para atualização
    if (amount === undefined && paymentDate === undefined && bank === undefined && 
        notes === undefined && paymentType === undefined && installmentId === undefined) {
        res.status(400).json({ 
            message: "Pelo menos um dos campos deve ser fornecido para atualização." 
        })
        return
    }

    const errors: Record<string, string[]> = {}

    // Validações dos campos fornecidos (mesma lógica do handlePaymentValidation)
    if (amount !== undefined) {
        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            errors.amount = ["Valor deve ser um número válido"]
        } else if (amount <= 0) {
            errors.amount = ["Valor deve ser maior que zero"]
        }
    }

    if (paymentDate !== undefined) {
        if (typeof paymentDate !== "string") {
            errors.paymentDate = ["Data de pagamento deve ser uma string"]
        } else if (paymentDate.trim().length === 0) {
            errors.paymentDate = ["Data de pagamento não pode estar vazia"]
        }
    }

    if (bank !== undefined) {
        if (typeof bank !== "string") {
            errors.bank = ["Banco deve ser uma string"]
        } else if (bank.trim().length === 0) {
            errors.bank = ["Banco não pode estar vazio"]
        } else {
            req.body.bank = bank.trim()
        }
    }

    if (notes !== undefined) {
        if (typeof notes !== "string") {
            errors.notes = ["Notas devem ser uma string"]
        } else if (notes.length > 500) {
            errors.notes = ["Notas não podem ter mais de 500 caracteres"]
        } else {
            req.body.notes = notes.trim()
        }
    }

    if (paymentType !== undefined) {
        const validPaymentTypes = ["Entrada", "Parcela", "Pagamento parcial"]
        if (typeof paymentType !== "string") {
            errors.paymentType = ["Tipo de pagamento deve ser uma string"]
        } else if (!validPaymentTypes.includes(paymentType)) {
            errors.paymentType = [`Tipo de pagamento deve ser um dos seguintes: ${validPaymentTypes.join(", ")}`]
        }
    }

    if (installmentId !== undefined) {
        if (typeof installmentId !== "string") {
            errors.installmentId = ["ID da parcela deve ser uma string"]
        } else if (installmentId.trim().length === 0) {
            errors.installmentId = ["ID da parcela não pode estar vazio"]
        }
    }

    // Se houver erros, retorna com status 400
    if (Object.keys(errors).length > 0) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
