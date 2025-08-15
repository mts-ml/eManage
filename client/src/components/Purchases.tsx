import { useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import { FaSearch } from 'react-icons/fa'
import type { AxiosResponse } from "axios"


import ProductsContext from "../Context/ProductsContext"
import SupplierContext from "../Context/SupplierContext"
import type { Product, PurchasePayload, PurchaseResponse } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface CartItem extends Product {
    quantity: number
}

export const Purchases: React.FC = () => {
    const { suppliers } = useContext(SupplierContext)
    const { products, setProducts } = useContext(ProductsContext)

    const [cart, setCart] = useState<CartItem[]>([])
    const [lastPurchase, setLastPurchase] = useState<PurchaseResponse["purchase"] | null>(null)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(1)
    const [customPrice, setCustomPrice] = useState<string>("")
    const [invoiceNumber, setInvoiceNumber] = useState<string>("")
    const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("")
    const [productSearchTerm, setProductSearchTerm] = useState<string>("")
    const axiosPrivate = useAxiosPrivate()

    // Filtrar fornecedores baseado no termo de busca
    const filteredSuppliers = suppliers.filter(supplier => {
        if (!supplierSearchTerm.trim()) return true
        return supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase().trim())
    })

    // Filtrar produtos baseado no termo de busca
    const filteredProducts = products.filter(product => {
        if (!productSearchTerm.trim()) return true
        return product.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim())
    })

    const today = new Date().toLocaleDateString("pt-BR")
    const selectedProduct = products.find(p => p.id === selectedProductId)
    const selectedSupplier = suppliers.find(sup => sup.id === selectedSupplierId)
    const total = cart.reduce((sum, item) => sum + Number(item.purchasePrice) * item.quantity, 0)

    useEffect(() => {
        async function getLastPurchase() {
            try {
                const response = await axiosPrivate.get('/purchases/last')
                setLastPurchase(response.data.purchase)
            } catch (error) {
                console.log("Erro ao buscar a última compra:", error)
                return
            }
        }

        getLastPurchase()
    }, [])

    function handleAddToCart(product: Product, quantity: number) {
        setCart(prev => {
            const existingProduct = prev.find(item => item.id === product.id)

            // Usar preço customizado se fornecido, senão usar o preço padrão
            const finalPrice = customPrice && !isNaN(Number(customPrice)) && Number(customPrice) > 0
                ? customPrice
                : product.purchasePrice

            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            purchasePrice: finalPrice // Atualizar preço se necessário
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity, purchasePrice: finalPrice }]
            }

        })

        setCustomPrice("") // Limpar preço customizado
    }

    function handleQuantityChange(id: string, change: number) {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(1, item.quantity + change)
                    }
                    : item
            )
        )
    }

    function handleRemoveItem(id: string) {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    async function submitPurchase() {
        const purchasePayload: PurchasePayload & { invoiceNumber: string } = {
            supplierId: selectedSupplierId,
            supplierName: selectedSupplier?.name || "Fornecedor Desconhecido",
            date: today,
            invoiceNumber,
            items: cart
                .map(item => ({
                    productId: item.id!,
                    productName: item.name,
                    quantity: item.quantity,
                    price: Number(item.purchasePrice)
                })),
            total: Number(total),
        }

        if (!selectedSupplierId || cart.length === 0 || !invoiceNumber.trim()) {
            alert("Selecione um fornecedor, adicione produtos ao carrinho e informe o número da nota.")
            return
        }

        try {
            const response: AxiosResponse<PurchaseResponse> = await axiosPrivate.post('/purchases', purchasePayload)

            const { purchase, updatedProducts } = response.data

            setProducts((prev: Product[]) =>
                prev.map(product => {
                    const updatedProduct = updatedProducts.find(p => p.id === product.id)

                    return updatedProduct ? { ...product, stock: updatedProduct.stock } : product
                })
            )

            setLastPurchase(purchase)
        } catch (error) {
            console.error(error)
            alert('Erro ao finalizar a compra.')
            return
        }

        alert("Compra finalizada com sucesso")
        setCart([])
        setSelectedSupplierId("")
        setSelectedProductId("")
        setQuantity(1)
        setInvoiceNumber("")
    }


    return (
        <main className="p-8 max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-3">
                    📦 Compras
                </h1>
                <p className="text-gray-600 font-medium">Gerencie suas compras de forma eficiente</p>
            </header>

            {/* Selecionar fornecedor e produto */}
            <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                <header className="flex justify-between items-center mb-6">
                    <p className="text-xl font-semibold text-emerald-800">
                        Compra Nº {lastPurchase ? lastPurchase.purchaseNumber + 1 : '1'}
                    </p>

                    <section className="text-sm text-gray-600 bg-emerald-50/50 px-4 py-2 rounded-lg">
                        Data: {today}
                    </section>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <article>
                        <label htmlFor="client" className="block text-sm font-semibold text-gray-700 mb-2">
                            Fornecedor <span className="text-red-500">*</span>
                        </label>

                        {/* Input de busca para fornecedores */}
                        <section className="relative mb-2">
                            <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-gray-400" />
                            </section>
                            <input
                                type="text"
                                placeholder="Buscar fornecedor por nome..."
                                value={supplierSearchTerm}
                                onChange={(e) => setSupplierSearchTerm(e.currentTarget.value)}
                                className="block w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm"
                            />
                        </section>

                        <select
                            id="client"
                            value={selectedSupplierId}
                            onChange={e => setSelectedSupplierId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um fornecedor</option>
                            {filteredSuppliers.map(supplier => (
                                <option
                                    key={supplier.id}
                                    value={supplier.id}
                                >
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </article>

                    <article>
                        <label htmlFor="product" className="block text-sm font-semibold text-gray-700 mb-2">
                            Produto <span className="text-red-500">*</span>
                        </label>

                        {/* Input de busca para produtos */}
                        <section className="relative mb-2">
                            <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-gray-400" />
                            </section>
                            <input
                                type="text"
                                placeholder="Buscar produto por nome..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.currentTarget.value)}
                                className="block w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm"
                            />
                        </section>

                        <select
                            id="product"
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um produto</option>
                            {filteredProducts.map(product => (
                                <option
                                    key={product.id}
                                    value={product.id}
                                >
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </article>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <article>
                        <label htmlFor="invoiceNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                            Número da Nota <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="invoiceNumber"
                            type="text"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            placeholder="Digite o número da nota fiscal"
                            className="w-full border-2 border-gray-200 rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                    </article>
                </section>
            </section>

            {selectedProduct && selectedSupplier && (
                <section className="mb-8 border-2 border-emerald-200/50 rounded-2xl p-6 bg-white/90 backdrop-blur-sm shadow-xl">
                    <article>
                        <header className="flex items-center justify-between mb-4">
                            <section>
                                <p className="text-lg font-semibold text-emerald-800 mb-2">
                                    Fornecedor: <span className="text-emerald-600">{selectedSupplier.name}</span>
                                </p>
                                <p className="text-lg font-semibold text-emerald-800">
                                    Produto: <span className="text-emerald-600">{selectedProduct.name}</span>
                                </p>
                            </section>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedProductId("")
                                    setSelectedSupplierId("")
                                }}
                                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                aria-label="Fechar aba de compra."
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <article className="bg-emerald-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Preço Padrão</p>
                                <p className="text-lg font-bold text-emerald-700">
                                    R$ {Number(selectedProduct.purchasePrice).toFixed(2).replace(".", ",")}
                                </p>
                            </article>

                            <article className="bg-yellow-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Preço Customizado</p>
                                <section className="flex items-center gap-2">
                                    <label htmlFor="customPrice" className="sr-only">Preço Customizado</label>
                                    <input
                                        id="customPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        onChange={e => setCustomPrice(e.currentTarget.value)}
                                        value={customPrice}
                                        placeholder={selectedProduct.purchasePrice}
                                        className="w-full border-2 border-gray-200 rounded-lg p-2 text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </section>
                                <p className="text-xs text-gray-500 mt-1">Deixe vazio para usar o preço padrão</p>
                            </article>

                            <article className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-2">Estoque Disponível</p>
                                <section className="flex items-center justify-between">
                                    <section className="flex items-center gap-2">
                                        <section className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm font-bold">📦</span>
                                        </section>
                                        <section>
                                            <p className="text-xl font-bold text-blue-700">
                                                {selectedProduct.stock}
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium">unidades</p>
                                        </section>
                                    </section>
                                    {selectedProduct.description && selectedProduct.description.trim() !== "" && (
                                        <section className="text-right">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Descrição</p>
                                            <p className="text-xs text-blue-700 italic max-w-[120px] truncate">
                                                {selectedProduct.description}
                                            </p>
                                        </section>
                                    )}
                                </section>
                            </article>

                            <article className="bg-green-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Quantidade</p>
                                <section className="flex items-center gap-2">
                                    <label htmlFor="quantity" className="sr-only">Quantidade</label>
                                    <input
                                        id="quantity"
                                        type="number"
                                        onChange={e => setQuantity(Number(e.currentTarget.value))}
                                        value={quantity}
                                        min={1}
                                        placeholder="Qtd"
                                        className="w-20 border-2 border-gray-200 rounded-lg p-2 text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </section>
                            </article>
                        </section>

                        <button
                            onClick={() => handleAddToCart(selectedProduct, quantity)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            ➕ Adicionar ao Carrinho
                        </button>
                    </article>
                </section>
            )}

            {selectedSupplierId && cart.length > 0 && (
                <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-emerald-800 mb-2">
                            🛒 Carrinho
                        </h3>
                        <p className="text-gray-600 font-medium">
                            Fornecedor: <span className="font-semibold text-emerald-700">{selectedSupplier?.name}</span>
                        </p>
                    </div>

                    <section className="space-y-4 mb-6">
                        {cart.map(item => (
                            <section
                                key={item.id}
                                className="border-2 border-emerald-100 rounded-xl p-6 bg-gradient-to-r from-emerald-50/50 to-green-50/50 hover:from-emerald-50/70 hover:to-green-50/70 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Informações do produto */}
                                    <section className="flex-1">
                                        <section className="flex items-start gap-4">
                                            <section className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <span className="text-emerald-600 text-xl">📦</span>
                                            </section>

                                            <section className="flex-1 min-w-0">
                                                <h4 className="font-bold text-emerald-800 text-lg mb-1 truncate">
                                                    {item.name}
                                                </h4>

                                                <section className="space-y-1">
                                                    <section className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Preço:</span>
                                                        <span className="font-semibold text-emerald-700">
                                                            {Number(item.purchasePrice).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            })}
                                                        </span>
                                                    </section>

                                                    <section className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Quantidade:</span>
                                                        <span className="font-semibold text-emerald-700">
                                                            {Number(item.quantity).toLocaleString("pt-BR")} (x)
                                                        </span>
                                                    </section>

                                                    {item.description && item.description.trim() !== "" && (
                                                        <section className="flex items-start gap-2 text-sm text-gray-600">
                                                            <span className="font-medium mt-0.5">Descrição:</span>
                                                            <span className="italic text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                                                                {item.description}
                                                            </span>
                                                        </section>
                                                    )}

                                                    <section className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-gray-600">Subtotal:</span>
                                                        <span className="font-bold text-emerald-800 text-base">
                                                            {(Number(item.purchasePrice) * Number(item.quantity)).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            })}
                                                        </span>
                                                    </section>
                                                </section>
                                            </section>
                                        </section>
                                    </section>

                                    {/* Controles de quantidade e remoção */}
                                    <section className="flex flex-col sm:flex-row items-center gap-3">
                                        <section className="flex items-center gap-2 bg-white rounded-lg p-3 border-2 border-emerald-200 shadow-sm">
                                            <button
                                                onClick={() => handleQuantityChange(item.id!, -1)}
                                                className="w-10 h-10 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700 hover:scale-105"
                                                aria-label="Diminuir quantidade"
                                            >
                                                -
                                            </button>

                                            <span className="font-bold text-emerald-800 min-w-[3rem] text-center text-lg">
                                                {Number(item.quantity).toLocaleString("pt-BR")}
                                            </span>

                                            <button
                                                onClick={() => handleQuantityChange(item.id!, 1)}
                                                className="w-10 h-10 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700 hover:scale-105"
                                                aria-label="Aumentar quantidade"
                                            >
                                                +
                                            </button>
                                        </section>

                                        <button
                                            onClick={() => handleRemoveItem(item.id!)}
                                            className="text-red-600 hover:text-red-800 p-3 rounded-lg hover:bg-red-50 transition-all duration-200 font-semibold border-2 border-red-200 hover:border-red-300 cursor-pointer"
                                        >
                                            🗑️ Remover
                                        </button>
                                    </section>
                                </section>
                            </section>
                        ))}
                    </section>

                    <section className="text-center">
                        <p className="text-2xl font-bold text-emerald-800 mb-6">
                            Total: {Number(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>

                        <button
                            type="button"
                            className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                            onClick={submitPurchase}
                        >
                            💳 Finalizar Compra
                        </button>
                    </section>
                </section>
            )}

            {lastPurchase && !selectedSupplierId && (
                <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-sm shadow-xl">
                    {/* Header com ícone e título */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h3 className="text-3xl font-bold text-emerald-800 mb-2">
                            Compra Finalizada com Sucesso!
                        </h3>
                        <p className="text-emerald-600 font-medium">Detalhes da transação</p>
                    </div>

                    {/* Informações principais */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <section className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">📋</span>
                                <p className="text-sm font-medium text-gray-600">Número da Compra</p>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">#{lastPurchase.purchaseNumber}</p>
                        </section>

                        <section className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">🏢</span>

                                <p className="text-sm font-medium text-gray-600">Fornecedor</p>
                            </div>

                            <p className="text-xl font-bold text-emerald-700 truncate">{lastPurchase.supplierName}</p>
                        </section>

                        <section className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">📅</span>

                                <p className="text-sm font-medium text-gray-600">Data</p>
                            </div>

                            <p className="text-xl font-bold text-emerald-700">{lastPurchase.date}</p>
                        </section>
                    </section>

                    {/* Tabela de itens */}
                    <section className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                            <h4 className="font-semibold text-white text-lg flex items-center">
                                <span className="mr-2">📦</span>
                                Itens da Compra
                            </h4>
                        </div>

                        <section className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-emerald-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Produto
                                        </th>

                                        <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Quantidade
                                        </th>

                                        <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Preço Unit.
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-emerald-100">
                                    {lastPurchase.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <section className="flex items-center">

                                                    <section className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-emerald-600 text-sm font-semibold">
                                                            {index + 1}
                                                        </span>
                                                    </section>

                                                    <span className="text-gray-900 font-medium">{item.productName}</span>
                                                </section>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                                    {item.quantity}x
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-700 font-medium">
                                                    {Number(item.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <span className="text-emerald-700 font-bold">
                                                    {(Number(item.price) * item.quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* Total */}
                        <section className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-t border-emerald-200">
                            <section className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-emerald-800">Total da Compra:</span>

                                <span className="text-2xl font-bold text-emerald-700">
                                    {lastPurchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                            </section>
                        </section>
                    </section>
                </section>
            )}
        </main>
    )
}
