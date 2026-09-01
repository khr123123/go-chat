import {useState} from "react"
import {useNavigate} from "react-router-dom"
import {toast} from "sonner"

import {cn} from "@/lib/utils"
import {supabase} from "@/lib/supabaseClient"

import {Button} from "@/components/ui/button"
import {Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator} from "@/components/ui/field"
import {Input} from "@/components/ui/input"

export function LoginForm({className, ...props}: React.ComponentProps<"form">) {
    const navigate = useNavigate()
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            toast.error("请输入邮箱和密码", {description: "Email 和 Password 都不能为空"})
            return
        }
        setLoading(true)
        try {
            const {error} = await supabase.auth.signInWithPassword({email: email.trim(), password})
            if (error) {
                toast.error("登录失败", {description: error.message})
                return
            }
            toast.success("登录成功", {description: "欢迎回来！"})
            setTimeout(() => navigate("/"), 500)
        } catch {
            toast.error("登录失败", {description: "服务器发生错误，请稍后再试"})
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) {
            toast.error("请输入邮箱和密码", {description: "Email 和 Password 都不能为空"})
            return
        }
        if (password !== confirmPassword) {
            toast.error("注册失败", {description: "两次输入的密码不一致"})
            return
        }
        if (password.length < 6) {
            toast.error("注册失败", {description: "密码长度至少需要 6 位"})
            return
        }
        setLoading(true)
        try {
            const {error} = await supabase.auth.signUp({email: email.trim(), password})
            if (error) {
                toast.error("注册失败", {description: error.message})
                return
            }
            toast.success("注册成功", {description: "注册成功，请检查邮箱完成验证"})
            setIsRegister(false)
            setPassword("")
            setConfirmPassword("")
        } catch {
            toast.error("注册失败", {description: "服务器发生错误，请稍后再试"})
        } finally {
            setLoading(false)
        }
    }

    const switchMode = () => {
        setIsRegister(!isRegister)
        setEmail("")
        setPassword("")
        setConfirmPassword("")
    }

    return (
        <form className={cn("flex flex-col gap-6", className)}
              onSubmit={isRegister ? handleRegister : handleLogin} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">{isRegister ? "Create an account" : "Login to your account"}</h1>
                    <p className="text-sm text-balance text-muted-foreground">{isRegister ? "Enter your information to create your account" : "Enter your email below to login to your account"}</p>
                </div>

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" value={email}
                           onChange={(e) => setEmail(e.target.value)} disabled={loading} autoComplete="email" required/>
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                           disabled={loading} autoComplete={isRegister ? "new-password" : "current-password"} required/>
                </Field>

                {isRegister && (
                    <Field>
                        <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                        <Input id="confirm-password" type="password" value={confirmPassword}
                               onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
                               autoComplete="new-password" required/>
                    </Field>
                )}

                {!isRegister && (
                    <div className="flex justify-end">
                        <button type="button" onClick={() => navigate("/forgot-password")}
                                className="text-sm underline-offset-4 hover:underline">Forgot your password?
                        </button>
                    </div>
                )}

                <Field>
                    <Button type="submit" disabled={loading}
                            className="w-full">{loading ? (isRegister ? "Creating account..." : "Logging in...") : (isRegister ? "Create account" : "Login")}</Button>
                </Field>

                <FieldSeparator>Or continue with</FieldSeparator>

                <Field>
                    <Button variant="outline" type="button" disabled={loading} className="w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4"
                             fill="currentColor">
                            <path
                                d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.48 0-.237-.009-1.02-.013-1.85-2.782.604-3.369-1.342-3.369-1.342-.455-1.157-1.11-1.465-1.11-1.465-.908-.621.069-.609.069-.609 1.004.07 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.56 9.56 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.545 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .266.18.578.688.48A10.001 10.001 0 0 0 22 12C22 6.477 17.523 2 12 2Z"/>
                        </svg>
                        {isRegister ? "Sign up with GitHub" : "Login with GitHub"}
                    </Button>

                    <FieldDescription className="text-center">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button type="button" onClick={switchMode} disabled={loading}
                                className="underline underline-offset-4">{isRegister ? "Login" : "Sign up"}</button>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    )
}
