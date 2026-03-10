'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  count: {
    label: 'Box envoyées',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ]
  return `${monthNames[parseInt(m, 10) - 1]} ${year.slice(2)}`
}

type MonthlyChartProps = {
  data: Array<{ month: string; count: number }>
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }))

  if (chartData.length === 0 || chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Pas encore de données pour afficher le graphique.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
