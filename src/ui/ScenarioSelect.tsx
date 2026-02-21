import type { ScenarioDefinition } from '../game/scenario/loader';
import './ScenarioSelect.css';

interface Props {
  scenarios: ScenarioDefinition[];
  onSelect: (id: string) => void;
}

const civilizationColors: Record<string, string> = {
  solar: '#f4d03f',
  celestial: '#85c1e9',
  merchant: '#f39c12',
  mesa: '#e74c3c',
  pioneer: '#2ecc71',
};

const difficultyIcons: Record<string, string> = {
  easy: '🌱',
  normal: '🌿',
  hard: '🌳',
};

export function ScenarioSelect({ scenarios, onSelect }: Props) {
  return (
    <div className="scenario-select">
      <header className="header">
        <h1>🌾 Farm to Stars</h1>
        <p>Choose your civilization's journey</p>
      </header>

      <div className="scenarios-grid">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            className="scenario-card"
            onClick={() => onSelect(scenario.id)}
            style={{ 
              '--civ-color': civilizationColors[scenario.civilization] 
            } as React.CSSProperties}
          >
            <div className="scenario-header">
              <span className="civ-icon" style={{ color: civilizationColors[scenario.civilization] }}>
                {scenario.civilization === 'solar' && '☀️'}
                {scenario.civilization === 'celestial' && '⭐'}
                {scenario.civilization === 'merchant' && '💰'}
                {scenario.civilization === 'mesa' && '🏔️'}
                {scenario.civilization === 'pioneer' && '🧭'}
              </span>
              <span className="difficulty">{difficultyIcons[scenario.difficulty]}</span>
            </div>

            <h3>{scenario.name}</h3>
            <p className="description">{scenario.description}</p>

            <div className="scenario-meta">
              <span>⏱️ ~{scenario.estimatedWeeks} weeks</span>
              <span>👥 Start: {scenario.startingPopulation}</span>
            </div>

            <div className="tags">
              {scenario.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <footer className="footer">
        <p>Official Scenarios • Community content coming soon</p>
      </footer>
    </div>
  );
}
