import React from "react";
import {createRoot} from "react-dom/client";
import "@/index.css";
import App from "@/App";
import "@/style.css"
import {Toaster} from "@/components/ui/sonner"

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <App/>
        <Toaster className="toaster group"
                 position="top-right"
                 toastOptions={{
                     classNames: {
                         icon: "mr-2",
                         success: "text-green-500",
                         error: "text-red-500",
                     },
                 }}/>
    </React.StrictMode>
);
