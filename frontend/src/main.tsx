import React from "react";
import {createRoot} from "react-dom/client";
import "@/index.css";
import App from "@/App";
import "@/style.css"
import {Toaster} from "@/components/ui/sonner"
import {CircleCheck, CircleX} from "lucide-react";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <App/>
        <Toaster position="top-right"
                 icons={{
                     success: <CircleCheck className="size-5 text-green-500"/>,
                     error: <CircleX className="size-5 text-red-500"/>,
                 }}
        />
    </React.StrictMode>
);
