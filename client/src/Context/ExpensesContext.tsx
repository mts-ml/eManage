import { createContext, useState } from "react"

import type { Expense } from "../types/types"


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
