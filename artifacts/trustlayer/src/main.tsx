import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { client } from "./lib/appwrite";

client.ping().then(
  () => console.log("[appwrite] ping ok — connected to auth-test"),
  (err) => console.warn("[appwrite] ping failed:", err),
);

createRoot(document.getElementById("root")!).render(<App />);
