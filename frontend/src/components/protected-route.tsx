import {Navigate, Outlet} from "react-router-dom"
import {useEffect, useState} from "react"
import {supabase} from "@/lib/supabaseClient"
import {Spinner} from "@/components/ui/spinner"

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)

    useEffect(() => {
        checkAuth()
        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setAuthenticated(!!session)
                setLoading(false)
            }
        )
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const checkAuth = async () => {
        const {data: {session},} = await supabase.auth.getSession()
        setAuthenticated(!!session)
        setLoading(false)
    }
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner/>
            </div>
        )
    }
    if (!authenticated) {
        return <Navigate to="/login" replace/>
    }
    return <Outlet/>
}
