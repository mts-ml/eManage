import { Sale } from "../model/Sales.js";
import { ClientProps, Errors, ProductErrors, ProductProps } from "../types/types.js"


export function capitalizeWords(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .split(" ")
        .filter(word => word.trim() !== "")
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(" ")
}


// CPF AND CNPJ VALIDATION
export function isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (base: number) => {
        let sum = 0;
        for (let i = 0; i < base; i++) {
            sum += parseInt(cpf.charAt(i)) * (base + 1 - i);
        }
        const rest = 11 - (sum % 11);
        return rest >= 10 ? 0 : rest;
    };

    const digit1 = calcDigit(9);
    const digit2 = calcDigit(10);
    return digit1 === parseInt(cpf[9]) && digit2 === parseInt(cpf[10]);
}


export function isValidCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]+/g, "");
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcDigit = (length: number) => {
        const weights = length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        const numbers = cnpj.substring(0, length).split("").map(Number);
        const sum = numbers.reduce((acc, num, idx) => acc + num * weights[idx], 0);
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const digit1 = calcDigit(12);
    const digit2 = calcDigit(13);
    return digit1 === parseInt(cnpj[12]) && digit2 === parseInt(cnpj[13]);
}

// PHone validator
export function formatPhoneForDisplay(phone: string): string {
    // Se o telefone tiver 11 dígitos (DD + 9 dígitos), formata assim
    if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    // Se tiver 10 dígitos (DD + 8 dígitos), formata assim
    if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    // Caso não seja esperado, retorna o que recebeu
    return phone;
}

export function addError(errors: Errors, clientProps: keyof ClientProps, message: string): void {    
    errors[clientProps] = [...(errors[clientProps] || []), message]
}

export function addErrorProducts(errors: ProductErrors, productProps: keyof ProductProps, message: string): void {    
    errors[productProps] = message
}

export function isMissing(value: unknown): boolean {
    return typeof value !== 'string' || value.trim() === ""
}

export async function getNextSaleNumber(): Promise<number> {
    const lastSale = await Sale.findOne().sort({ saleNumber: -1 }).limit(1)
    return lastSale ? lastSale.saleNumber + 1 : 1
}
