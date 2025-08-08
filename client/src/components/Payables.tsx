import { useEffect, useState } from "react"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type {
  Payable,
  UpdatePayableRequest,
  ApiResponse,
  DeleteResponse,
  AxiosErrorResponse
} from "../types/types"

type SortField = 'date' | 'purchaseNumber' | 'invoiceNumber' | 'clientName' | 'total' | 'paymentDate'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  order: SortOrder
}

export const Payables: React.FC = () => {
  const [payables, setPayables] = useState<Payable[]>([])
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [modifiedId, setModifiedId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
  const axiosPrivate = useAxiosPrivate()

  // Função para converter data do formato DD/MM/AAAA para objeto Date
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Função para ordenar os pagáveis
  const sortPayables = (data: Payable[], config: SortConfig): Payable[] => {
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
        case 'invoiceNumber':
          aValue = a.invoiceNumber || ''
          bValue = b.invoiceNumber || ''
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

  // Pagáveis ordenados
  const sortedPayables = sortPayables(payables, sortConfig)

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const response = await axiosPrivate.get<Payable[]>("/purchases")
        const purchasesWithPayableInfo: Payable[] = response.data.map((purchase: Payable) => ({
          ...purchase,
          status: purchase.status || "Em aberto",
          paymentDate: purchase.paymentDate || null,
          bank: purchase.bank || ""
        }))
        setPayables(purchasesWithPayableInfo)
      } catch (error) {
        console.error("Erro ao buscar compras:", error)
      }
    }
    fetchPurchases()
  }, [axiosPrivate])

  function handleStatusChange(id: string, newStatus: "Em aberto" | "Pago") {
    setPayables(prev =>
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
    setPayables(prev =>
      prev.map(sale => (sale._id === id ? { ...sale, bank } : sale))
    )

    setModifiedId(id)
  }

  async function handleSave(id: string): Promise<void> {
    const purchaseToSave = payables.find(sale => sale._id === id)
    if (!purchaseToSave) return

    if (purchaseToSave.status === "Pago" && !purchaseToSave.bank.trim()) {
      setErrors(prev => ({ ...prev, [id]: "Informe o banco." }))
      return
    }

    const updateData: UpdatePayableRequest = {
      status: purchaseToSave.status,
      paymentDate: purchaseToSave.paymentDate,
      bank: purchaseToSave.bank,
      invoiceNumber: purchaseToSave.invoiceNumber
    }

    try {
      await axiosPrivate.patch<ApiResponse<Payable>>(`/payables/${id}`, updateData)

      setErrors(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })

      setModifiedId(null)
    } catch (error) {
      setErrors(prev => ({ ...prev, [id]: "Erro ao atualizar pagável" }))
      console.error("Erro ao atualizar pagável:", error)
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
      console.log("Compra excluída com sucesso:", response.data.message)
    } catch (error: unknown) {
      console.error("Erro ao excluir compra:", error)

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
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
          💸 Contas a Pagar
        </h2>

        <p className="text-gray-600 font-medium">Gerencie suas obrigações financeiras</p>
      </div>

      {sortedPayables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 border-2 border-emerald-200/50 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma conta a pagar encontrada</h3>

          <p className="text-gray-500 text-center max-w-md">
            Não há compras registradas no sistema.
          </p>
        </div>
      ) : (
        <div className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
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
                    Nº Compra
                    <span className="text-xs">{getSortIcon('purchaseNumber')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                  onClick={() => handleSort('invoiceNumber')}
                  title="Clique para ordenar por número da nota"
                >
                  <div className="flex items-center justify-center gap-1">
                    Nº Nota
                    <span className="text-xs">{getSortIcon('invoiceNumber')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                  onClick={() => handleSort('clientName')}
                  title="Clique para ordenar por fornecedor"
                >
                  <div className="flex items-center justify-center gap-1">
                    Fornecedor
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
              {sortedPayables.map(purchase => (
                <tr key={purchase._id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                  <td className="px-4 py-3 text-xs font-medium text-center">{purchase.date}</td>

                  <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">#{purchase.purchaseNumber}</td>

                  <td className="px-4 py-3 text-xs text-center">
                    {purchase.invoiceNumber ? `#${purchase.invoiceNumber}` : "--"}
                  </td>

                  <td className="px-4 py-3 text-xs text-center">{purchase.clientName}</td>

                  <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                    {purchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>

                  <td className="px-4 py-3 text-xs text-center">
                    <select
                      aria-label="Purchase status"
                      className={`border-2 rounded-lg p-1 text-xs cursor-pointer transition-all duration-200 ${purchase.status === "Pago" ? "bg-green-50 text-green-700 border-green-400" : "border-gray-200"}`}
                      value={purchase.status}
                      onChange={e => handleStatusChange(purchase._id, e.target.value as "Em aberto" | "Pago")}
                    >
                      <option value="Em aberto">Em aberto</option>
                      <option value="Pago">Pago</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 text-xs text-center">
                    {purchase.paymentDate ? new Date(purchase.paymentDate).toLocaleDateString("pt-BR") : "--"}
                  </td>

                  <td className="px-4 py-3 text-xs text-center">
                    <input
                      type="text"
                      value={purchase.bank}
                      onChange={e => handleBankChange(purchase._id, e.target.value)}
                      placeholder="Banco"
                      className="border-2 border-gray-200 rounded-lg p-1 w-full text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />

                    {errors[purchase._id] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                        <span className="mr-1">⚠️</span>
                        {errors[purchase._id]}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-center">
                    <div className="flex flex-col gap-1 items-center">
                      {modifiedId === purchase._id && (
                        <button
                          type="button"
                          onClick={() => handleSave(purchase._id)}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-3 py-1 rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          💾 Salvar
                        </button>
                      )}

                      {purchase.status === "Em aberto" && (
                        <button
                          type="button"
                          onClick={() => handleDeletePurchase(purchase._id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer text-lg font-bold transition-colors duration-200"
                          title="Excluir compra"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
