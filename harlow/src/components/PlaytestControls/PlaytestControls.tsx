import ActionButton from "@/components/ActionButton/ActionButton";

export default function PlaytestControls({
  waitingLocked,
  onWait,
  showAdminTravel,
  onToggleAdminTravel,
  destinations,
  onTravel,
}: {
  waitingLocked: boolean;
  onWait: (minutes: number) => void;
  showAdminTravel: boolean;
  onToggleAdminTravel: () => void;
  destinations: { id: string; label: string }[];
  onTravel: (sceneId: string) => void;
}) {
  return (
    <>
      <div className="waitControls">
        <span>Pass time</span>
        <ActionButton label="Wait 1 min" disabled={waitingLocked} onClick={() => onWait(1)} />
        <ActionButton label="Wait 5 min" disabled={waitingLocked} onClick={() => onWait(5)} />
        <ActionButton label="Wait 10 min" disabled={waitingLocked} onClick={() => onWait(10)} />
        <ActionButton label="Wait 30 min" disabled={waitingLocked} onClick={() => onWait(30)} />
        <ActionButton label="Wait 1 hour" disabled={waitingLocked} onClick={() => onWait(60)} />
      </div>
      <div className="adminTravelControls">
        <ActionButton
          label={showAdminTravel ? "Hide admin travel" : "Admin travel"}
          onClick={onToggleAdminTravel}
        />
        {showAdminTravel && (
          <div
            className="adminTravelPanel"
            aria-label="Admin travel destinations"
          >
            <span>Free travel</span>
            <div>
              {destinations.map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() => onTravel(destination.id)}
                >
                  {destination.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
