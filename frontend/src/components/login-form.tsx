import {useState} from "react"
import {useNavigate} from "react-router-dom"
import {toast} from "sonner"
import {CircleCheck, CircleX} from "lucide-react"

import {cn} from "@/lib/utils"
import {supabase} from "@/lib/supabaseClient"

import {Button} from "@/components/ui/button"
import {Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator,} from "@/components/ui/field"
import {Input} from "@/components/ui/input"

export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentProps<"form">) {

    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error("请输入邮箱和密码", {
            })
            return
        }

        setLoading(true)

        try {
            const {error} = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error("登录失败", {
                    icon: <CircleX className="text-red-500"/>,
                    description: error.message,
                })
                return
            }

            toast.success("登录成功", {
                icon: <CircleCheck className="text-green-500"/>,
                description: "欢迎回来！",
            })

            setTimeout(() => {
                navigate("/home")
            }, 500)

        } catch (err) {
            console.error(err)

            toast.error("登录失败", {
                icon: <CircleX className="text-red-500"/>,
                description: "服务器发生错误，请稍后再试",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            onSubmit={handleLogin}
            {...props}
        >
            <FieldGroup>

                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">
                        Login to your account
                    </h1>

                    <p className="text-sm text-balance text-muted-foreground">
                        Enter your email below to login to your account
                    </p>
                </div>

                <Field>
                    <FieldLabel htmlFor="email">
                        Email
                    </FieldLabel>

                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                </Field>

                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">
                            Password
                        </FieldLabel>

                        <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                            Forgot your password?
                        </a>
                    </div>

                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                </Field>

                <Field>
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Field>

                <FieldSeparator>
                    Or continue with
                </FieldSeparator>

                <Field>
                    <Button
                        variant="outline"
                        type="button"
                        disabled={loading}
                    >
                        Login with GitHub
                    </Button>

                    <FieldDescription className="text-center">
                        Don&apos;t have an account?{" "}
                        <a
                            href="#"
                            className="underline underline-offset-4"
                        >
                            Sign up
                        </a>
                    </FieldDescription>
                </Field>

            </FieldGroup>
        </form>
    )
}