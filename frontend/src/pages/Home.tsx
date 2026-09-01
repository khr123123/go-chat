import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold">
                Home
            </h1>

            <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-md bg-black text-white hover:opacity-80"
            >
                登录
            </button>
        </div>
    );
}