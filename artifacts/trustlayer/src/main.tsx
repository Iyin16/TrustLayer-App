import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./lib/auth";
import { WorkspaceProvider } from "./lib/workspace";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </AuthProvider>,
);
