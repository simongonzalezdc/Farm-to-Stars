import type { ScenarioDefinition } from '../../game/scenario/loader';
import type { GameState } from '../../game/state/gameState';
import './StrategicMap.css';

interface Props {
  scenario: ScenarioDefinition;
  gameState: GameState;
}

export function StrategicMap({ gameState }: Props) {
  // Simple grid representation of the homestead/township
  const gridSize = gameState.phase === 'homestead' ? 3 : 5;
  
  return (
    <div className="strategic-map">
      <div className="map-container">
        <div 
          className="map-grid"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const isCenter = x === Math.floor(gridSize / 2) && y === Math.floor(gridSize / 2);
            
            return (
              <div 
                key={i} 
                className={`map-tile ${isCenter ? 'center' : ''}`}
              >
                {isCenter && <span className="tile-icon">🏠</span>}
                {!isCenter && gameState.phase !== 'homestead' && (
                  <span className="tile-icon small">🌾</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="map-legend">
          <div className="legend-item">
            <span>🏠</span> Headquarters
          </div>
          <div className="legend-item">
            <span>🌾</span> Farms
          </div>
          <div className="legend-item">
            <span>🏘️</span> Districts: {gameState.phaseProgress.township.districtsBuilt}
          </div>
        </div>
      </div>

      <div className="phase-progress">
        <h4>Phase Progress</h4>
        <ProgressBar 
          label="Population" 
          current={gameState.population} 
          target={getPhaseTarget(gameState.phase)}
        />
        <ProgressBar 
          label="Week" 
          current={gameState.week} 
          target={getWeekTarget(gameState.phase)}
        />
      </div>
    </div>
  );
}

function ProgressBar({ label, current, target }: { label: string; current: number; target: number }) {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div className="progress-item">
      <div className="progress-label">
        <span>{label}</span>
        <span>{current} / {target}</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getPhaseTarget(phase: string): number {
  switch (phase) {
    case 'homestead': return 50;
    case 'township': return 200;
    case 'nation': return 1000;
    case 'stellar': return 10000;
    default: return 100;
  }
}

function getWeekTarget(phase: string): number {
  switch (phase) {
    case 'homestead': return 13;
    case 'township': return 24;
    case 'nation': return 40;
    case 'stellar': return 56;
    default: return 10;
  }
}
