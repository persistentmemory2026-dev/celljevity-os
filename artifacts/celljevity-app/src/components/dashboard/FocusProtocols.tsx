import { Bolt, Inbox } from "lucide-react";

export interface Protocol {
  name: string;
  value: string;
  progress: number;
  color: "primary" | "secondary";
}

interface FocusProtocolsProps {
  protocols: Protocol[];
}

export function FocusProtocols({ protocols }: FocusProtocolsProps) {
  return (
    <div className="bg-card border border-border shadow-sm h-full p-6 rounded-xl flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-lg font-display text-card-foreground">Focus Protocols</h3>
        <Bolt className="w-4 h-4 text-primary opacity-70" strokeWidth={1.5} />
      </div>
      <div className="flex-1 space-y-8">
        {protocols.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-8">
            <Inbox className="w-8 h-8" />
            <p className="text-sm text-center">No active protocols</p>
          </div>
        ) : (
          protocols.map((protocol) => (
            <div key={protocol.name} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-foreground">
                  {protocol.name}
                </span>
                <span className="text-sm text-muted-foreground font-mono">{protocol.value}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full relative overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-1000 ${
                    protocol.color === "primary" ? "bg-primary" : "bg-primary/60"
                  }`}
                  style={{ width: `${protocol.progress}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
