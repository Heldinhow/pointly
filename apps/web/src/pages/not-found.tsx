import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "./join.css";

export function NotFoundPage(): React.ReactElement {
  return (
    <div className="not-found-page">
      <Card className="not-found-card">
        <CardHeader className="not-found-header">
          <p className="join-card-kicker">Erro 404</p>
          <CardTitle render={<h1 />}>Página não encontrada</CardTitle>
          <CardDescription>Este endereço não existe por aqui.</CardDescription>
        </CardHeader>
        <CardFooter className="not-found-footer">
          <Button variant="outline" render={<Link to="/" />}>
            Voltar ao início
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
