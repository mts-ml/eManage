import { useContext, useState } from "react"
import axios from "axios"

import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa'
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import ProductsContext from "../Context/ProductsContext"
import type { Product } from "../types/types"


export const Products: React.FC = () => {
    const defaultValues: Product = {
        name: "",
        description: "",
        salePrice: "",
        purchasePrice: "",
        stock: "",
        group: ""
    }

    const [form, setForm] = useState<Product>(defaultValues)
    const [errors, setErrors] = useState<Partial<Product>>({})
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [editingProductId, setEditingProductId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [showForm, setShowForm] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [selectedGroup, setSelectedGroup] = useState<string>("")
    const { products, setProducts } = useContext(ProductsContext)
    const axiosPrivate = useAxiosPrivate()

    // Filtrar produtos baseado no termo de busca e grupo
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGroup = selectedGroup === "" || product.group === selectedGroup
        return matchesSearch && matchesGroup
    })

    // Obter grupos únicos dos produtos
    const uniqueGroups = Array.from(new Set(products.map(product => product.group))).filter(group => group)


    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof Product,
            value: string
        }

        const formattedValue = name === "salePrice" || name === "purchasePrice" ? value.replace(',', '.') : value

        const updatedForm = { ...form, [name]: formattedValue }
        setForm(updatedForm)

        setErrorMessage(null)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(field => field.trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formValidation(form: Product): Partial<Product> {
        const errors: Partial<Product> = {}

        if (!form.name.trim()) errors.name = "Campo obrigatório"
        if (!form.description.trim()) errors.description = "Campo obrigatório"
        if (!form.group.trim()) errors.group = "Campo obrigatório"

        if (!form.salePrice.trim()) {
            errors.salePrice = "Campo obrigatório"
        } else if (isNaN(Number(form.salePrice)) || Number(form.salePrice) <= 0) {
            errors.salePrice = "Preço inválido"
        }
        if (!form.purchasePrice.trim()) {
            errors.purchasePrice = "Campo obrigatório"
        } else if (isNaN(Number(form.purchasePrice)) || Number(form.purchasePrice) <= 0) {
            errors.purchasePrice = "Preço inválido"
        }
        if (!form.stock.trim()) {
            errors.stock = "Campo obrigatório"
        } else if (!/^\d+$/.test(form.stock) || Number(form.stock) <= 0) {
            errors.stock = "Estoque inválido"
        }

        return errors
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        try {
            if (editingProductId) {
                const response = await axiosPrivate.put(`/products/${editingProductId}`, form)
                const updatedProduct: Product = { ...response.data, id: response.data._id }

                setProducts(prev =>
                    prev.map(product => product.id === editingProductId ? updatedProduct : product)
                )
            } else {
                const response = await axiosPrivate.post('/products', form)
                const newProduct: Product = { ...response.data, id: response.data._id }

                setProducts(prev => [...prev, newProduct])
            }

            setEditingProductId(null)
            setForm(defaultValues)
            setErrors(defaultValues)
            setIsReadyToSubmit(false)
            setErrorMessage(null)
            setShowForm(false)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data
                if (error.response?.status === 409 && data) {
                    const { field, message } = data
                    setErrorMessage(message)

                    if (field) {
                        setErrors(prev => ({ ...prev, [field]: message }))
                    }
                } else {
                    setErrorMessage("Erro inesperado. Tente novamente.")
                }
            } else {
                setErrorMessage("Erro inesperado. Tente novamente.")
            }
        }
    }

    function handleEditProduct(product: Product) {
        setEditingProductId(product.id || null)

        setForm({
            name: product.name,
            description: product.description,
            salePrice: String(product.salePrice ?? ""),
            purchasePrice: String(product.purchasePrice ?? ""),
            stock: String(product.stock ?? ""),
            group: product.group ?? "",
        })

        setShowForm(true)
    }


    async function handleDeleteProduct(productId: string) {
        try {
            if (confirm("Tem certeza que deseja excluir este produto?")) {
                await axiosPrivate.delete(`products/${productId}`)
                setProducts(prev => prev.filter(product => product.id !== productId))
            }

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2 text-center">
                📦 Cadastro de Produtos
            </h1>
            <p className="text-gray-600 font-medium text-center mb-8">Gerencie seu catálogo de produtos</p>

            {!showForm && (
                <div className="text-center mb-8">
                    <button
                        type="button"
                        onClick={() => {
                            setForm(defaultValues)
                            setEditingProductId(null)
                            setShowForm(true)
                            setErrors(defaultValues)
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        ➕ Novo Produto
                    </button>
                </div>
            )}

            {showForm && (
                <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">
                        {editingProductId ? "✏️ Editar Produto" : "➕ Novo Produto"}
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        aria-label="Formulário de cadastro de produtos"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Nome */}
                            <article>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nome <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    placeholder="Nome do produto"
                                    value={form.name}
                                    onChange={handleChange}
                                    aria-describedby="nameError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                />
                                {errors.name && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.name}
                                    </p>
                                )}
                            </article>

                            {/* Preço de Venda */}
                            <article>
                                <label htmlFor="salePrice" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Preço de Venda <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="salePrice"
                                    name="salePrice"
                                    placeholder="0.00"
                                    value={form.salePrice}
                                    onChange={handleChange}
                                    aria-describedby="salePriceError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                />

                                {errors.salePrice && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.salePrice}
                                    </p>
                                )}
                            </article>

                            {/* Preço de Compra */}
                            <article>
                                <label htmlFor="purchasePrice" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Preço de Compra <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="purchasePrice"
                                    name="purchasePrice"
                                    placeholder="0.00"
                                    value={form.purchasePrice}
                                    onChange={handleChange}
                                    aria-describedby="purchasePriceError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                />

                                {errors.purchasePrice && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.purchasePrice}
                                    </p>
                                )}
                            </article>

                            {/* Estoque */}
                            <article>
                                <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Estoque <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="stock"
                                    name="stock"
                                    placeholder="0"
                                    value={form.stock}
                                    onChange={handleChange}
                                    aria-describedby="stockError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                />
                                {errors.stock && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.stock}
                                    </p>
                                )}
                            </article>

                            {/* Grupo */}
                            <article>
                                <label htmlFor="group" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Grupo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="group"
                                    name="group"
                                    value={form.group}
                                    onChange={handleChange}
                                    aria-describedby="groupError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="">Selecione um grupo</option>
                                    <option value="Temperos">Temperos</option>
                                    <option value="Vegetais">Vegetais</option>
                                    <option value="Frutas">Frutas</option>
                                    <option value="Outros">Outros</option>
                                </select>
                                {errors.group && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.group}
                                    </p>
                                )}
                            </article>

                            {/* Descrição */}
                            <article className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Descrição do produto, g ou kg."
                                    value={form.description}
                                    onChange={handleChange}
                                    aria-describedby="descriptionError"
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                                    rows={4}
                                />

                                {errors.description && (
                                    <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                        <span className="mr-1">⚠️</span>
                                        {errors.description}
                                    </p>
                                )}
                            </article>
                        </div>

                        <div className="flex gap-6 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(defaultValues)
                                    setEditingProductId(null)
                                    setShowForm(false)
                                    setErrors(defaultValues)
                                }}
                                className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer font-semibold transition-all duration-300"
                            >
                                ❌ Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={!isReadyToSubmit}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${isReadyToSubmit ? "bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                            >
                                {editingProductId ? "💾 Atualizar" : "💾 Salvar"} Produto
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 font-medium text-center flex items-center justify-center">
                                    <span className="mr-2">❌</span>
                                    {errorMessage}
                                </p>
                            </div>
                        )}
                    </form>
                </section>
            )}

            {products.length > 0 && (
                <>
                    <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">📋 Lista de Produtos</h2>

                    {/* Filtros de Busca */}
                    <aside className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">

                            {/* Input de Busca por Nome */}
                            <div className="relative max-w-md w-full self-end">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Buscar produto pelo nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                />
                            </div>

                            {/* Filtro por Grupo */}
                            <div className="max-w-md w-full">
                                <label
                                    htmlFor="groupFilter"
                                    className="block text-sm font-semibold text-gray-700 pl-3 mb-2"
                                >
                                    Filtrar por Grupo
                                </label>

                                <select
                                    id="groupFilter"
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="block cursor-pointer w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                >
                                    <option value="">Todos os grupos</option>
                                    {uniqueGroups.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(searchTerm || selectedGroup) && (
                            <p className="text-center text-sm text-gray-600 mt-2">
                                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </aside>

                    <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Nome</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Grupo</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Preço de Venda</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Preço de Compra</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Estoque</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Unidade</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-center">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-center">{product.name}</td>

                                        <td className="px-6 py-4 text-sm text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.group === 'Temperos' ? 'bg-orange-100 text-orange-800' :
                                                product.group === 'Vegetais' ? 'bg-green-100 text-green-800' :
                                                    product.group === 'Frutas' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {product.group}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-bold text-emerald-700 text-center">
                                            {Number(product.salePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-bold text-blue-700 text-center">
                                            {Number(product.purchasePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-bold text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${Number(product.stock) > 10 ? "bg-green-100 text-green-800" : Number(product.stock) > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                                {product.stock}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-center">{product.description}</td>

                                        <td className="px-6 py-4 text-sm flex gap-3 justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleEditProduct(product)}
                                                className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                aria-label="Editar produto."
                                            >
                                                <FaEdit size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProduct(product.id!)}
                                                className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                aria-label="Excluir produto"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </main>
    )
}
