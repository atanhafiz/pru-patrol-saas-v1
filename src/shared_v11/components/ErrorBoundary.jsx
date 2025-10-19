import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error Boundary component for v1.1
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </motion.div>

            <div className="space-y-3">
              <motion.button
                onClick={this.handleRetry}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>

              <motion.button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="w-4 h-4" />
                Go to Home
              </motion.button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <motion.details
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 font-mono overflow-auto max-h-32">
                  <div className="font-semibold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.toString()}</div>
                  <div className="font-semibold mb-1">Stack Trace:</div>
                  <div>{this.state.errorInfo.componentStack}</div>
                </div>
              </motion.details>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback for smaller components
 */
export function ErrorFallback({ error, resetError }) {
  return (
    <motion.div
      className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
      <p className="text-red-700 text-sm mb-3">
        Something went wrong with this component
      </p>
      <button
        onClick={resetError}
        className="text-red-600 hover:text-red-800 text-sm font-medium underline"
      >
        Try again
      </button>
    </motion.div>
  );
}

/**
 * Hook for error boundary functionality
 */
export function useErrorHandler() {
  return (error, errorInfo) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);
    // You can add additional error reporting here
  };
}

export default ErrorBoundary;
