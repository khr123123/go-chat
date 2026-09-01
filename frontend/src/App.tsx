import {HashRouter, Navigate, Route, Routes} from "react-router-dom"

import Login from "@/pages/Login"
import Home from "@/pages/Home"
import ProtectedRoute from "@/components/protected-route"

function App() {
    return (
        <HashRouter>
            <Routes>
                {/* 默认页面 */}
                <Route
                    path="/"
                    element={<Navigate to="/home" replace/>}
                />

                {/* 登录页面 */}
                <Route
                    path="/login"
                    element={<Login/>}
                />

                {/* 需要登录的页面 */}
                <Route element={<ProtectedRoute/>}>
                    <Route
                        path="/home"
                        element={<Home/>}
                    />

                    {/* 后面继续加 */}
                    {/* <Route path="/chat" element={<Chat />} /> */}
                    {/* <Route path="/profile" element={<Profile />} /> */}

                </Route>
                <Route
                    path="*"
                    element={<Navigate to="/home" replace/>}
                />

            </Routes>
        </HashRouter>
    )
}

export default App
