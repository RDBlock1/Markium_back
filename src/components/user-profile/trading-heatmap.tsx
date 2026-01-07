import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Zap } from 'lucide-react';

interface HourlyActivity {
    hour: number;
    time: string;
    trades: number;
    volume: number;
}

interface TradingActivityHeatmapProps {
    hourlyActivity: HourlyActivity[];
    mostActiveHour: string;
}

export function TradingActivityHeatmap({ hourlyActivity, mostActiveHour }: TradingActivityHeatmapProps) {
    const maxTrades = Math.max(...hourlyActivity.map(h => h.trades));

    return (
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-lg border border-purple-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Trading Activity Heatmap
                </CardTitle>
                <p className="text-sm text-gray-400">24-hour trading pattern (your local time)</p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
                    {hourlyActivity.map((hour) => {
                        const intensity = maxTrades > 0 ? hour.trades / maxTrades : 0;

                        return (
                            <div
                                key={hour.hour}
                                className="h-16 rounded cursor-pointer hover:scale-110 transition-all relative group"
                                style={{
                                    backgroundColor: `rgba(6, 182, 212, ${intensity})`,
                                    opacity: hour.trades === 0 ? 0.2 : 1
                                }}
                            >
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    <div className="font-semibold">{hour.time}</div>
                                    <div>{hour.trades} trades</div>
                                    {hour.volume > 0 && (
                                        <div>${hour.volume.toFixed(0)}</div>
                                    )}
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>

                                {/* Hour label - show every 2 hours on mobile, every hour on desktop */}
                                {(hour.hour % 2 === 0 || window.innerWidth >= 640) && (
                                    <div className="absolute -bottom-6 text-xs text-gray-500 text-center w-full">
                                        <span className="hidden sm:inline">{hour.time.split(' ')[0]}</span>
                                        <span className="sm:hidden">{hour.hour % 3 === 0 ? hour.time.split(' ')[0] : ''}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Less</span>
                        <div className="flex gap-1">
                            {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                                <div
                                    key={opacity}
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: `rgba(6, 182, 212, ${opacity})` }}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-400">More</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-400">
                            Most active: <strong className="text-cyan-400">{mostActiveHour}</strong>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}