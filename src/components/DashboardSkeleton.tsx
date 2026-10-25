import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex h-80 flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-4 w-3/4 rounded-md bg-gray-200" />

        <div className="mt-4 h-8 w-12 rounded-md bg-gray-300" />

        <div className="mt-6 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-1/2 rounded-md bg-gray-200" />
              <div className="h-3 w-5/6 rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-80 flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-4 w-2/3 rounded-md bg-gray-200" />

        <div className="mt-4 h-8 w-12 rounded-md bg-gray-300" />

        <div className="mt-6 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-2/5 rounded-md bg-gray-200" />
              <div className="h-3 w-4/5 rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-80 flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-4 w-4/5 rounded-md bg-gray-200" />

        <div className="mt-6 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-1/3 rounded-md bg-gray-300" />
              <div className="h-8 w-full rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
