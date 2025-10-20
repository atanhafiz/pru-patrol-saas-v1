// This router is now disabled - all routes moved to main router
// Sandbox mode functionality has been consolidated into main application
export default function RouterV11() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Sandbox Mode Disabled
        </h1>
        <p className="text-gray-600">
          All v1.1 components have been moved to the main application.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please use the main application instead.
        </p>
      </div>
    </div>
  );
}
