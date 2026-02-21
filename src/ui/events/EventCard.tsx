import type { PresentedEvent } from '../../game/decisions/engine';
import './EventCard.css';

interface Props {
  event: PresentedEvent;
  onChoice: (choiceId: string) => void;
  disabled?: boolean;
}

export function EventCard({ event, onChoice, disabled }: Props) {
  return (
    <div className="event-overlay">
      <div className="event-card">
        {event.illustration && (
          <div className="event-illustration">
            <img src={event.illustration} alt={event.title} />
          </div>
        )}

        <div className="event-content">
          <h2>{event.title}</h2>
          <p className="event-narrative">{event.narrative}</p>

          <div className="choices">
            {event.choices.map(choice => (
              <button
                key={choice.id}
                className="choice-button"
                onClick={() => onChoice(choice.id)}
                disabled={disabled || choice.disabled}
                title={choice.disabledReason}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
