"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", sale: 222, profit: 150 },
  { date: "2024-04-02", sale: 97, profit: 180 },
  { date: "2024-04-03", sale: 167, profit: 120 },
  { date: "2024-04-04", sale: 242, profit: 260 },
  { date: "2024-04-05", sale: 373, profit: 290 },
  { date: "2024-04-06", sale: 301, profit: 340 },
  { date: "2024-04-07", sale: 245, profit: 180 },
  { date: "2024-04-08", sale: 409, profit: 320 },
  { date: "2024-04-09", sale: 59, profit: 110 },
  { date: "2024-04-10", sale: 261, profit: 190 },
  { date: "2024-04-11", sale: 327, profit: 350 },
  { date: "2024-04-12", sale: 292, profit: 210 },
  { date: "2024-04-13", sale: 342, profit: 380 },
  { date: "2024-04-14", sale: 137, profit: 220 },
  { date: "2024-04-15", sale: 120, profit: 170 },
  { date: "2024-04-16", sale: 138, profit: 190 },
  { date: "2024-04-17", sale: 446, profit: 360 },
  { date: "2024-04-18", sale: 364, profit: 410 },
  { date: "2024-04-19", sale: 243, profit: 180 },
  { date: "2024-04-20", sale: 89, profit: 150 },
  { date: "2024-04-21", sale: 137, profit: 200 },
  { date: "2024-04-22", sale: 224, profit: 170 },
  { date: "2024-04-23", sale: 138, profit: 230 },
  { date: "2024-04-24", sale: 387, profit: 290 },
  { date: "2024-04-25", sale: 215, profit: 250 },
  { date: "2024-04-26", sale: 75, profit: 130 },
  { date: "2024-04-27", sale: 383, profit: 420 },
  { date: "2024-04-28", sale: 122, profit: 180 },
  { date: "2024-04-29", sale: 315, profit: 240 },
  { date: "2024-04-30", sale: 454, profit: 380 },
  { date: "2024-05-01", sale: 165, profit: 220 },
  { date: "2024-05-02", sale: 293, profit: 310 },
  { date: "2024-05-03", sale: 247, profit: 190 },
  { date: "2024-05-04", sale: 385, profit: 420 },
  { date: "2024-05-05", sale: 481, profit: 390 },
  { date: "2024-05-06", sale: 498, profit: 520 },
  { date: "2024-05-07", sale: 388, profit: 300 },
  { date: "2024-05-08", sale: 149, profit: 210 },
  { date: "2024-05-09", sale: 227, profit: 180 },
  { date: "2024-05-10", sale: 293, profit: 330 },
  { date: "2024-05-11", sale: 335, profit: 270 },
  { date: "2024-05-12", sale: 197, profit: 240 },
  { date: "2024-05-13", sale: 197, profit: 160 },
  { date: "2024-05-14", sale: 448, profit: 490 },
  { date: "2024-05-15", sale: 473, profit: 380 },
  { date: "2024-05-16", sale: 338, profit: 400 },
  { date: "2024-05-17", sale: 499, profit: 420 },
  { date: "2024-05-18", sale: 315, profit: 350 },
  { date: "2024-05-19", sale: 235, profit: 180 },
  { date: "2024-05-20", sale: 177, profit: 230 },
  { date: "2024-05-21", sale: 82, profit: 140 },
  { date: "2024-05-22", sale: 81, profit: 120 },
  { date: "2024-05-23", sale: 252, profit: 290 },
  { date: "2024-05-24", sale: 294, profit: 220 },
  { date: "2024-05-25", sale: 201, profit: 250 },
  { date: "2024-05-26", sale: 213, profit: 170 },
  { date: "2024-05-27", sale: 420, profit: 460 },
  { date: "2024-05-28", sale: 233, profit: 190 },
  { date: "2024-05-29", sale: 78, profit: 130 },
  { date: "2024-05-30", sale: 340, profit: 280 },
  { date: "2024-05-31", sale: 178, profit: 230 },
  { date: "2024-06-01", sale: 178, profit: 200 },
  { date: "2024-06-02", sale: 470, profit: 410 },
  { date: "2024-06-03", sale: 103, profit: 160 },
  { date: "2024-06-04", sale: 439, profit: 380 },
  { date: "2024-06-05", sale: 88, profit: 140 },
  { date: "2024-06-06", sale: 294, profit: 250 },
  { date: "2024-06-07", sale: 323, profit: 370 },
  { date: "2024-06-08", sale: 385, profit: 320 },
  { date: "2024-06-09", sale: 438, profit: 480 },
  { date: "2024-06-10", sale: 155, profit: 200 },
  { date: "2024-06-11", sale: 92, profit: 150 },
  { date: "2024-06-12", sale: 492, profit: 420 },
  { date: "2024-06-13", sale: 81, profit: 130 },
  { date: "2024-06-14", sale: 426, profit: 380 },
  { date: "2024-06-15", sale: 307, profit: 350 },
  { date: "2024-06-16", sale: 371, profit: 310 },
  { date: "2024-06-17", sale: 475, profit: 520 },
  { date: "2024-06-18", sale: 107, profit: 170 },
  { date: "2024-06-19", sale: 341, profit: 290 },
  { date: "2024-06-20", sale: 408, profit: 450 },
  { date: "2024-06-21", sale: 169, profit: 210 },
  { date: "2024-06-22", sale: 317, profit: 270 },
  { date: "2024-06-23", sale: 480, profit: 530 },
  { date: "2024-06-24", sale: 132, profit: 180 },
  { date: "2024-06-25", sale: 141, profit: 190 },
  { date: "2024-06-26", sale: 434, profit: 380 },
  { date: "2024-06-27", sale: 448, profit: 490 },
  { date: "2024-06-28", sale: 149, profit: 200 },
  { date: "2024-06-29", sale: 103, profit: 160 },
  { date: "2024-06-30", sale: 446, profit: 400 },
]

const chartConfig = {
  sales: {
    label: "Sales",
  },
  sale: {
    label: "Sale",
    color: "var(--primary)",
  },
  profit: {
    label: "Profit",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Sales</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSale" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sale)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sale)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="profit"
              type="natural"
              fill="url(#fillProfit)"
              stroke="var(--color-profit)"
              stackId="a"
            />
            <Area
              dataKey="sale"
              type="natural"
              fill="url(#fillSale)"
              stroke="var(--color-sale)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
