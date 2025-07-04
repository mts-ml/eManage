import { Link } from "react-router-dom"
import leftArrow from '../assets/images/left-arrow.png'


export default function ErrorPage() {
    return (
        <main className="m-4">
            <h1 className="font-semibold mb-4">404 - Page not found!</h1>

            <Link to="/" className="relative inline-flex items-center gap-2 custom-underline">
                <img src={leftArrow} alt="Icon of a left arrow" />
                Go back to the homepage
            </Link>
        </main>
    )
}
