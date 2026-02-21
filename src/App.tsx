import { useState, useEffect } from 'react';
import type { ScenarioDefinition } from './game/scenario/loader';
import type { GameState } from './game/state/gameState';
import { getOfficialScenarios, loadScenario } from './game/scenario/loader';
import { createInitialState } from './game/state/gameState';
import { createDecisionEngine, type PresentedEvent } from './game/decisions/engine';
import { createAIProvider } from './ai';
import { ScenarioSelect } from './ui/ScenarioSelect';
import { GameScreen } from './ui/GameScreen';
import './App.css';

type Screen = 'menu' | 'playing' | 'victory' | 'defeat';

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [currentScenario, setCurrentScenario] = useState<ScenarioDefinition | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<PresentedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScenarios(getOfficialScenarios());
  }, []);

  const startScenario = async (scenarioId: string) => {
    const scenario = loadScenario(scenarioId);
    if (!scenario) return;

    setCurrentScenario(scenario);
    const initialState = createInitialState(
      scenario.id,
      scenario.civilization,
      scenario.startingResources,
      scenario.startingPopulation
    );
    setGameState(initialState);
    setScreen('playing');
    setLoading(true);
    setError(null);

    try {
      // TODO: Get API key from config
      const ai = createAIProvider({ type: 'minimax', apiKey: 'demo-key' });
      const engine = createDecisionEngine(ai);
      const event = await engine.presentEvent(scenario, initialState);
      setCurrentEvent(event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const makeChoice = async (choiceId: string) => {
    if (!currentScenario || !gameState || !currentEvent) return;

    setLoading(true);
    try {
      const ai = createAIProvider({ type: 'minimax', apiKey: 'demo-key' });
      const engine = createDecisionEngine(ai);
      const outcome = await engine.makeChoice(
        currentScenario,
        gameState,
        currentEvent.id,
        choiceId
      );

      setGameState(outcome.newState);

      if (outcome.phaseAdvanced) {
        // Show phase transition
        setCurrentEvent({
          id: 'phase-transition',
          title: `Advancement: ${outcome.newState.phase}`,
          narrative: `Your civilization has grown! You now enter the ${outcome.newState.phase} phase.`,
          choices: [{ id: 'continue', text: 'Continue' }],
        });
      } else if (outcome.nextEventId) {
        const nextEvent = await engine.presentEvent(currentScenario, outcome.newState);
        setCurrentEvent(nextEvent);
      } else {
        const nextEvent = await engine.presentEvent(currentScenario, outcome.newState);
        setCurrentEvent(nextEvent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process choice');
    } finally {
      setLoading(false);
    }
  };

  const returnToMenu = () => {
    setScreen('menu');
    setCurrentScenario(null);
    setGameState(null);
    setCurrentEvent(null);
    setError(null);
  };

  return (
    <div className="app">
      {screen === 'menu' && (
        <ScenarioSelect 
          scenarios={scenarios} 
          onSelect={startScenario}
        />
      )}

      {screen === 'playing' && currentScenario && gameState && (
        <GameScreen
          scenario={currentScenario}
          gameState={gameState}
          currentEvent={currentEvent}
          loading={loading}
          error={error}
          onChoice={makeChoice}
          onReturn={returnToMenu}
        />
      )}
    </div>
  );
}
