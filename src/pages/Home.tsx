import { Link } from 'react-router-dom';
import { PlayIcon, CodeBracketIcon, ClockIcon, ShieldCheckIcon, CpuChipIcon, BeakerIcon } from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Fluent Bit Parser Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Test, validate, and build Fluent Bit regex parsers with confidence. 
            Our interactive tool uses the Onigmo regex library to provide real-time feedback 
            and help you create robust log parsing solutions.
          </p>
          <Link 
            to="/parser-tester"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <PlayIcon className="h-6 w-6 mr-3" />
            Start Testing Parsers
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Parser Tester Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BeakerIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Parser Tester</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Interactive testing environment for Fluent Bit regex parsers with real-time validation and feedback.
            </p>
            <Link 
              to="/parser-tester"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Now
              <PlayIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>

          {/* Real-time Validation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Real-time Validation</h3>
            </div>
            <p className="text-gray-600">
              Get instant feedback on your regex patterns with comprehensive error handling and validation.
            </p>
          </div>

          {/* Time Format Support */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Time Parsing</h3>
            </div>
            <p className="text-gray-600">
              Support for various timestamp formats with optional time format parsing and validation.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Built for Fluent Bit Engineers</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <CpuChipIcon className="h-5 w-5 mr-2 text-blue-600" />
                Onigmo Regex Engine
              </h3>
              <p className="text-gray-600 mb-4">
                Uses the same Onigmo regex library that powers Fluent Bit, ensuring your patterns work exactly as expected in production.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Named capture groups support</li>
                <li>• Unicode and multibyte character support</li>
                <li>• POSIX character classes</li>
                <li>• Lookahead and lookbehind assertions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <CodeBracketIcon className="h-5 w-5 mr-2 text-green-600" />
                Parser Development
              </h3>
              <p className="text-gray-600 mb-4">
                Streamlined workflow for developing and testing Fluent Bit parsers with immediate visual feedback.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Quick example templates</li>
                <li>• Field extraction visualization</li>
                <li>• Error highlighting and suggestions</li>
                <li>• Copy-paste friendly interface</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Common Log Formats</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Apache Access Logs</h3>
              <p className="text-blue-700 text-sm">
                Parse standard Apache/Nginx access logs with IP, timestamp, method, path, and response codes.
              </p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Application Logs</h3>
              <p className="text-green-700 text-sm">
                Extract structured data from application logs including levels, messages, and metadata.
              </p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">System Logs</h3>
              <p className="text-purple-700 text-sm">
                Parse system logs, syslog formats, and custom application logging patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Framework Info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Built with Modern Technologies</h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-200">React + TypeScript</span>
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-200">Redux Toolkit</span>
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-200">Tailwind CSS</span>
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-200">Vite</span>
            <span className="px-4 py-2 bg-white rounded-lg border border-gray-200">Vitest + Playwright</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 