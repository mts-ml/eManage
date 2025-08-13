import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { FaTrash, FaEdit } from 'react-icons/fa'

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type {
    Receivable,
    UpdateReceivableRequest,
    ApiResponse,
    DeleteResponse,
    AxiosErrorResponse,
    PaymentRecord
} from "../types/types"
import { PaymentStatus } from "../types/types"

type SortField = 'date' | 'saleNumber' | 'clientName' | 'total' | 'firstPaymentDate' | 'finalPaymentDate'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
    field: SortField
    order: SortOrder
}

interface EditFormData {
    status: PaymentStatus
    totalPaid: number
    remainingAmount: number
    firstPaymentDate: string
    finalPaymentDate: string
    bank: string
    observations: string
    payments: PaymentRecord[]
}

export const Receivables: React.FC = () => {
    const [receivables, setReceivables] = useState<Receivable[]>([])
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
    const [modifiedId, setModifiedId] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
    // Estado para edição inline
    const [editingSale, setEditingSale] = useState<Receivable | null>(null)
    const [editFormData, setEditFormData] = useState<EditFormData>({
        status: PaymentStatus.PENDING,
        totalPaid: 0,
        remainingAmount: 0,
        firstPaymentDate: "",
        finalPaymentDate: "",
        bank: "",
        observations: "",
        payments: []
    })
    const [editErrors, setEditErrors] = useState<Partial<Record<string, string>>>({})
    const [isSaving, setIsSaving] = useState(false)
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
                                 case 'firstPaymentDate':
                     aValue = a.firstPaymentDate ? new Date(a.firstPaymentDate) : new Date(0)
                     bValue = b.firstPaymentDate ? new Date(b.firstPaymentDate) : new Date(0)
                     break
                 case 'finalPaymentDate':
                     aValue = a.finalPaymentDate ? new Date(a.finalPaymentDate) : new Date(0)
                     bValue = b.finalPaymentDate ? new Date(b.finalPaymentDate) : new Date(0)
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

    function handleStatusChange(id: string, newStatus: "Em aberto" | "Parcialmente pago" | "Pago") {
        setReceivables(prev =>
            prev.map(sale =>
                sale._id === id
                    ? {
                        ...sale,
                        status: newStatus,
                        finalPaymentDate: newStatus === "Pago" ? new Date().toISOString() : null,
                        // Se mudou para "Pago", definir data do pagamento total
                        ...(newStatus === "Pago" && {
                            finalPaymentDate: new Date().toISOString(),
                            // Se não tem primeira data de pagamento, usar a data atual
                            firstPaymentDate: sale.firstPaymentDate || new Date().toISOString()
                        })
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

        // Calcular status automaticamente baseado no valor pago
        const calculatedStatus = calculateStatus(saleToSave.totalPaid || 0, saleToSave.total)
        const finalStatus = calculatedStatus === PaymentStatus.PAID ? saleToSave.status : calculatedStatus

        if (finalStatus === "Pago" && !saleToSave.bank.trim()) {
            setErrors(prev => ({ ...prev, [id]: "Informe o banco." }))
            return
        }

        // Definir datas automaticamente baseado no status
        const today = new Date().toISOString()
        let firstPaymentDate = saleToSave.firstPaymentDate
        let finalPaymentDate = saleToSave.finalPaymentDate

        if (finalStatus === "Pago") {
            finalPaymentDate = today
            if (!firstPaymentDate) {
                firstPaymentDate = today
            }
        } else if (finalStatus === "Parcialmente pago" && !firstPaymentDate) {
            firstPaymentDate = today
        }

        const updateData: UpdateReceivableRequest = {
            status: finalStatus,
            firstPaymentDate: firstPaymentDate,
            finalPaymentDate: finalPaymentDate,
            bank: saleToSave.bank,
            totalPaid: saleToSave.totalPaid || 0,
            remainingAmount: saleToSave.remainingAmount || saleToSave.total,
            observations: saleToSave.observations || '',
            payments: []
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

    // Função para iniciar edição inline
    const handleStartEdit = (sale: Receivable) => {
        const calculatedStatus = calculateStatus(sale.totalPaid || 0, sale.total)
        setEditingSale(sale)
        
        setEditFormData({
            status: calculatedStatus,
            totalPaid: sale.totalPaid || 0,
            remainingAmount: sale.remainingAmount || sale.total,
            firstPaymentDate: sale.firstPaymentDate || "",
            finalPaymentDate: calculatedStatus === "Pago" ? (sale.finalPaymentDate || "") : "",
            bank: sale.bank || "",
            observations: sale.observations || "",
            payments: []
        })
        setEditErrors({})
    }

    // Função para cancelar edição
    const handleCancelEdit = () => {
        setEditingSale(null)
        setEditFormData({
            status: PaymentStatus.PENDING,
            totalPaid: 0,
            remainingAmount: 0,
            firstPaymentDate: "",
            finalPaymentDate: "",
            bank: "",
            observations: "",
            payments: []
        })
        setEditErrors({})
    }

    // Função para calcular status automaticamente baseado no valor pago
    const calculateStatus = (totalPaid: number, total: number): PaymentStatus => {
        if (totalPaid === 0) return PaymentStatus.PENDING
        if (totalPaid >= total) return PaymentStatus.PAID
        return PaymentStatus.PARTIALLY_PAID
    }

    // Função para atualizar valor restante quando total pago mudar
    const handleTotalPaidChange = (value: number) => {
        if (editingSale) {
            const newStatus = calculateStatus(value, editingSale.total);
            const today = new Date().toISOString().split('T')[0];
            
            // Se o valor aumentou, definir data do primeiro pagamento se não existir
            if (value > 0 && !editFormData.firstPaymentDate) {
                setEditFormData(prev => ({
                    ...prev,
                    firstPaymentDate: today
                }));
            }
            
            // Se o valor atingiu o total, definir data do pagamento total
            if (value >= editingSale.total) {
                setEditFormData(prev => ({
                    ...prev,
                    finalPaymentDate: today
                }));
            } else {
                // Se o valor não atingiu o total, limpar a data do pagamento total
                setEditFormData(prev => ({
                    ...prev,
                    finalPaymentDate: ""
                }));
            }
            
            setEditFormData(prev => ({
                ...prev,
                totalPaid: value,
                remainingAmount: editingSale.total - value,
                status: newStatus
            }));
            
            // Atualizar também o status na tabela para refletir a mudança
            setReceivables(prev =>
                prev.map(sale =>
                    sale._id === editingSale._id
                        ? { 
                            ...sale, 
                            status: newStatus, 
                            totalPaid: value, 
                            remainingAmount: editingSale.total - value,
                            firstPaymentDate: value > 0 && !sale.firstPaymentDate ? today : sale.firstPaymentDate,
                            finalPaymentDate: value >= editingSale.total ? today : null
                        }
                        : sale
                )
            );
        }
    };



    // Função para validar formulário de edição
    const validateEditForm = (): boolean => {
        const errors: Partial<Record<string, string>> = {}

        if (!editFormData.bank || editFormData.bank.trim().length === 0) {
            errors.bank = "Banco é obrigatório"
        }

        if (editFormData.status === "Pago" && (!editFormData.finalPaymentDate || editFormData.finalPaymentDate.trim().length === 0)) {
            errors.finalPaymentDate = "Data do pagamento total é obrigatória quando status é Pago"
        }

        setEditErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Função para salvar edição
    const handleSaveEdit = async () => {
        if (!editingSale || !validateEditForm()) return

        setIsSaving(true)

        try {
            // Calcular status automaticamente baseado no valor pago
            const calculatedStatus = calculateStatus(editFormData.totalPaid, editingSale.total)
            const finalStatus = calculatedStatus === PaymentStatus.PAID ? editFormData.status : calculatedStatus

            const updateData: UpdateReceivableRequest = {
                status: finalStatus,
                totalPaid: editFormData.totalPaid,
                remainingAmount: editFormData.remainingAmount,
                firstPaymentDate: editFormData.firstPaymentDate ? new Date(editFormData.firstPaymentDate).toISOString() : null,
                finalPaymentDate: editFormData.finalPaymentDate ? new Date(editFormData.finalPaymentDate).toISOString() : null,
                bank: editFormData.bank,
                observations: editFormData.observations,
                payments: []
            }

            console.log("Dados sendo enviados:", updateData)
            console.log("ID da venda:", editingSale._id)

            await axiosPrivate.patch<ApiResponse<Receivable>>(
                `/receivables/${editingSale._id}`,
                updateData
            )

            // Atualizar a venda local
            const updatedSale = { ...editingSale, ...updateData }
            setReceivables(prev =>
                prev.map(sale =>
                    sale._id === updatedSale._id ? updatedSale : sale
                )
            )

            handleCancelEdit()
        } catch (error) {
            console.error("Erro ao atualizar venda:", error)

            // Log detalhado do erro
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as AxiosErrorResponse
                console.error("Status do erro:", axiosError.response?.status)
                console.error("Dados do erro:", axiosError.response?.data)
            }

            setEditErrors({ submit: "Erro ao atualizar venda. Tente novamente." })
        } finally {
            setIsSaving(false)
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
                                     onClick={() => handleSort('finalPaymentDate')}
                                     title="Clique para ordenar por data do pagamento total"
                                 >
                                     <div className="flex items-center justify-center gap-1">
                                         Pagamento Total
                                         <span className="text-xs">{getSortIcon('finalPaymentDate')}</span>
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
                                             className={`border-2 rounded-lg p-1 text-xs cursor-pointer transition-all duration-200 ${
                                                 sale.status === "Pago" ? "bg-green-50 text-green-700 border-green-400" 
                                                 : sale.status === "Parcialmente pago" ? "bg-yellow-50 text-yellow-700 border-yellow-400"
                                                 : "border-gray-200"
                                             }`}
                                             value={sale.status}
                                             onChange={e => handleStatusChange(sale._id, e.target.value as "Em aberto" | "Parcialmente pago" | "Pago")}
                                         >
                                             <option value="Em aberto">Em aberto</option>
                                             <option value="Parcialmente pago">Parcialmente pago</option>
                                             <option value="Pago">Pago</option>
                                         </select>
                                    </td>

                                     <td className="px-4 py-3 text-xs text-center">
                                         {sale.finalPaymentDate ? new Date(sale.finalPaymentDate).toLocaleDateString("pt-BR") : "--"}
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
                                        <section className="flex items-center">
                                            {/* Botão de editar */}
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(sale)}
                                                className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                title="Editar venda"
                                                aria-label="Editar venda"
                                            >
                                                <FaEdit size={18} />
                                            </button>

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
                                                     className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50/50 transition-all duration-200"
                                                     title="Excluir venda"
                                                     aria-label="Excluir venda"
                                                 >
                                                     <FaTrash size={18} />
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

            {/* Formulário de Edição Inline */}
            {editingSale && (
                <section className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto border-2 border-emerald-200/50">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">✏️ Editar Venda #{editingSale.saleNumber}</h2>
                                    <p className="text-emerald-100 mt-1">
                                        Cliente: {editingSale.clientName} | Total: {editingSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-white hover:text-emerald-200 transition-colors duration-200"
                                    aria-label="Fechar edição"
                                    title="Fechar edição"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-6 space-y-6">
                            {/* Informações da venda */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-emerald-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Data da Venda</p>

                                    <p className="font-semibold text-emerald-800">{editingSale.date}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">Número da Venda</p>

                                    <p className="font-semibold text-emerald-800">#{editingSale.saleNumber}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">Valor Total</p>

                                    <p className="font-semibold text-emerald-800">
                                        {editingSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>
                            </section>

                            {/* Configurações de pagamento */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                    💳 Configurações de Pagamento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status do Pagamento <span className="text-red-500">*</span>
                                        </label>

                                        <select
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as PaymentStatus }))}
                                            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                            aria-label="Status do pagamento"
                                            title="Status do pagamento"
                                        >
                                            <option value={PaymentStatus.PENDING}>Pendente</option>
                                            <option value={PaymentStatus.PARTIALLY_PAID}>Parcialmente Pago</option>
                                            <option value={PaymentStatus.PAID}>Pago</option>
                                        </select>
                                    </div>

                                                                         <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Valor Já Pago <span className="text-red-500">*</span>
                                         </label>

                                         <input
                                             type="number"
                                             step="0.01"
                                             min="0"
                                             max={editingSale.total}
                                             value={editFormData.totalPaid}
                                             onChange={(e) => {
                                                 const value = Number(e.target.value);
                                                 // Atualizar temporariamente para permitir digitação
                                                 setEditFormData(prev => ({
                                                     ...prev,
                                                     totalPaid: value,
                                                     remainingAmount: editingSale.total - value
                                                 }));
                                             }}
                                             onBlur={(e) => {
                                                 const value = Number(e.target.value);
                                                 const currentTotal = editFormData.payments.reduce((sum, payment) => sum + payment.amount, 0);
                                                 if (value !== currentTotal) {
                                                     handleTotalPaidChange(value);
                                                 }
                                             }}
                                             className="w-full border-2 border-green-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-green-50/30 text-green-800 placeholder-green-600/60"
                                             placeholder="0,00"
                                         />
                                         {editErrors.totalPaid && (
                                             <p className="text-red-500 text-sm mt-1">{editErrors.totalPaid}</p>
                                         )}
                                         <p className="text-green-600 text-sm mt-1 font-medium">
                                             {editFormData.totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                         </p>
                                     </div>

                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Valor Restante
                                         </label>
                                         <input
                                             type="number"
                                             value={editFormData.remainingAmount}
                                             disabled
                                             className="w-full border-2 border-red-200 rounded-lg p-3 bg-red-50/30 text-red-800"
                                             aria-label="Valor restante"
                                             title="Valor restante"
                                         />
                                         <p className="text-red-600 text-sm mt-1 font-medium">
                                             {editFormData.remainingAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                         </p>
                                     </div>
                                </div>


                            </section>

                            {/* Informações de pagamento */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                    📅 Informações de Pagamento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data do Pagamento Total <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="date"
                                            value={editFormData.finalPaymentDate}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, finalPaymentDate: e.target.value }))}
                                            disabled={editFormData.status !== "Pago"}
                                            className={`w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
                                                editFormData.status === "Pago" 
                                                    ? "bg-white" 
                                                    : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
                                            aria-label="Data do pagamento total"
                                            title="Data do pagamento total"
                                        />
                                        {editFormData.status === "Pago" && !editFormData.finalPaymentDate && (
                                            <p className="text-red-500 text-sm mt-1">Data do pagamento total é obrigatória quando status é Pago</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Banco <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="text"
                                            value={editFormData.bank}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, bank: e.target.value }))}
                                            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                            placeholder="Nome do banco"
                                            aria-label="Nome do banco"
                                            title="Nome do banco"
                                        />

                                        {editErrors.bank && (
                                            <p className="text-red-500 text-sm mt-1">{editErrors.bank}</p>
                                        )}
                                        {!editFormData.bank && (
                                            <p className="text-red-500 text-sm mt-1">Banco é obrigatório</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Observações
                                        </label>

                                        <textarea
                                            value={editFormData.observations}
                                            onChange={(e) => setEditFormData(prev => ({ ...prev, observations: e.target.value }))}
                                            rows={3}
                                            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                            placeholder="Observações sobre o pagamento..."
                                        />
                                    </div>
                                </div>


                            </section>



                            {/* Erro geral */}
                            {editErrors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-700 text-sm">{editErrors.submit}</p>
                                </div>
                            )}

                            {/* Botões */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Salvando...' : '💾 Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}


        </main>
    )
}
