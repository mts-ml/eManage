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
        <main className="p-8 max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    💰 Contas a Receber
                </h2>
                <p className="text-gray-600 font-medium">Gerencie seus recebimentos financeiros</p>
            </div>

            <div className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Data da Venda</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Nº Venda</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Cliente</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center min-w-[200px]">Produto(s)</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Valor Total</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Data Pagamento</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Banco</th>
                            <th className="px-4 py-3 text-xs font-semibold text-center">Ações</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-100">
                        {receivables.map(sale => (
                            <tr key={sale._id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                <td className="px-4 py-3 text-xs font-medium text-center">{sale.date}</td>

                                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">#{sale.saleNumber}</td>

                                <td className="px-4 py-3 text-xs text-center">{sale.clientName}</td>

                                <td className="px-4 py-3 text-xs text-left min-w-[200px]">
                                    <ul className="space-y-1">
                                        {sale.items.map(item => {
                                            const product = products.find(p => p.id === item.productId)
                                            return (
                                                <li key={item.productId} className="text-gray-700 whitespace-nowrap">
                                                    <span className="font-medium">{item.productName}</span> - 
                                                    <span className="text-emerald-600 font-semibold"> R${item.price}</span> - 
                                                    <span className="text-gray-600">{item.quantity}(x)</span>
                                                    {product?.description && (
                                                        <span className="text-gray-500 text-xs ml-1">• {product.description}</span>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </td>

                                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                    {sale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                    <select
                                        aria-label="Sale status"
                                        className={`border-2 rounded-lg p-1 text-xs cursor-pointer transition-all duration-200 ${sale.status === "Pago" ? "bg-green-50 text-green-700 border-green-400" : "border-gray-200"}`}
                                        value={sale.status}
                                        onChange={e => handleStatusChange(sale._id, e.target.value as "Em aberto" | "Pago")}
                                    >
                                        <option value="Em aberto">Em aberto</option>
                                        <option value="Pago">Pago</option>
                                    </select>
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                    {sale.paymentDate ? new Date(sale.paymentDate).toLocaleDateString("pt-BR") : "--"}
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                    <input
                                        type="text"
                                        value={sale.bank}
                                        onChange={e => handleBankChange(sale._id, e.target.value)}
                                        placeholder="Banco"
                                        className="border-2 border-gray-200 rounded-lg p-1 w-full text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                    />

                                    {errors[sale._id] && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors[sale._id]}
                                        </p>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                    {modifiedId === sale._id && (
                                        <button
                                            type="button"
                                            onClick={() => handleSave(sale._id)}
                                            className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-3 py-1 rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            💾 Salvar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    )
}
