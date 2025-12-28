"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BurndownDataPoint } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { TrendingDown, Calendar } from "lucide-react";

interface BurndownChartProps {
  data: BurndownDataPoint[];
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: BurndownDataPoint }>;
  label?: string;
}) {

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900 mb-2">
          {label ? formatDate(label) : ""}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-600">Incomplete Tasks:</span>
            <span className="font-medium ml-1">{data.incompleteTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-600">Completed:</span>
            <span className="font-medium ml-1">+{data.completedTasks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-orange-600">Created:</span>
            <span className="font-medium ml-1">+{data.createdTasks}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function BurndownChart({ data }: BurndownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Task Burndown Chart
            </h3>
            <p className="text-sm text-gray-600">
              Track your task completion progress over time
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">
            No task data available for the past month
          </p>
        </div>
      </Card>
    );
  }

  // Calculate some stats for display
  const totalCreated = data.reduce((sum, point) => sum + point.createdTasks, 0);
  const totalCompleted = data.reduce(
    (sum, point) => sum + point.completedTasks,
    0,
  );
  const currentIncomplete = data[data.length - 1]?.incompleteTasks || 0;
  const startIncomplete = data[0]?.incompleteTasks || 0;
  const trend = startIncomplete - currentIncomplete;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Task Burndown Chart
            </h3>
            <p className="text-sm text-gray-600">
              Past 30 days (excluding habits)
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {currentIncomplete}
          </div>
          <div className="text-sm text-gray-600">incomplete tasks</div>
          {trend > 0 && (
            <div className="text-xs text-green-600 mt-1">
              ↓ {trend} this month
            </div>
          )}
          {trend < 0 && (
            <div className="text-xs text-red-600 mt-1">
              ↑ {Math.abs(trend)} this month
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: "Incomplete Tasks",
                angle: -90,
                position: "insideBottomLeft",
              }}
              allowDecimals={false}
              domain={[5, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="linear"
              dataKey="incompleteTasks"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: "#2563eb" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Additional stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {totalCompleted}
            </div>
            <div className="text-sm text-gray-600">completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">
              {totalCreated}
            </div>
            <div className="text-sm text-gray-600">created</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {totalCompleted > 0
                ? Math.round((totalCompleted / totalCreated) * 100)
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">completion rate</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
