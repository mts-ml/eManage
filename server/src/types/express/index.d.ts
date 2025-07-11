import 'express'
import { JwtPayload } from 'jsonwebtoken'


declare global {
    namespace Express {
        interface Request {
            name: string
            email: string
            roles: number[]
        }
    }
}
