import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import Lineage from "./pages/Lineage";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout>
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/datasets" component={Datasets} />
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
