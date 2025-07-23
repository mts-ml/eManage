import { createContext, useContext, useEffect, useState } from "react"

import type { Product, ProductFromBackend } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import AuthContext from "./AuthContext"


interface ProductsProviderProps {
    children: React.ReactNode
}

interface ProductData {
    products: Product[]
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>
}

const defaultValues: ProductData = {
    products: [],
    setProducts: () => { }
}

const ProductsContext = createContext(defaultValues)

export const ProductsProvider: React.FC<ProductsProviderProps> = ({ children }) => {
    const { loading } = useContext(AuthContext)
    const [products, setProducts] = useState<Product[]>([])
    const axiosPrivate = useAxiosPrivate()
    const { auth } = useContext(AuthContext)

    useEffect(() => {
        console.log("Loading:", loading)
        if (loading || !auth.accessToken) return

        async function getProducts() {
            try {
                const response = await axiosPrivate.get<ProductFromBackend[]>('/products')
                if (response.status === 204) {
                    setProducts([])
                    return
                }

                const normalizeProductsId = response.data.map(product =>
                    ({ ...product, id: product._id }))
                setProducts(normalizeProductsId)
            } catch (error) {
                console.log(error)
            }
        }
        getProducts()
    }, [axiosPrivate, loading])


    return (
        <ProductsContext.Provider value={{
            products,
            setProducts
        }}>
            {children}
        </ProductsContext.Provider>
    )
}

export default ProductsContext
