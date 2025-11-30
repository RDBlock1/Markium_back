"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts"
import type { AnalyticsData } from "@/lib/types"

interface AnalyticsChartsProps {
    data: AnalyticsData
}

const SOURCES_COLORS = ["#06b6d4", "#0ea5e9", "#0284c7", "#2563eb"]
const TOPICS_COLORS = ["#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981"]
const TIMELINE_COLORS = "#6366f1"

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-6"
        >
            <div className="glass-card rounded-xl p-8 border border-border space-y-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-semibold text-primary uppercase tracking-widest">Real-time Analytics</span>
                </div>
                <h2 className="text-4xl font-bold text-foreground">Analytics Dashboard</h2>
                <p className="text-muted-foreground">
                    Comprehensive insights from {data.mentionsBySpeaker.reduce((a, b) => a + b.count, 0)} total mentions
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {/* Sources Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <Card className="glass-card border border-border bg-gradient-to-br from-card/40 to-card/20 h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-foreground">Content Sources</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">Platform distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={data.mentionsBySource} margin={{ top: 10, right: 15, left: 0, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" vertical={false} />
                                    <XAxis
                                        dataKey="source"
                                        stroke="rgba(255, 255, 255, 0.3)"
                                        tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 11 }}
                                        angle={-20}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 15, 18, 0.95)",
                                            border: "1px solid rgba(6, 182, 212, 0.3)",
                                            borderRadius: "8px",
                                            color: "#fff",
                                            padding: "8px 12px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Topics Distribution Chart
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                >
                    <Card className="glass-card border border-border bg-gradient-to-br from-card/40 to-card/20 h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-foreground">Topic Distribution</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">Conversation breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={data.topicDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={70}
                                        dataKey="value"
                                    >
                                        {data.topicDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={TOPICS_COLORS[index % TOPICS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 15, 18, 0.95)",
                                            border: "1px solid rgba(99, 102, 241, 0.3)",
                                            borderRadius: "8px",
                                            color: "#fff",
                                            padding: "8px 12px",
                                            fontSize: "12px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div> */}
            </div>

            {/* Timeline Chart - Full Width */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
            >
                <Card className="glass-card border border-border bg-gradient-to-br from-card/40 to-card/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-foreground">Mentions Trend</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">Volume over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data.mentionsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                                <defs>
                                    <linearGradient id="colorTimeline" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255, 255, 255, 0.3)"
                                    tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 11 }}
                                    angle={-20}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis stroke="rgba(255, 255, 255, 0.3)" tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "rgba(15, 15, 18, 0.95)",
                                        border: "1px solid rgba(99, 102, 241, 0.3)",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTimeline)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
