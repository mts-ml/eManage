import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { FaTrash, FaEdit } from 'react-icons/fa'

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import { logInfo, logError } from "../utils/logger"


import type {
    Payable,
    UpdatePayableRequest,
    ApiResponse,
    DeleteResponse,
    AxiosErrorResponse,
    PaymentRecord
} from "../types/types"

import { PaymentStatus } from "../types/types"


type SortField = 'date' | 'purchaseNumber' | 'supplierName' | 'total' | 'status' | 'firstPaymentDate' | 'finalPaymentDate'

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


export const Payables: React.FC = () => {
    const [payables, setPayables] = useState<Payable[]>([])
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
    const [editingPurchase, setEditingPurchase] = useState<Payable | null>(null)
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
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20


    // Função para converter data do formato DD/MM/AAAA para objeto Date
    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }

    // Função para ordenar os pagáveis
    const sortPayables = (data: Payable[], config: SortConfig): Payable[] => {
        // Ordem lógica para status: Pendente → Parcialmente pago → Pago
        const statusOrder = { 'Pendente': 1, 'Parcialmente pago': 2, 'Pago': 3 }
        
        return [...data].sort((a, b) => {
            let aValue: string | number | Date
            let bValue: string | number | Date

            switch (config.field) {
                case 'date':
                    aValue = parseDate(a.date)
                    bValue = parseDate(b.date)
                    break
                case 'purchaseNumber':
                    aValue = a.purchaseNumber
                    bValue = b.purchaseNumber
                    break
                case 'supplierName':
                    aValue = a.supplierName.toLowerCase()
                    bValue = b.supplierName.toLowerCase()
                    break
                case 'total':
                    aValue = a.total
                    bValue = b.total
                    break
                case 'status':
                    aValue = statusOrder[a.status as keyof typeof statusOrder] || 1
                    bValue = statusOrder[b.status as keyof typeof statusOrder] || 1
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
            return '⇅'
        }
        return sortConfig.order === 'asc' ? '⇧' : '⇩'
    }

    // Pagáveis ordenados
    const sortedPayables = sortPayables(payables, sortConfig)

    // Cálculos de paginação para pagáveis ordenados
    const totalItems = sortedPayables.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const currentItems = sortedPayables.slice(startIndex, startIndex + pageSize)

    // Ajustar página atual quando o total mudar
    useEffect(() => {
        setCurrentPage(prev => {
            const pages = Math.max(1, Math.ceil(totalItems / pageSize))
            return Math.min(prev, pages)
        })
    }, [totalItems])

    useEffect(() => {
        async function fetchPurchases() {
            try {
                const response = await axiosPrivate.get<Payable[]>("/purchases")

                const purchasesWithPayableInfo: Payable[] = response.data.map((purchase: Payable) => ({
                    ...purchase,
                    status: purchase.status || "Pendente",
                    totalPaid: purchase.totalPaid || 0,
                    remainingAmount: purchase.remainingAmount || purchase.total,
                    firstPaymentDate: purchase.firstPaymentDate || null,
                    finalPaymentDate: purchase.finalPaymentDate || null,
                    bank: purchase.bank || "",
                    observations: purchase.observations || ""
                }))

                setPayables(purchasesWithPayableInfo)
            } catch (error) {
                logError("Payables", error);
            }
        }

        fetchPurchases()
    }, [axiosPrivate])

    // Função para iniciar edição no modal
    const handleStartEdit = (purchase: Payable) => {
        const calculatedStatus = calculateStatus(purchase.totalPaid || 0, purchase.total)
        setEditingPurchase(purchase)

        setEditFormData({
            status: calculatedStatus,
            totalPaid: purchase.totalPaid || 0,
            remainingAmount: purchase.remainingAmount || purchase.total,
            firstPaymentDate: purchase.firstPaymentDate || "",
            finalPaymentDate: calculatedStatus === "Pago" ? (purchase.finalPaymentDate || "") : "",
            bank: purchase.bank || "",
            observations: purchase.observations || "",
            payments: []
        })
        setEditErrors({})
    }

    // Função para cancelar edição
    const handleCancelEdit = () => {
        setEditingPurchase(null)
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
        if (editingPurchase) {
            // Calcular novo status baseado no valor pago
            const newStatus = calculateStatus(value, editingPurchase.total);
            const today = new Date().toISOString().split('T')[0];

            // LÓGICA: Se valor > 0, definir data do primeiro pagamento automaticamente
            // (usuário não precisa escolher, é sempre a data atual)
            if (value > 0 && !editFormData.firstPaymentDate) {
                setEditFormData(prev => ({
                    ...prev,
                    firstPaymentDate: today
                }));
            }

            // LÓGICA: NÃO definir data do pagamento total automaticamente
            // Deixar o usuário escolher quando quiser
            // Apenas limpar se o valor não atingiu o total
            if (value < editingPurchase.total) {
                setEditFormData(prev => ({
                    ...prev,
                    finalPaymentDate: ""
                }));
            }

            // Atualizar dados do formulário
            setEditFormData(prev => ({
                ...prev,
                totalPaid: value,
                remainingAmount: editingPurchase.total - value,
                status: newStatus
            }));

            // LÓGICA: Limpar erros relacionados quando o valor pago muda
            // (banco e data do pagamento total podem não ser mais obrigatórios)
            if (value === 0) {
                setEditErrors(prev => ({
                    ...prev,
                    bank: undefined,
                    finalPaymentDate: undefined
                }))
            }

            // Atualizar também na tabela para refletir mudanças em tempo real
            setPayables(prev =>
                prev.map(purchase =>
                    purchase._id === editingPurchase._id
                        ? {
                            ...purchase,
                            status: newStatus,
                            totalPaid: value,
                            remainingAmount: editingPurchase.total - value,
                            firstPaymentDate: purchase.firstPaymentDate,
                            finalPaymentDate: purchase.finalPaymentDate
                        }
                        : purchase
                )
            )
        }
    }

    // Função para validar formulário de edição
    const validateEditForm = (): boolean => {
        const errors: Partial<Record<string, string>> = {}

        // LÓGICA: Banco é obrigatório apenas quando há valor pago
        // (compra com pagamento parcial ou total)
        if (editFormData.totalPaid > 0 && (!editFormData.bank || editFormData.bank.trim().length === 0)) {
            errors.bank = "Banco é obrigatório quando há valor pago"
        }

        // LÓGICA: Data do pagamento é obrigatória quando há valor pago
        if (editFormData.totalPaid > 0 && (!editFormData.finalPaymentDate || editFormData.finalPaymentDate.trim().length === 0)) {
            errors.finalPaymentDate = "Data do pagamento é obrigatória quando há valor pago"
        }

        setEditErrors(errors)
        return Object.keys(errors).length === 0
    }

    // Função para verificar se o formulário pode ser salvo
    const canSaveForm = (): boolean => {
        // Se status é "Pendente", não deve ter valor pago, data de pagamento e banco
        if (editFormData.status === PaymentStatus.PENDING) {
            return editFormData.totalPaid === 0 &&
                !editFormData.finalPaymentDate &&
                !editFormData.bank.trim()
        }

        // Se status é "Pago" ou "Parcialmente pago", campos são obrigatórios
        if (editFormData.status === PaymentStatus.PAID || editFormData.status === PaymentStatus.PARTIALLY_PAID) {
            return editFormData.totalPaid > 0 &&
                Boolean(editFormData.finalPaymentDate) &&
                editFormData.bank.trim().length > 0
        }

        return false
    }

    // Função para salvar edição
    const handleSaveEdit = async () => {
        if (!editingPurchase || !validateEditForm()) return

        setIsSaving(true)

        try {
            const finalStatus = editFormData.status

            const updateData: UpdatePayableRequest = {
                status: finalStatus,
                totalPaid: editFormData.totalPaid,
                remainingAmount: editFormData.remainingAmount,
                firstPaymentDate: editFormData.firstPaymentDate || null,
                finalPaymentDate: editFormData.finalPaymentDate || null,
                bank: editFormData.bank,
                observations: editFormData.observations,
                payments: []
            }

            await axiosPrivate.patch<ApiResponse<Payable>>(`/payables/${editingPurchase._id}`, updateData)

            const updatedPurchase = { ...editingPurchase, ...updateData }
            setPayables(prev =>
                prev.map(purchase =>
                    purchase._id === updatedPurchase._id ? updatedPurchase : purchase
                )
            )

            handleCancelEdit()
        } catch (error) {
            logError("Payables", error);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as AxiosErrorResponse
                logError("Payables", `Status do erro: ${axiosError.response?.status}`);
                logError("Payables", `Dados do erro: ${axiosError.response?.data}`);
            }

            setEditErrors({ submit: "Erro ao atualizar compra. Tente novamente." })
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeletePurchase(id: string): Promise<void> {
        const purchaseToDelete = payables.find(purchase => purchase._id === id)
        if (!purchaseToDelete) return

        if (purchaseToDelete.status === "Pago") {
            return
        }

        const confirmed = window.confirm(
            `Tem certeza que deseja excluir a compra #${purchaseToDelete.purchaseNumber}?\n\nEsta ação não pode ser desfeita.`
        )

        if (!confirmed) return

        try {
            const response = await axiosPrivate.delete<DeleteResponse>(`/purchases/${id}`)
            setPayables(prev => prev.filter(purchase => purchase._id !== id))
            logInfo("Payables", "Compra excluída com sucesso", response.data.message)
        } catch (error: unknown) {
            logError("Payables", error);

            let errorMessage = "Erro ao excluir compra. Tente novamente."

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as AxiosErrorResponse

                if (axiosError.response?.status === 404) {
                    errorMessage = "Compra não encontrada."
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
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 pb-3">
                    💸 Contas a Pagar
                </h1>

                <p className="text-gray-600 font-medium">Gerencie seus pagamentos financeiros</p>
            </header>

            {currentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-emerald-200/50 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm">
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma conta a pagar encontrada</h3>

                    <p className="text-gray-500 text-center max-w-md">
                        Não há compras registradas no sistema.
                    </p>
                </div>
            ) : (
                <>
                    {/* Tabela */}
                    <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                                <tr>
                                    <th
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('date')}
                                        title="Clique para ordenar por data da compra"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Data da Compra
                                            <span className="text-xs">{getSortIcon('date')}</span>
                                        </div>
                                    </th>

                                    <th
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('purchaseNumber')}
                                        title="Clique para ordenar por número da compra"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Nº da Compra
                                            <span className="text-xs">{getSortIcon('purchaseNumber')}</span>
                                        </div>
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold text-center">Nº da Nota</th>

                                    <th
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('supplierName')}
                                        title="Clique para ordenar por fornecedor"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Fornecedor
                                            <span className="text-xs">{getSortIcon('supplierName')}</span>
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

                                    <th className="px-4 py-3 text-xs font-semibold text-center">Valor Pago</th>

                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('status')}
                                        title="Clique para ordenar por status"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Status
                                            <span className="text-xs">{getSortIcon('status')}</span>
                                        </div>
                                    </th>

                                    <th
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('finalPaymentDate')}
                                        title="Clique para ordenar por data do pagamento total"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Data pagamento total
                                            <span className="text-xs">{getSortIcon('finalPaymentDate')}</span>
                                        </div>
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold text-center">Banco</th>

                                    <th className="px-4 py-3 text-xs font-semibold text-center">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentItems.map(purchase => (
                                    <tr key={purchase._id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                        <td className="px-4 py-3 text-xs font-medium text-center">{purchase.date}</td>

                                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">#{purchase.purchaseNumber}</td>

                                        <td className="px-4 py-3 text-xs text-center">{purchase.invoiceNumber}</td>

                                        <td className="px-4 py-3 text-xs text-center">{purchase.supplierName}</td>

                                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                            {purchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </td>

                                        <td className="px-4 py-3 text-xs font-bold text-green-700 text-center">
                                            {purchase.totalPaid ? purchase.totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
                                        </td>

                                        <td className="px-4 py-3 text-xs text-center">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-lg text-xs font-medium border-2 transition-all duration-200 ${purchase.status === "Pago"
                                                    ? "bg-green-50 text-green-700 border-green-400"
                                                    : purchase.status === "Parcialmente pago"
                                                        ? "bg-yellow-50 text-yellow-700 border-yellow-400"
                                                        : "bg-red-50 text-red-600 border-red-300"
                                                    }`}
                                            >
                                                {purchase.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-xs text-center">
                                            {purchase.finalPaymentDate ? purchase.finalPaymentDate.split("T")[0].split("-").reverse().join("/") : "--"}
                                        </td>

                                        <td className="px-4 py-3 text-xs text-center">
                                            <span className="text-gray-700 font-medium">
                                                {purchase.bank || "--"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-xs text-center">
                                            <section className="flex items-center">
                                                {/* Botão de editar */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(purchase)}
                                                    className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                    title="Editar compra"
                                                    aria-label="Editar compra"
                                                >
                                                    <FaEdit size={18} />
                                                </button>

                                                {purchase.status === "Pendente" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePurchase(purchase._id)}
                                                        className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                        title="Excluir compra"
                                                        aria-label="Excluir compra"
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

                    <section className="flex items-center justify-between gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${currentPage === 1 ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"}`}
                        >
                            ← Anterior
                        </button>

                        <p className="text-sm text-gray-600">
                            Página {currentPage} de {totalPages} — mostrando {totalItems ? (startIndex + 1) : 0}–{startIndex + currentItems.length} de {totalItems}
                        </p>

                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${currentPage === totalPages ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"}`}
                        >
                            Próxima →
                        </button>
                    </section>
                </>
            )}

            {/* Modal de Edição */}
            {editingPurchase && (
                <section className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto border-2 border-emerald-200/50">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">✏️ Editar Compra #{editingPurchase.purchaseNumber}</h2>

                                    <p className="text-emerald-100 mt-1">
                                        Fornecedor: {editingPurchase.supplierName} | Total: {editingPurchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                </div>

                                <button
                                    onClick={handleCancelEdit}
                                    className="text-white hover:text-emerald-200 hover:bg-white/10 rounded-lg p-2 transition-all duration-200 cursor-pointer"
                                    aria-label="Fechar edição"
                                    title="Fechar edição"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-6 space-y-6">
                            {/* Informações da compra */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-emerald-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Data da Compra</p>

                                    <p className="font-semibold text-emerald-800">{editingPurchase.date}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">Número da Compra</p>

                                    <p className="font-semibold text-emerald-800">#{editingPurchase.purchaseNumber}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">Nº da Nota</p>

                                    <p className="font-semibold text-emerald-800">{editingPurchase.invoiceNumber}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">Valor Total</p>

                                    <p className="font-semibold text-emerald-800">
                                        {editingPurchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
                                            onChange={(e) => {
                                                const newStatus = e.target.value as PaymentStatus;
                                                setEditFormData(prev => ({ ...prev, status: newStatus }));

                                                // LÓGICA: Quando status muda para "Pendente", limpar dados de pagamento
                                                if (newStatus === PaymentStatus.PENDING) {
                                                    setEditFormData(prev => ({
                                                        ...prev,
                                                        totalPaid: 0,
                                                        remainingAmount: editingPurchase.total,
                                                        firstPaymentDate: "",
                                                        finalPaymentDate: "",
                                                        bank: ""
                                                    }));

                                                    // Limpar erros relacionados
                                                    setEditErrors(prev => ({
                                                        ...prev,
                                                        bank: undefined,
                                                        finalPaymentDate: undefined
                                                    }));

                                                    // Atualizar UI em tempo real com todos os campos
                                                    setPayables(prev =>
                                                        prev.map(purchase =>
                                                            purchase._id === editingPurchase._id
                                                                ? {
                                                                    ...purchase,
                                                                    status: newStatus,
                                                                    totalPaid: 0,
                                                                    remainingAmount: editingPurchase.total,
                                                                    firstPaymentDate: null,
                                                                    finalPaymentDate: null,
                                                                    bank: ""
                                                                }
                                                                : purchase
                                                        )
                                                    );
                                                }

                                                // LÓGICA: Quando status muda para "Pago", definir valor pago como total da compra
                                                if (newStatus === PaymentStatus.PAID) {
                                                    setEditFormData(prev => ({
                                                        ...prev,
                                                        totalPaid: editingPurchase.total,
                                                        remainingAmount: 0
                                                    }));

                                                    // Atualizar UI em tempo real com todos os campos
                                                    setPayables(prev =>
                                                        prev.map(purchase =>
                                                            purchase._id === editingPurchase._id
                                                                ? {
                                                                    ...purchase,
                                                                    status: newStatus,
                                                                    totalPaid: editingPurchase.total,
                                                                    remainingAmount: 0
                                                                }
                                                                : purchase
                                                        )
                                                    );
                                                }

                                                // LÓGICA: Quando status muda para "Parcialmente pago"
                                                if (newStatus === PaymentStatus.PARTIALLY_PAID) {
                                                    // Resetar data de pagamento para usuário escolher
                                                    // Garantir que valor pago não seja igual ao total (seria "Pago")
                                                    const newTotalPaid = Math.min(editFormData.totalPaid > 0 ? editFormData.totalPaid : editingPurchase.total * 0.5, editingPurchase.total - 0.01);

                                                    setEditFormData(prev => ({
                                                        ...prev,
                                                        finalPaymentDate: "",
                                                        totalPaid: newTotalPaid,
                                                        remainingAmount: editingPurchase.total - newTotalPaid
                                                    }));

                                                    // Atualizar UI em tempo real com todos os campos
                                                    setPayables(prev =>
                                                        prev.map(purchase =>
                                                            purchase._id === editingPurchase._id
                                                                ? {
                                                                    ...purchase,
                                                                    status: newStatus,
                                                                    totalPaid: newTotalPaid,
                                                                    remainingAmount: editingPurchase.total - newTotalPaid,
                                                                    finalPaymentDate: null
                                                                }
                                                                : purchase
                                                        )
                                                    );
                                                }
                                            }}
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
                                            Valor Pago <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={editingPurchase.total}
                                            value={editFormData.totalPaid}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                // Atualizar temporariamente para permitir digitação
                                                setEditFormData(prev => ({
                                                    ...prev,
                                                    totalPaid: value,
                                                    remainingAmount: editingPurchase.total - value
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
                                            Data do Pagamento
                                            {/* LÓGICA: Obrigatório apenas quando há valor pago */}
                                            {editFormData.totalPaid > 0 && <span className="text-red-500">*</span>}
                                        </label>

                                        <input
                                            type="date"
                                            value={editFormData.finalPaymentDate ? editFormData.finalPaymentDate.split('T')[0] : ""}
                                            onChange={(e) => {
                                                setEditFormData(prev => ({ ...prev, finalPaymentDate: e.target.value }))
                                                // LÓGICA: Limpar erro da data quando usuário escolhe
                                                if (editErrors.finalPaymentDate) {
                                                    setEditErrors(prev => ({ ...prev, finalPaymentDate: undefined }))
                                                }
                                            }}
                                            // LÓGICA: Campo ativo quando há valor pago > 0
                                            disabled={editFormData.totalPaid === 0}
                                            className={`w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${editFormData.totalPaid > 0
                                                ? "bg-white"
                                                : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                }`}
                                            aria-label="Data do pagamento"
                                            title="Data do pagamento"
                                        />

                                        {/* LÓGICA: Mostrar erro de validação */}
                                        {editErrors.finalPaymentDate && (
                                            <p className="text-red-500 text-sm mt-1">{editErrors.finalPaymentDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Banco
                                            {/* LÓGICA: Obrigatório apenas quando há valor pago */}
                                            {editFormData.totalPaid > 0 && <span className="text-red-500">*</span>}
                                        </label>

                                        <input
                                            type="text"
                                            value={editFormData.bank}
                                            onChange={(e) => {
                                                setEditFormData(prev => ({ ...prev, bank: e.target.value }))
                                                // LÓGICA: Limpar erro do banco quando usuário digita
                                                if (editErrors.bank) {
                                                    setEditErrors(prev => ({ ...prev, bank: undefined }))
                                                }
                                            }}
                                            className="w-full border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                            placeholder="Nome do banco"
                                            aria-label="Nome do banco"
                                            title="Nome do banco"
                                        />

                                        {editErrors.bank && (
                                            <p className="text-red-500 text-sm mt-1">{editErrors.bank}</p>
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
                            <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                                {/* Indicador de validação */}
                                {!canSaveForm() && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-yellow-700 text-sm font-medium">
                                            ⚠️ Campos obrigatórios não preenchidos:
                                        </p>
                                        <ul className="text-yellow-600 text-sm mt-2 ml-4 list-disc">
                                            {editFormData.status === PaymentStatus.PENDING && (
                                                <li>Status "Pendente" não deve ter valor pago, data de pagamento ou banco</li>
                                            )}
                                            {(editFormData.status === PaymentStatus.PAID || editFormData.status === PaymentStatus.PARTIALLY_PAID) && (
                                                <li>Status "{editFormData.status}" deve ter valor pago, data de pagamento e banco</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 font-medium cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving || !canSaveForm()}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isSaving ? 'Salvando...' : '💾 Salvar Alterações'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
