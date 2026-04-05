import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">Page not found.</p>
      <Button onClick={() => navigate("/wiki")}>Back to wiki</Button>
    </div>
  );
}
