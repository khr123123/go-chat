import {HashRouter, Navigate, Route, Routes} from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"

import Home from "@/pages/Home"
import Chat from "@/pages/Chat"
import Settings from "@/pages/Settings"
import Login from "@/pages/Login"

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route element={<AppLayout/>}>
                    <Route
                        path="/"
                        element={<Home/>}
                    />
                    <Route
                        path="/chat"
                        element={<Chat/>}
                    />
                    <Route
                        path="/settings"
                        element={<Settings/>}
                    />
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </HashRouter>
    )
}
