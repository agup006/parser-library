import { CodeBracketIcon, CpuChipIcon, BeakerIcon, ShieldCheckIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Parser Library</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive tool for testing and validating Fluent Bit regex parsers, 
            built to streamline log parsing development and ensure production reliability.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            We believe that log parsing shouldn't be a guessing game. Our tool provides Fluent Bit users 
            and engineers with a reliable, interactive environment to develop, test, and validate regex 
            parsers before deploying them to production systems.
          </p>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Onigmo Regex Engine</h3>
              </div>
              <p className="text-gray-600">
                Uses the same Onigmo regex library that powers Fluent Bit, ensuring 100% compatibility 
                between your tests and production deployments.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Real-time Validation</h3>
              </div>
              <p className="text-gray-600">
                Get instant feedback on your regex patterns with comprehensive error handling, 
                syntax validation, and field extraction preview.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Time Format Support</h3>
              </div>
              <p className="text-gray-600">
                Test timestamp parsing with various time formats using strptime syntax, 
                ensuring your time fields are correctly extracted and formatted.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Interactive Testing</h3>
              </div>
              <p className="text-gray-600">
                Test your parsers with real log data, see extracted fields in a clean table format, 
                and iterate quickly with example templates.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Technical Foundation</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <CodeBracketIcon className="h-5 w-5 mr-2 text-blue-600" />
                Frontend Technologies
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  React 18 with TypeScript for type-safe development
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Redux Toolkit for efficient state management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Tailwind CSS for modern, responsive design
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Vite for fast development and optimized builds
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2 text-green-600" />
                API & Testing
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Calyptia Core API for parser validation
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Vitest for comprehensive unit testing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Playwright for end-to-end testing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  React Testing Library for component testing
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-4 inline-block">
                <CodeBracketIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">DevOps Engineers</h3>
              <p className="text-gray-600 text-sm">
                Quickly validate log parsing configurations before deploying to production environments.
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-green-50 rounded-lg mb-4 inline-block">
                <BeakerIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Platform Engineers</h3>
              <p className="text-gray-600 text-sm">
                Build and test complex regex patterns for diverse log formats across multiple services.
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-purple-50 rounded-lg mb-4 inline-block">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Site Reliability Engineers</h3>
              <p className="text-gray-600 text-sm">
                Ensure log parsing reliability and troubleshoot parsing issues in observability pipelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 