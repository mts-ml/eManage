import { useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import type { AxiosResponse } from "axios"


import ProductsContext from "../Context/ProductsContext"
import SupplierContext from "../Context/SupplierContext"
import type { Product, ItemPayload, PurchaseResponse } from "../types/types"
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
    const axiosPrivate = useAxiosPrivate()

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

            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            price: item.purchasePrice
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity }]
            }

        })
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
        const purchasePayload: ItemPayload = {
            clientId: selectedSupplierId,
            clientName: selectedSupplier?.name || "Fornecedor Desconhecido",
            date: today,
            items: cart
                .map(item => ({
                    productId: item.id!,
                    productName: item.name,
                    quantity: item.quantity,
                    price: Number(item.purchasePrice)
                }),
                ),
            total,
        }

        if (!selectedSupplierId || cart.length === 0) {
            alert("Selecione um fornecedor e adicione produtos ao carrinho.")
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
    }


    return (
        <main className="p-6 max-w-3xl mx-auto">

            <h2 className="text-2xl font-bold mb-8 text-center">
                Compras
            </h2>

            {/* Selecionar fornecedor e produto */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <p className="text-lg font-medium">
                        Compra Nº {lastPurchase ? lastPurchase.purchaseNumber + 1 : '1'}
                    </p>

                    <div className="text-sm text-gray-600">
                        Data: {today}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="client" className="block text-sm font-medium mb-1">
                        Fornecedor
                    </label>

                    <select
                        id="client"
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        className="w-full border cursor-pointer border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um fornecedor</option>
                        {suppliers.map(supplier => (
                            <option
                                key={supplier.id}
                                value={supplier.id}
                            >
                                {supplier.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label htmlFor="product" className="block text-sm font-medium mb-1">
                        Produto
                    </label>

                    <select
                        id="product"
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full border cursor-pointer border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um produto</option>
                        {products.map(product => (
                            <option
                                key={product.id}
                                value={product.id}
                            >
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {selectedProduct && selectedSupplier && (
                <section className="mb-8 border rounded-md p-4 bg-gray-50">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="mb-2">Fornecedor: <strong>{selectedSupplier.name}</strong></p>

                            <button
                                type="button"
                                aria-label="Fechar aba de compra."
                            >
                                <X
                                    onClick={() => {
                                        setSelectedProductId("")
                                        setSelectedSupplierId("")
                                    }}
                                    className="w-5 h-5 text-gray-500 hover:cursor-pointer hover:text-black" />
                            </button>
                        </div>

                        <p className="mb-2">
                            Produto: <strong>{selectedProduct.name}</strong>
                        </p>

                        <p className="text-sm text-gray-600 mb-2">
                            Preço: <strong>R${Number(selectedProduct.purchasePrice).toFixed(2).replace(".", ",")}</strong>
                        </p>
                    </div>

                    <div className="flex gap-2 items-center">
                        <label htmlFor="quantity" className="text-sm">
                            Quantidade:
                        </label>

                        <input
                            id="quantity"
                            type="number"
                            onChange={e => setQuantity(Number(e.currentTarget.value))}
                            value={quantity}
                            min={1}
                            className="w-24 border border-gray-300 rounded-md p-1"
                        />

                        <button
                            onClick={() => handleAddToCart(selectedProduct, quantity)}
                            className="bg-emerald-600 cursor-pointer text-white px-4 py-1.5 rounded hover:bg-emerald-700"
                        >
                            Adicionar ao Carrinho
                        </button>
                    </div>

                </section>
            )}


            {selectedSupplierId && cart.length > 0 && (
                <>
                    <h3 className="text-lg font-semibold mb-2">
                        Carrinho
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Fornecedor: <span className="font-medium">{selectedSupplier?.name}</span>
                    </p>

                    <div className="mb-6">
                        {cart.map(item => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center border-b py-2"
                            >
                                <div>
                                    <p className="font-medium">
                                        {item.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {Number(item.purchasePrice).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL"
                                        })} - {Number(item.quantity).toLocaleString("pt-BR")}(x) {item.description}
                                    </p>

                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.id!, -1)}
                                        className="px-2 py-1 cursor-pointer border rounded hover:bg-black/30"
                                        aria-label="Diminuir quantidade"
                                    >
                                        -
                                    </button>

                                    <span>
                                        {Number(item.quantity).toLocaleString("pt-BR")}
                                    </span>

                                    <button
                                        onClick={() => handleQuantityChange(item.id!, 1)}
                                        className="px-2 cursor-pointer py-1 border rounded hover:bg-black/30"
                                        aria-label="Aumentar quantidade"
                                    >
                                        +
                                    </button>

                                    <button
                                        onClick={() => handleRemoveItem(item.id!)}
                                        className="ml-4 cursor-pointer text-red-600 hover:text-red-800"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))}

                        <p className="text-right font-semibold mt-4">
                            Total: {Number(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>

                        <button
                            type="button"
                            className="bg-emerald-600 block mx-auto mt-6 cursor-pointer text-white px-6 py-2 rounded hover:bg-emerald-700"
                            onClick={submitPurchase}
                        >
                            Finalizar Compra
                        </button>
                    </div>
                </>
            )}

            {lastPurchase && (
                <div className="bg-green-100 border border-green-400 p-4 rounded mt-8">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Compra finalizada com Sucesso!</h3>
                    <p><strong>Número da Compra:</strong> {lastPurchase.purchaseNumber}</p>
                    <p><strong>Fornecedor:</strong> {lastPurchase.clientName}</p>
                    <p><strong>Data:</strong> {lastPurchase.date}</p>

                    <ul className="mt-2 list-disc list-inside">
                        {lastPurchase.items.map((item, index) => (
                            <li key={index}>
                                {item.productName} - {item.quantity}x R${item.price.toFixed(2).replace(".", ",")}
                            </li>
                        ))}
                    </ul>

                    <p className="mt-2 font-semibold">Total: R${lastPurchase.total.toFixed(2).replace(".", ",")}</p>
                </div>
            )}
        </main>
    )
}
