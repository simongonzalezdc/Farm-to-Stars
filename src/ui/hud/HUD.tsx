import type { ScenarioDefinition } from '../../game/scenario/loader';
import type { GameState } from '../../game/state/gameState';
import './HUD.css';

interface Props {
  scenario: ScenarioDefinition;
  gameState: GameState;
  onReturn: () => void;
}

const phaseIcons: Record<string, string> = {
  homestead: '🏠',
  township: '🏘️',
  nation: '🏛️',
  stellar: '🚀',
};

const civilizationIcons: Record<string, string> = {
  solar: '☀️',
  celestial: '⭐',
  merchant: '💰',
  mesa: '🏔️',
  pioneer: '🧭',
};

export function HUD({ scenario, gameState, onReturn }: Props) {
  return (
    <header className="hud">
      <div className="hud-left">
        <button className="menu-btn" onClick={onReturn}>
          ← Menu
        </button>
        <div className="scenario-info">
          <span className="civ-badge">
            {civilizationIcons[scenario.civilization]} {scenario.civilization}
          </span>
          <span className="scenario-name">{scenario.name}</span>
        </div>
      </div>

      <div className="hud-center">
        <div className="phase-indicator">
          <span className="phase-icon">{phaseIcons[gameState.phase]}</span>
          <span className="phase-name">{gameState.phase}</span>
        </div>
        <div className="week-indicator">
          Week {gameState.week}
        </div>
      </div>

      <div className="hud-right">
        <div className="resource-bar">
          <Resource icon="🪵" value={gameState.resources.wood} />
          <Resource icon="🪨" value={gameState.resources.stone} />
          <Resource icon="🌾" value={gameState.resources.food} />
          <Resource icon="💧" value={gameState.resources.water} />
          <Resource icon="👥" value={gameState.population} />
        </div>
      </div>
    </header>
  );
}

function Resource({ icon, value }: { icon: string; value: number }) {
  return (
    <div className="resource">
      <span className="resource-icon">{icon}</span>
      <span className="resource-value">{value}</span>
    </div>
  );
}
