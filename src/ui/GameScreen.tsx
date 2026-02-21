import type { ScenarioDefinition } from '../game/scenario/loader';
import type { GameState } from '../game/state/gameState';
import type { PresentedEvent } from '../game/decisions/engine';
import { EventCard } from './events/EventCard';
import { HUD } from './hud/HUD';
import { StrategicMap } from './map/StrategicMap';
import './GameScreen.css';

interface Props {
  scenario: ScenarioDefinition;
  gameState: GameState;
  currentEvent: PresentedEvent | null;
  loading: boolean;
  error: string | null;
  onChoice: (choiceId: string) => void;
  onReturn: () => void;
}

export function GameScreen({ 
  scenario, 
  gameState, 
  currentEvent, 
  loading, 
  error, 
  onChoice,
  onReturn 
}: Props) {
  return (
    <div className="game-screen">
      <HUD 
        scenario={scenario}
        gameState={gameState}
        onReturn={onReturn}
      />

      <div className="game-content">
        <StrategicMap 
          scenario={scenario}
          gameState={gameState}
        />

        {currentEvent && (
          <EventCard 
            event={currentEvent}
            onChoice={onChoice}
            disabled={loading}
          />
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">🌾</div>
            <p>The world is responding...</p>
          </div>
        )}

        {error && (
          <div className="error-overlay">
            <p>⚠️ {error}</p>
            <button onClick={onReturn}>Return to Menu</button>
          </div>
        )}
      </div>
    </div>
  );
}
