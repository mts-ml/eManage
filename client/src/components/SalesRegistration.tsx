import { useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import type { AxiosResponse } from "axios"


import ProductsContext from "../Context/ProductsContext"
import ClientsContext from "../Context/ClientsContext"
import type { Product, SalePayload, SaleResponse } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface CartItem extends Product {
    quantity: number
}

export const SalesRegistration: React.FC = () => {
    const { clients } = useContext(ClientsContext)
    const { products, setProducts } = useContext(ProductsContext)

    const [cart, setCart] = useState<CartItem[]>([])
    const [lastSale, setLastSale] = useState<SaleResponse["sale"] | null>(null)
    const [selectedClientId, setSelectedClientId] = useState<string>("")
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(0)
    const axiosPrivate = useAxiosPrivate()

    const today = new Date().toLocaleDateString("pt-BR")
    const selectedProduct = products.find(p => p.id === selectedProductId)
    const selectedClient = clients.find(c => c.id === selectedClientId)

    useEffect(() => {
        async function getLastSale() {
            try {
                const response = await axiosPrivate.get('/sales/last')
                setLastSale(response.data.sale)
            } catch (error) {
                console.log("Erro ao buscar a última venda:", error)
                return
            }
        }

        getLastSale()
    }, [])

    function handleAddToCart(product: Product, quantity: number) {
        setCart(prev => {
            const existingProduct = prev.find(item => item.id === product.id)
            const currentQuantity = existingProduct ? existingProduct.quantity : 0
            const maxAddable = Number(product.stock) - currentQuantity

            if (quantity > maxAddable) {
                alert(`Quantidade excede o estoque disponível (${product.stock}).`)
                return prev
            }
            if (quantity < 1) {
                alert("A quantidade deve ser pelo menos 1.")
                return prev
            }
            if (quantity <= maxAddable && quantity >= 1) {
                setSelectedProductId("")
            }

            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity }]
            }

        })


        setQuantity(1)
    }

    function handleQuantityChange(id: string, delta: number) {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(1, Math.min(item.quantity + delta, Number(item.stock)))
                    }
                    : item
            )
        )
    }

    function handleRemoveItem(id: string) {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    async function submitSale() {
        const salePayload: SalePayload = {
            clientId: selectedClientId,
            clientName: selectedClient?.name || "Cliente Desconhecido",
            date: today,
            items: cart
                .map(item => ({
                    productId: item.id!,
                    productName: item.name,
                    quantity: item.quantity,
                    price: Number(item.price)
                }),
                ),
            total,
        }

        if (!selectedClientId || cart.length === 0) {
            alert("Selecione um cliente e adicione produtos ao carrinho.")
            return
        }

        try {
            const response: AxiosResponse<SaleResponse> = await axiosPrivate.post('/sales', salePayload)

            const { sale, updatedProducts } = response.data

            setProducts((prev: Product[]) =>
                prev.map(product => {
                    const updatedProduct = updatedProducts.find(p => p.id === product.id)

                    return updatedProduct ? { ...product, stock: updatedProduct.stock } : product
                })
            )

            setLastSale(sale)
        } catch (error) {
            console.error(error)
            alert('Erro ao finalizar a venda.')
            return
        }

        alert("Venda finalizada com sucesso")
        setCart([])
        setSelectedClientId("")
        setSelectedProductId("")
        setQuantity(1)
    }

    const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)


    return (
        <main className="p-6 max-w-3xl mx-auto">

            <h2 className="text-2xl font-bold mb-8 text-center">
                Vendas
            </h2>

            {/* Selecionar cliente e produto */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <p className="text-lg font-medium">
                        Venda Nº {lastSale ? lastSale.saleNumber + 1 : '-'}
                    </p>

                    <div className="text-sm text-gray-600">
                        Data: {today}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="client" className="block text-sm font-medium mb-1">
                        Cliente
                    </label>

                    <select
                        id="client"
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="w-full border cursor-pointer border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
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
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {selectedProduct && selectedClient && (
                <section className="mb-8 border rounded-md p-4 bg-gray-50">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="mb-2">Cliente: <strong>{selectedClient.name}</strong></p>

                            <button
                                type="button"
                                aria-label="Fechar aba de venda."
                            >
                                <X
                                    onClick={() => {
                                        setSelectedProductId("")
                                        setSelectedClientId("")
                                    }}
                                    className="w-5 h-5 text-gray-500 hover:cursor-pointer hover:text-black" />
                            </button>
                        </div>

                        <p className="mb-2">
                            Produto: <strong>{selectedProduct.name}</strong>
                        </p>

                        <p className="text-sm text-gray-600 mb-2">
                            Preço: <strong>R${Number(selectedProduct.price).toFixed(2).replace(".", ",")}</strong>
                        </p>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Estoque disponível: <strong>{selectedProduct.stock} {selectedProduct.description}</strong>
                    </p>

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
                            max={selectedProduct.stock}
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


            {selectedClientId && cart.length > 0 && (
                <>
                    <h3 className="text-lg font-semibold mb-2">
                        Carrinho
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Cliente: <span className="font-medium">{selectedClient?.name}</span>
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
                                        R${Number(item.price).toFixed(2).replace(".", ",")} x {item.quantity}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.id!, -1)}
                                        className="px-2 py-1 cursor-pointer border rounded hover:bg-black/30"
                                    >
                                        -
                                    </button>

                                    <span>
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => handleQuantityChange(item.id!, 1)}
                                        className="px-2 cursor-pointer py-1 border rounded hover:bg-black/30"
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
                            Total: R${total.toFixed(2).replace(".", ",")}
                        </p>

                        <button
                            type="button"
                            className="bg-emerald-600 block mx-auto mt-6 cursor-pointer text-white px-6 py-2 rounded hover:bg-emerald-700"
                            onClick={() => submitSale()}
                        >
                            Finalizar Compra
                        </button>
                    </div>
                </>
            )}

            {lastSale && (
                <div className="bg-green-100 border border-green-400 p-4 rounded mt-8">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Venda Finalizada com Sucesso!</h3>
                    <p><strong>Número da Venda:</strong> {lastSale.saleNumber}</p>
                    <p><strong>Cliente:</strong> {lastSale.clientName}</p>
                    <p><strong>Data:</strong> {lastSale.date}</p>

                    <ul className="mt-2 list-disc list-inside">
                        {lastSale.items.map((item, index) => (
                            <li key={index}>
                                {item.productName} - {item.quantity}x R${item.price.toFixed(2).replace(".", ",")}
                            </li>
                        ))}
                    </ul>

                    <p className="mt-2 font-semibold">Total: R${lastSale.total.toFixed(2).replace(".", ",")}</p>
                </div>
            )}
        </main>
    )
}
