import { useContext, useEffect, useState } from "react"

import ProductsContext from "../Context/ProductsContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { ItemPayload } from "../types/types"


interface Receivable extends ItemPayload {
    _id: string
    saleNumber: number
    status: "Em aberto" | "Pago"
    paymentDate: string | null
    bank: string
}


export const Receivables: React.FC = () => {
    const [receivables, setReceivables] = useState<Receivable[]>([])
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
    const [modifiedId, setModifiedId] = useState<string | null>(null)
    const { products } = useContext(ProductsContext)
    const axiosPrivate = useAxiosPrivate()

    useEffect(() => {
        async function fetchSales() {
            try {
                const response = await axiosPrivate.get("/sales")
                const salesWithReceivableInfo: Receivable[] = response.data.map((sale: Receivable) => ({
                    ...sale,
                    status: sale.status || "Em aberto",
                    paymentDate: sale.paymentDate || null,
                    bank: sale.bank || ""
                }))
                setReceivables(salesWithReceivableInfo)
            } catch (error) {
                console.error("Erro ao buscar vendas:", error)
            }
        }
        fetchSales()
    }, [axiosPrivate])

    function handleStatusChange(id: string, newStatus: "Em aberto" | "Pago") {
        setReceivables(prev =>
            prev.map(sale =>
                sale._id === id
                    ? {
                        ...sale,
                        status: newStatus,
                        paymentDate: newStatus === "Pago" ? new Date().toISOString() : null
                    }
                    : sale
            )
        )
        setModifiedId(id)
    }

    function handleBankChange(id: string, bank: string) {
        setReceivables(prev =>
            prev.map(sale => (sale._id === id ? { ...sale, bank } : sale))
        )

        setModifiedId(id)
    }

    async function handleSave(id: string) {
        const saleToSave = receivables.find(sale => sale._id === id)
        if (!saleToSave) return

        if (saleToSave.status === "Pago" && !saleToSave.bank.trim()) {
            setErrors(prev => ({ ...prev, [id]: "Informe o banco." }))
            return
        }

        try {
            await axiosPrivate.patch(`/receivables/${id}`, {
                status: saleToSave.status,
                paymentDate: saleToSave.paymentDate,
                bank: saleToSave.bank
            })

            setErrors(prev => {
                const copy = { ...prev }
                delete copy[id]
                return copy
            })

            setModifiedId(null)
        } catch (error) {
            setErrors(prev => ({ ...prev, [id]: "Erro ao atualizar recebível" }))
            console.error("Erro ao atualizar recebível:", error)
        }
    }


    return (
        <main className="p-6 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4 text-emerald-700">Contas a Receber</h2>

            <table className="min-w-full bg-white border border-emerald-300 text-sm">
                <thead className="bg-emerald-50 text-emerald-700">
                    <tr>
                        <th className="p-2 border">Data da Compra</th>
                        <th className="p-2 border">Nº Venda</th>
                        <th className="p-2 border">Cliente</th>
                        <th className="p-2 border">Produto(s)</th>
                        <th className="p-2 border">Valor Total</th>
                        <th className="p-2 border">Status</th>
                        <th className="p-2 border">Data Pagamento</th>
                        <th className="p-2 border">Banco</th>
                        <th className="p-2 border">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    {receivables.map(sale => (
                        <tr key={sale._id} className="text-center text-gray-800">
                            <td className="p-2 border">{sale.date}</td>

                            <td className="p-2 border">{sale.saleNumber}</td>

                            <td className="p-2 border">{sale.clientName}</td>

                            <td className="p-2 border text-left">
                                <ul className="space-y-2">
                                    {sale.items.map(item => {
                                        const product = products.find(p => p.id === item.productId)
                                        return (
                                            <li key={item.productId}>
                                                {item.productName} - R${item.price} - {item.quantity}(x)
                                                {product?.description ? ` - ${product.description}` : ""}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </td>

                            <td className="p-2 border">
                                {sale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </td>

                            <td className="p-2 border">
                                <select
                                    aria-label="Sale status"
                                    className={`border rounded p-1 text-sm cursor-pointer ${sale.status === "Pago" ? "bg-green-100 text-green-700 border-green-400" : ""
                                        }`}
                                    value={sale.status}
                                    onChange={e => handleStatusChange(sale._id, e.target.value as "Em aberto" | "Pago")}
                                >
                                    <option value="Em aberto">Em aberto</option>
                                    <option value="Pago">Pago</option>
                                </select>
                            </td>

                            <td className="p-2 border">
                                {sale.paymentDate ? new Date(sale.paymentDate).toLocaleDateString("pt-BR") : "--"}
                            </td>

                            <td className="p-2 border">
                                <input
                                    type="text"
                                    value={sale.bank}
                                    onChange={e => handleBankChange(sale._id, e.target.value)}
                                    placeholder="Banco"
                                    className="border rounded p-1 w-full text-sm"
                                />

                                {errors[sale._id] && (
                                    <p className="text-red-600 text-xs mt-1">{errors[sale._id]}</p>
                                )}
                            </td>

                            <td className="p-2 border">
                                {modifiedId === sale._id && (
                                    <button
                                        type="button"
                                        onClick={() => handleSave(sale._id)}
                                        className="bg-emerald-600 cursor-pointer text-white px-2 py-1 rounded text-sm hover:bg-emerald-700"
                                    >
                                        Salvar
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    )
}
