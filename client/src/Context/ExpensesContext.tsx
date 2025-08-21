import { createContext, useContext, useEffect, useState } from "react"

import type { Expense, ExpenseFromBackend } from "../types/types"
import AuthContext from "./AuthContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import { logError } from "../utils/logger"


interface ExpensesProviderProps {
    children: React.ReactNode
}

interface ExpensesData {
    expenses: Expense[]
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
    lastExpense: Expense | null
    getLastExpense: () => Promise<void>
}

const defaultExpenses: ExpensesData = {
    expenses: [],
    setExpenses: () => { },
    lastExpense: null,
    getLastExpense: async () => { }
}

const ExpensesContext = createContext(defaultExpenses)


export const ExpensesProvider = ({ children }: ExpensesProviderProps) => {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [lastExpense, setLastExpense] = useState<Expense | null>(null)
    const { auth } = useContext(AuthContext)
    const axiosPrivate = useAxiosPrivate()

    async function getLastExpense() {
        try {
            const response = await axiosPrivate.get<{ expense: ExpenseFromBackend }>('/expenses/lastExpense')
            
            if (response.status === 204) {
                setLastExpense(null)
                return
            }

            const normalizedExpense = {
                ...response.data.expense,
                id: response.data.expense._id
            }
            setLastExpense(normalizedExpense)
        } catch (error) {
            logError("ExpensesContext", error)
        }
    }

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
                    ...expense,
                    id: expense._id
                }))
                setExpenses(normalizedExpenses)

            } catch (error) {
                logError("ExpensesContext", error)
            }
        }
        getExpenses()
    }, [auth.accessToken])

    return (
        <ExpensesContext.Provider value={{
            expenses,
            setExpenses,
            lastExpense,
            getLastExpense
        }}>
            {children}
        </ExpensesContext.Provider>
    )
}
export default ExpensesContext
