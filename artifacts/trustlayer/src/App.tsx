import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import DatasetDetail from "./pages/DatasetDetail";
import Lineage from "./pages/Lineage";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "./lib/auth";
import { useWorkspace } from "./lib/workspace";
import { Loader2 } from "lucide-react";

export default function App() {
  const { user, loading } = useAuth();
  const { ready, mode } = useWorkspace();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-[#ff4d2e] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-[#ff4d2e] animate-spin" />
      </div>
    );
  }

  if (!mode) {
    return <Onboarding />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout>
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/datasets" component={Datasets} />
          <Route path="/datasets/:name" component={DatasetDetail} />
          <Route path="/lineage" component={Lineage} />
          <Route path="/assistant" component={Assistant} />
          <Route path="/settings" component={Settings} />
          <Route>
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </Layout>
    </WouterRouter>
  );
}
