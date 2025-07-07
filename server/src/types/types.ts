export interface RegisterProps {
    name: string
    email: string
    password: string
}

export interface UserProps {
    name: String
    email: string
    password: string
    refreshToken?: string
    roles: Roles
}

interface Roles {
    User: number
    Editor?: number
    Admin?: number
}
