import { useState } from "react"
import { FaSearch, FaCalendarAlt } from 'react-icons/fa'
import type { AxiosResponse } from "axios"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { Receivable } from "../types/types"
import { PaymentStatus } from "../types/types"
import { logError } from '../utils/logger';


type SortField = 'date' | 'saleNumber' | 'clientName' | 'total' | 'totalPaid' | 'remainingAmount'

type SortOrder = 'asc' | 'desc'

interface SortConfig {
   field: SortField
   order: SortOrder
}

interface SalesHistoryFilters {
   startDate: string
   endDate: string
   clientSearch: string
   saleNumberSearch: string
}


export const SalesHistory: React.FC = () => {
   const [salesHistory, setSalesHistory] = useState<Receivable[]>([])
   const [filteredSales, setFilteredSales] = useState<Receivable[]>([])
   const [loading, setLoading] = useState<boolean>(false)
   const [hasSearched, setHasSearched] = useState<boolean>(false)
   const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' })
   const [filters, setFilters] = useState<SalesHistoryFilters>({
      startDate: "",
      endDate: "",
      clientSearch: "",
      saleNumberSearch: ""
   })
   const axiosPrivate = useAxiosPrivate()

   const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
   }

   const sortSales = (data: Receivable[], config: SortConfig): Receivable[] => {
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
            case 'totalPaid':
               aValue = a.totalPaid || 0
               bValue = b.totalPaid || 0
               break
            case 'remainingAmount':
               aValue = a.remainingAmount !== undefined && a.remainingAmount !== null
                  ? a.remainingAmount
                  : (a.total - (a.totalPaid || 0))
               bValue = b.remainingAmount !== undefined && b.remainingAmount !== null
                  ? b.remainingAmount
                  : (b.total - (b.totalPaid || 0))
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

   const getSortIcon = (field: SortField) => {
      if (sortConfig.field !== field) {
         return '⇅'
      }
      return sortConfig.order === 'asc' ? '⇧' : '⇩'
   }

   const sortedSales = sortSales(filteredSales, sortConfig)

   async function fetchSalesHistory() {
      setLoading(true)
      setHasSearched(true)
      try {
         const response: AxiosResponse<Receivable[]> = await axiosPrivate.get('/sales/history')

         if (response.status === 204 || !response.data) {
            setSalesHistory([])
            setFilteredSales([])
            return
         }

         // Processar dados para garantir que todos os campos estejam preenchidos
         const processedData = response.data.map(sale => ({
            ...sale,
            totalPaid: sale.totalPaid || 0,
            remainingAmount: sale.remainingAmount !== undefined && sale.remainingAmount !== null
               ? sale.remainingAmount
               : (sale.total - (sale.totalPaid || 0)),
            status: sale.status || "Pendente"
         }))

         setSalesHistory(processedData)

         applyFilters(processedData)
      } catch (error) {
         logError("SalesHistory", error);
         setSalesHistory([])

         setFilteredSales([])
      } finally {
         setLoading(false)
      }
   }

   function applyFilters(data: Receivable[] = salesHistory) {
      let filtered = [...data]

      // Filtro por período (só aplicar se ambas as datas estiverem preenchidas)
      if (filters.startDate && filters.endDate) {
         filtered = filtered.filter(sale => {
            // Converter data do formato brasileiro (dd/mm/yyyy) para Date
            const [day, month, year] = sale.date.split('/')
            // Criar data no formato YYYY-MM-DD para evitar problemas de fuso horário
            const saleDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            const saleDate = new Date(saleDateStr + 'T00:00:00')

            const startDate = new Date(filters.startDate + 'T00:00:00')
            const endDate = new Date(filters.endDate + 'T23:59:59')

            return saleDate >= startDate && saleDate <= endDate
         })
      }

      // Filtro por cliente
      if (filters.clientSearch.trim()) {
         filtered = filtered.filter(sale =>
            sale.clientName.toLowerCase().includes(filters.clientSearch.toLowerCase().trim())
         )
      }

      // Filtro por número da venda
      if (filters.saleNumberSearch.trim()) {
         filtered = filtered.filter(sale =>
            sale.saleNumber.toString().includes(filters.saleNumberSearch.trim())
         )
      }

      setFilteredSales(filtered)
   }

   function handleFilterChange(key: keyof SalesHistoryFilters, value: string) {
      setFilters(prev => ({ ...prev, [key]: value }))
   }

   function clearFilters() {
      setFilters({
         startDate: "",
         endDate: "",
         clientSearch: "",
         saleNumberSearch: ""
      })
   }

   function handleSearch() {
      fetchSalesHistory()
   }

   function formatCurrency(value: number): string {
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
   }

   const totalSales = sortedSales.length
   
   const totalRevenue = sortedSales.reduce((sum, sale) => sum + sale.total, 0)

   // Calcular totais baseados nos dados filtrados
   const totalReceived = sortedSales.reduce((sum, sale) => sum + (sale.totalPaid || 0), 0)

   const totalPending = sortedSales.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0)


   return (
      <main className="p-8 max-w-7xl mx-auto">
         <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
               📊 Histórico de Vendas
            </h1>

            <p className="text-gray-600 font-medium">Consulte todas as vendas realizadas no período</p>
         </header>

         {/* Filtros */}
         <section className="border-2 border-emerald-200/50 rounded-2xl p-6 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
            <header className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold text-emerald-800 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Filtros de Período
               </h2>

               <div className="flex items-center gap-3">
                  <button
                     type="button"
                     onClick={handleSearch}
                     className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  >
                     🔍 Buscar Vendas
                  </button>

                  <button
                     type="button"
                     onClick={clearFilters}
                     className="text-emerald-600 hover:text-emerald-700 font-medium text-sm cursor-pointer"
                  >
                     Limpar Filtros
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
               <div>
                  <label
                     htmlFor="startDate"
                     className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                     Data Inicial
                  </label>

                  <input
                     id="startDate"
                     type="date"
                     value={filters.startDate}
                     onChange={e => handleFilterChange('startDate', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>

               <div>
                  <label
                     htmlFor="endDate"
                     className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                     Data Final
                  </label>

                  <input
                     id="endDate"
                     type="date"
                     value={filters.endDate}
                     onChange={e => handleFilterChange('endDate', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>

               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Buscar Cliente
                  </label>

                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                     </div>

                     <input
                        type="text"
                        placeholder="Nome do cliente..."
                        value={filters.clientSearch}
                        onChange={e => handleFilterChange('clientSearch', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Número da Venda
                  </label>

                  <input
                     type="text"
                     placeholder="Número da venda..."
                     value={filters.saleNumberSearch}
                     onChange={e => handleFilterChange('saleNumberSearch', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Vendas</p>

                  <p className="text-2xl font-bold text-emerald-700">{totalSales}</p>
               </div>

               <div className="bg-green-50/50 p-4 rounded-xl border border-cyan-500">
                  <p className="text-sm font-medium text-cyan-800/50 mb-1">Receita Total</p>

                  <p className="text-2xl font-bold text-cyan-700">{formatCurrency(totalRevenue)}</p>
               </div>

               <div className="bg-blue-50/50 p-4 rounded-xl border border-green-500">
                  <p className="text-sm font-medium text-green-800/50 mb-1">Total Recebido</p>

                  <p className="text-2xl font-bold text-green-700">
                     {formatCurrency(totalReceived)}
                  </p>
               </div>

               <div className="bg-red-50/50 p-4 rounded-xl border border-red-200">
                  <p className="text-sm font-medium text-red-800/50 mb-1">Total Pendente</p>

                  <p className="text-2xl font-bold text-red-700">
                     {formatCurrency(totalPending)}
                  </p>
               </div>
            </div>
         </section>

         {/* Tabela de Histórico */}
         <section className="border-2 border-emerald-200/50 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <header className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
               <h3 className="font-semibold text-white text-lg">
                  Vendas Realizadas ({sortedSales.length})
               </h3>
            </header>

            {loading ? (
               <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  
                  <span className="text-gray-600">Carregando histórico...</span>
               </div>
            ) :
               sortedSales.length === 0 ? (
                  <div className="p-8 text-center">
                     {!hasSearched ? (
                        <div>
                           <p className="text-gray-500 text-lg mb-4">Nenhuma venda carregada</p>

                           <p className="text-gray-400 text-sm">Clique em "Buscar Vendas" para carregar o histórico</p>
                        </div>
                     ) : (
                        <div>
                           <div className="text-6xl mb-4">📊</div>
                           <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma venda registrada</h3>

                           <p className="text-gray-500 text-center mx-auto max-w-md">
                              Não há vendas registradas no sistema ainda. As vendas aparecerão aqui quando você criar novas vendas.
                           </p>
                        </div>
                     )}
                  </div>
               ) : (
                  // TABELA
                  <div className="overflow-x-auto max-h-[70vh]">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-emerald-50 sticky top-0 z-10">
                           <tr>
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('date')}
                                 title="Clique para ordenar por data"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Data
                                    <span className="text-xs">{getSortIcon('date')}</span>
                                 </div>
                              </th>
                              
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('saleNumber')}
                                 title="Clique para ordenar por número da venda"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Nº Venda
                                    <span className="text-xs">{getSortIcon('saleNumber')}</span>
                                 </div>
                              </th>
                              
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('clientName')}
                                 title="Clique para ordenar por cliente"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Cliente
                                    <span className="text-xs">{getSortIcon('clientName')}</span>
                                 </div>
                              </th>
                              
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Itens</th>
                              
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('total')}
                                 title="Clique para ordenar por valor total"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Total
                                    <span className="text-xs">{getSortIcon('total')}</span>
                                 </div>
                              </th>
                              
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('totalPaid')}
                                 title="Clique para ordenar por valor pago"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Pago
                                    <span className="text-xs">{getSortIcon('totalPaid')}</span>
                                 </div>
                              </th>
                              
                              <th 
                                 className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center cursor-pointer hover:bg-emerald-100 transition-colors duration-200 select-none"
                                 onClick={() => handleSort('remainingAmount')}
                                 title="Clique para ordenar por valor pendente"
                              >
                                 <div className="flex items-center justify-center gap-1">
                                    Pendente
                                    <span className="text-xs">{getSortIcon('remainingAmount')}</span>
                                 </div>
                              </th>
                              
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Status</th>
                           </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                           {sortedSales.map(sale => (
                              <tr key={sale._id} className="hover:bg-emerald-50/50 transition-colors duration-200">

                                 <td className="px-4 py-3 text-xs font-medium text-center">
                                    {sale.date}
                                 </td>

                                 <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                    #{sale.saleNumber}
                                 </td>

                                 <td className="px-4 py-3 text-xs text-center">
                                    {sale.clientName}
                                 </td>

                                 <td className="px-4 py-3 text-xs">
                                    {sale.items.map((item, index) => (
                                       <div key={index}
                                          className="flex items-center justify-center text-gray-700"
                                       >
                                          <span className="font-medium">{item.productName} -</span>
                                          <span className="text-gray-600 ml-1">{item.quantity}(x) -</span>
                                          <span className="text-emerald-600 font-semibold ml-1">
                                             {formatCurrency(item.price)}
                                          </span>
                                       </div>
                                    ))}
                                 </td>

                                 <td className="px-4 py-3 text-xs font-bold text-cyan-700 text-center">
                                    {formatCurrency(sale.total)}
                                 </td>



                                 <td className="px-4 py-3 text-xs font-bold text-green-700 text-center">
                                    {formatCurrency(sale.totalPaid || 0)}
                                 </td>

                                 <td className="px-4 py-3 text-xs font-bold text-red-700 text-center">
                                    {formatCurrency(sale.remainingAmount !== undefined && sale.remainingAmount !== null ? sale.remainingAmount : (sale.total - (sale.totalPaid || 0)))}
                                 </td>

                                 <td className="px-4 py-3 text-xs text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${sale.status === PaymentStatus.PAID
                                       ? "bg-green-100 text-green-800"
                                       : sale.status === PaymentStatus.PARTIALLY_PAID
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                       }`}>
                                       {sale.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
         </section>
      </main>
   )
} 
