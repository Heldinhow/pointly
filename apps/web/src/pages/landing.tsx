import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/site-header";
import "../styles/landing.css";

const STEPS = [
	["Crie uma sala para o time.", "Compartilhe o link. Cada pessoa entra com um apelido, sem conta."],
	["Pense por conta própria.", "Escolha uma carta. Seu voto fica escondido até a revelação para cada perspectiva aparecer."],
	["Descubram juntos.", "Revelem os votos, conversem sobre as diferenças e comecem outra rodada."],
] as const;

const PLAYERS = [
	["MA", "Marina", "5", "peach"],
	["RA", "Rafa", "8", "blue"],
	["VO", "Você", "5", "self"],
	["BI", "Bia", "3", "rose"],
] as const;

export function Landing() {
	const navigate = useNavigate();
	const handleCreateRoom = useCallback(() => navigate("/join?host=1"), [navigate]);
	const handleJoinRoom = useCallback(() => navigate("/join"), [navigate]);

	return (
		<div className="landing-page" data-testid="page-landing">
			<SiteHeader onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
			<main>
				<section className="landing-hero" aria-labelledby="hero-headline">
					<div className="landing-hero-copy">
						<h1 id="hero-headline" data-testid="hero-headline">Ideias diferentes.<br /><em>Na mesma mesa.</em></h1>
						<p className="landing-lede">Seu time, uma rodada de cartas e uma boa conversa. Estimem juntos com Planning Poker, sem criar conta.</p>
						<div className="landing-actions" role="group" aria-label="Ações da sala">
							<button type="button" className="landing-button landing-button-primary" onClick={handleCreateRoom} data-testid="cta-create-room">Criar uma sala <span aria-hidden="true">↗</span></button>
							<button type="button" className="landing-button landing-button-secondary" onClick={handleJoinRoom} data-testid="cta-join-room">Entrar com código</button>
						</div>
						<p className="landing-caption">Grátis. Até 12 pessoas. Só chegar e participar.</p>
					</div>
					<div className="landing-table-demo" role="img" aria-label="Demonstração ilustrativa de uma mesa com quatro participantes">
						<div className="landing-felt" aria-hidden="true"><strong>Vamos conversar?</strong><span>Cada ponto de vista conta.</span></div>
						{PLAYERS.map(([initials, name, vote, tone]) => (
							<div className={`landing-player landing-player-${tone}`} key={name} aria-hidden="true">
								<span className="landing-avatar">{initials}</span><span className="landing-player-name">{name}</span><span className="landing-mini-card">{vote}</span>
							</div>
						))}
						<span className="landing-demo-label" aria-hidden="true">exemplo de rodada</span>
					</div>
				</section>

				<section className="landing-steps" aria-labelledby="steps-title">
					<div className="landing-section-intro"><p className="landing-kicker">Como funciona</p><h2 id="steps-title">Uma rodada começa com espaço para todo mundo.</h2></div>
					<ol>{STEPS.map(([title, body], index) => <li key={title} data-testid={`cap-card-0${index + 1}`}><span className="landing-step-number" aria-hidden="true">0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
				</section>

			</main>
			<footer className="landing-footer">
				<span>Pointly · Uma boa conversa começa com perspectivas diferentes.</span>
				<span>Sem cadastro. Sem complicar.</span>
			</footer>
		</div>
	);
}
