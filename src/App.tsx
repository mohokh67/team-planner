import { useRoute } from "./hooks/useRoute";
import { HomePage } from "./pages/HomePage";
import { PlanPage } from "./pages/PlanPage";

export default function App() {
  const { route, navigateToPlan, navigateHome } = useRoute();

  if (route.page === "plan") {
    return (
      <PlanPage id={route.id} token={route.token} onHome={navigateHome} />
    );
  }

  return <HomePage onOpenPlan={navigateToPlan} />;
}
