import {HashRouter, Navigate, Route, Routes} from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"
import ProtectedRoute from "@/components/protected-route"

import Home from "@/pages/Home"
import Chat from "@/pages/Chat"
import Settings from "@/pages/Settings"
import Login from "@/pages/Login"

export default function App() {
    return (
        <HashRouter>
            <Routes>
                {/* 登录 */}
                <Route path="/login" element={<Login/>}/>
                {/* 登录验证 */}
                <Route element={<ProtectedRoute/>}>
                    {/* 主 Layout */}
                    <Route element={<AppLayout/>}>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/chat" element={<Chat/>}/>
                        <Route path="/settings" element={<Settings/>}/>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </HashRouter>
    )
}
