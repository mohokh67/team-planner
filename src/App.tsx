import { useRoute } from "./hooks/useRoute";
import { HomePage } from "./pages/HomePage";
import { PlanPage } from "./pages/PlanPage";

export default function App() {
  const { route, navigateToPlan, navigateHome } = useRoute();

  if (route.page === "plan") {
    return (
      // Force a fresh mount whenever id or token changes, so PlanPage's
      // load/editAllowed state can never carry over from a different plan
      // or a different edit token for the same plan.
      <PlanPage
        key={`${route.id}:${route.token ?? ""}`}
        id={route.id}
        token={route.token}
        onHome={navigateHome}
      />
    );
  }

  return <HomePage onOpenPlan={navigateToPlan} />;
}
