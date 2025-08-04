import { createContext, useContext, useEffect, useState } from "react"

import type { Expense, ExpenseFromBackend } from "../types/types"
import AuthContext from "./AuthContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface ExpensesProviderProps {
    children: React.ReactNode
}

interface ExpensesData {
    expenses: Expense[]
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
}

const defaultExpenses: ExpensesData = {
    expenses: [],
    setExpenses: () => { }
}

const ExpensesContext = createContext(defaultExpenses)


export const ExpensesProvider = ({ children }: ExpensesProviderProps) => {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const { auth } = useContext(AuthContext)
    const axiosPrivate = useAxiosPrivate()

    useEffect(() => {
        if (!auth.accessToken) return

        async function getExpenses() {
            try {
                const response = await axiosPrivate.get<ExpenseFromBackend[]>('/expenses')

                if (response.status === 204) {
                    setExpenses([])
                    return
                }

                const normalizedExpenses = response.data.map(expense => ({
                    ...expense, id: expense._id
                }))
                setExpenses(normalizedExpenses)

            } catch (error) {
                console.log("Erro ao carregar despesas: ", error)
            }
        }
        getExpenses()
    }, [auth.accessToken])

    return (
        <ExpensesContext.Provider value={{
            expenses,
            setExpenses
        }}>
            {children}
        </ExpensesContext.Provider>
    )
}

export default ExpensesContext
