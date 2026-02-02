import { cn } from "@/lib/utils";

export function ScoreBadge ({ score }: { score: number }) {
    let scoreColor;
    if(score < 50) {
        scoreColor = "bg-destructive";
    } else if(score < 90 && score >= 50) {
        scoreColor = "bg-amber-700";
    } else {
        scoreColor = "bg-green-700";
    }

    return (
        <div className="flex items-center justify-center text-center">
            <div className={cn("text-white font-semibold font-xl flex items-center justify-center size-8 rounded-full text-center", scoreColor)}>
                {score.toFixed(0)}
            </div>
        </div>
    )
}