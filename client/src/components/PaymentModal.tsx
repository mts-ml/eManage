import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

import { PaymentStatus } from '../types/types'
import type { AxiosErrorResponse } from '../types/types'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    saleTotal: number
    currentStatus: PaymentStatus
    totalPaid: number
    remainingAmount: number
    onPaymentSuccess: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    saleTotal,
    currentStatus,
    totalPaid,
    remainingAmount,
    onPaymentSuccess
}) => {
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        bank: '',
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')



    useEffect(() => {
        if (isOpen) {
            setError('')
            setSuccess('')
            setPaymentData({
                amount: 0,
                paymentDate: new Date().toISOString().split('T')[0],
                bank: '',
                notes: ''
            })
        }
    }, [isOpen])

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            if (paymentData.amount <= 0) {
                setError('O valor deve ser maior que zero')
                return
            }

            if (paymentData.amount > remainingAmount) {
                setError(`O valor pago (${paymentData.amount}) excede o valor pendente (${remainingAmount})`)
                return
            }

            // Aqui você pode implementar a lógica para registrar o pagamento
            // Por enquanto, apenas simula o sucesso
            setSuccess('Pagamento registrado com sucesso!')
            onPaymentSuccess()
            
            // Reset form
            setPaymentData({
                amount: 0,
                paymentDate: new Date().toISOString().split('T')[0],
                bank: '',
                notes: ''
            })
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'response' in error 
                ? (error as AxiosErrorResponse)?.response?.data?.message 
                : 'Erro ao registrar pagamento'
            setError(errorMessage || 'Erro ao registrar pagamento')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PAID:
                return 'bg-green-100 text-green-800'
            case PaymentStatus.PARTIALLY_PAID:
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-red-100 text-red-800'
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-emerald-800">
                        💳 Gerenciar Pagamentos
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Fechar modal"
                        title="Fechar modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Informações da venda */}
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total da Venda</p>
                            <p className="text-lg font-bold text-emerald-700">
                                {saleTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Já Pago</p>
                            <p className="text-lg font-bold text-green-700">
                                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Pendente</p>
                            <p className="text-lg font-bold text-red-700">
                                {remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentStatus)}`}>
                                {currentStatus}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Registrar Novo Pagamento
                        </h3>
                        
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor do Pagamento <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={remainingAmount}
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                        placeholder="0,00"
                                        aria-label="Valor do pagamento"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Máximo: {remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data do Pagamento <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={paymentData.paymentDate}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                        aria-label="Data do pagamento"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Banco
                                </label>
                                <input
                                    type="text"
                                    value={paymentData.bank}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, bank: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Nome do banco"
                                    aria-label="Nome do banco"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Observações sobre o pagamento..."
                                    aria-label="Observações"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                    {success}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Registrando...' : 'Registrar Pagamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
