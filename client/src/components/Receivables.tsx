import { useEffect, useState } from "react"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type {
    Receivable,
    UpdateReceivableRequest,
    ApiResponse,
    DeleteResponse,
    AxiosErrorResponse
} from "../types/types"

type SortField = 'date' | 'saleNumber' | 'clientName' | 'total' | 'paymentDate'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
    field: SortField
    order: SortOrder
}

export const Receivables: React.FC = () => {
    const [receivables, setReceivables] = useState<Receivable[]>([])
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
    const [modifiedId, setModifiedId] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
    const axiosPrivate = useAxiosPrivate()

    // Função para converter data do formato DD/MM/AAAA para objeto Date
    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    // Função para ordenar os recebíveis
    const sortReceivables = (data: Receivable[], config: SortConfig): Receivable[] => {
        return [...data].sort((a, b) => {
            let aValue: string | number | Date
            let bValue: string | number | Date

            switch (config.field) {
                case 'date':
                    aValue = parseDate(a.date)
                    bValue = parseDate(b.date)
                    break
                case 'saleNumber':
                    aValue = a.saleNumber
                    bValue = b.saleNumber
                    break
                case 'clientName':
                    aValue = a.clientName.toLowerCase()
                    bValue = b.clientName.toLowerCase()
                    break
                case 'total':
                    aValue = a.total
                    bValue = b.total
                    break
                case 'paymentDate':
                    aValue = a.paymentDate ? new Date(a.paymentDate) : new Date(0)
                    bValue = b.paymentDate ? new Date(b.paymentDate) : new Date(0)
                    break
                default:
                    return 0
            }

            if (aValue < bValue) {
                return config.order === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return config.order === 'asc' ? 1 : -1
            }
            return 0
        })
    }

    // Função para lidar com o clique no cabeçalho da coluna
    const handleSort = (field: SortField) => {
        setSortConfig(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }))
    }

    // Função para obter o ícone de ordenação
    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) {
            return '↕️'
        }
        return sortConfig.order === 'asc' ? '↑' : '↓'
    }

    // Recebíveis ordenados
    const sortedReceivables = sortReceivables(receivables, sortConfig)

    useEffect(() => {
        async function fetchSales() {
            try {
                const response = await axiosPrivate.get<Receivable[]>("/sales")
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

    async function handleSave(id: string): Promise<void> {
        const saleToSave = receivables.find(sale => sale._id === id)
        if (!saleToSave) return

        if (saleToSave.status === "Pago" && !saleToSave.bank.trim()) {
            setErrors(prev => ({ ...prev, [id]: "Informe o banco." }))
            return
        }

        const updateData: UpdateReceivableRequest = {
            status: saleToSave.status,
            paymentDate: saleToSave.paymentDate,
            bank: saleToSave.bank
        }

        try {
            await axiosPrivate.patch<ApiResponse<Receivable>>(`/receivables/${id}`, updateData)

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

    async function handleDeleteSale(id: string): Promise<void> {
        const saleToDelete = receivables.find(sale => sale._id === id)
        if (!saleToDelete) return

        if (saleToDelete.status === "Pago") {
            return
        }

        const confirmed = window.confirm(
            `Tem certeza que deseja excluir a venda #${saleToDelete.saleNumber}?\n\nEsta ação não pode ser desfeita.`
        )

        if (!confirmed) return

        try {
            const response = await axiosPrivate.delete<DeleteResponse>(`/sales/${id}`)
            setReceivables(prev => prev.filter(sale => sale._id !== id))
            console.log("Venda excluída com sucesso:", response.data.message)
        } catch (error: unknown) {
            console.error("Erro ao excluir venda:", error)

            let errorMessage = "Erro ao excluir venda. Tente novamente."

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as AxiosErrorResponse

                if (axiosError.response?.status === 404) {
                    errorMessage = "Venda não encontrada."
                } else if (axiosError.response?.status === 400) {
                    errorMessage = "Dados inválidos para exclusão."
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message
                }
            }

            alert(errorMessage)
        }
    }

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    💰 Contas a Receber
                </h1>

                <p className="text-gray-600 font-medium">Gerencie seus recebimentos financeiros</p>
            </header>

            {sortedReceivables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-emerald-200/50 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma conta a receber encontrada</h3>

                    <p className="text-gray-500 text-center max-w-md">
                        Não há vendas registradas no sistema.
                    </p>
                </div>
            ) : (
                <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                            <tr>
                                <th 
                                    className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('date')}
                                    title="Clique para ordenar por data da venda"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Data da Venda
                                        <span className="text-xs">{getSortIcon('date')}</span>
                                    </div>
                                </th>
                                                             <th 
                                 className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('saleNumber')}
                                 title="Clique para ordenar por número da venda"
                             >
                                 <div className="flex items-center justify-center gap-1">
                                     Nº Venda
                                     <span className="text-xs">{getSortIcon('saleNumber')}</span>
                                 </div>
                             </th>
                                <th 
                                    className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('clientName')}
                                    title="Clique para ordenar por cliente"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Cliente
                                        <span className="text-xs">{getSortIcon('clientName')}</span>
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('total')}
                                    title="Clique para ordenar por valor total"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Valor Total
                                        <span className="text-xs">{getSortIcon('total')}</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Status</th>
                                <th 
                                    className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('paymentDate')}
                                    title="Clique para ordenar por data de pagamento"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Data Pagamento
                                        <span className="text-xs">{getSortIcon('paymentDate')}</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Banco</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Ações</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                            {sortedReceivables.map(sale => (
                                <tr key={sale._id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-medium text-center">{sale.date}</td>

                                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">#{sale.saleNumber}</td>

                                    <td className="px-4 py-3 text-xs text-center">{sale.clientName}</td>

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
                                        <section className="flex flex-col gap-1 items-center">
                                            {modifiedId === sale._id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSave(sale._id)}
                                                    className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-3 py-1 rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                >
                                                    💾 Salvar
                                                </button>
                                            )}

                                            {sale.status === "Em aberto" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSale(sale._id)}
                                                    className="text-red-500 hover:text-red-700 cursor-pointer text-lg font-bold transition-colors duration-200"
                                                    title="Excluir venda"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </section>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </main>
    )
}
