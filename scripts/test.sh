#!/bin/bash

# Fluent Bit Parser Tester - Test Runner Script
# This script runs all tests including unit tests, integration tests, and generates coverage reports

set -e  # Exit on any error

echo "🧪 Fluent Bit Parser Tester - Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Parse command line arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_COVERAGE=true
WATCH_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_INTEGRATION=false
            shift
            ;;
        --integration-only)
            RUN_UNIT=false
            shift
            ;;
        --no-coverage)
            RUN_COVERAGE=false
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --unit-only        Run only unit tests"
            echo "  --integration-only Run only integration tests"
            echo "  --no-coverage      Skip coverage report generation"
            echo "  --watch           Run tests in watch mode"
            echo "  --verbose         Enable verbose output"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if dependencies are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if [ "$WATCH_MODE" = true ]; then
        print_status "Starting unit tests in watch mode..."
        npm run test:watch
    elif [ "$RUN_COVERAGE" = true ]; then
        print_status "Running unit tests with coverage..."
        npm run test:coverage
    else
        npm run test
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Unit tests passed!"
    else
        print_error "Unit tests failed!"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Check if Playwright is installed
    if ! command -v npx playwright &> /dev/null; then
        print_warning "Playwright not found. Installing Playwright..."
        npx playwright install
    fi
    
    # Start the development server in the background
    print_status "Starting development server..."
    npm run dev &
    DEV_SERVER_PID=$!
    
    # Wait for the server to start
    print_status "Waiting for server to start..."
    sleep 10
    
    # Check if server is running
    if ! curl -s http://localhost:5177 > /dev/null; then
        print_error "Development server failed to start"
        kill $DEV_SERVER_PID 2>/dev/null || true
        return 1
    fi
    
    print_success "Development server started on http://localhost:5177"
    
    # Run Playwright tests
    if [ "$VERBOSE" = true ]; then
        npx playwright test --reporter=verbose
    else
        npx playwright test
    fi
    
    PLAYWRIGHT_EXIT_CODE=$?
    
    # Stop the development server
    print_status "Stopping development server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
    
    if [ $PLAYWRIGHT_EXIT_CODE -eq 0 ]; then
        print_success "Integration tests passed!"
    else
        print_error "Integration tests failed!"
        return 1
    fi
}

# Function to generate and display coverage report
show_coverage_report() {
    if [ "$RUN_COVERAGE" = true ] && [ -d "coverage" ]; then
        print_status "Coverage Report Summary:"
        echo "========================"
        
        # Try to show coverage summary
        if [ -f "coverage/coverage-summary.json" ]; then
            # If jq is available, parse JSON for better formatting
            if command -v jq &> /dev/null; then
                echo "Lines: $(cat coverage/coverage-summary.json | jq -r '.total.lines.pct')%"
                echo "Functions: $(cat coverage/coverage-summary.json | jq -r '.total.functions.pct')%"
                echo "Branches: $(cat coverage/coverage-summary.json | jq -r '.total.branches.pct')%"
                echo "Statements: $(cat coverage/coverage-summary.json | jq -r '.total.statements.pct')%"
            else
                print_status "Coverage summary available in coverage/coverage-summary.json"
            fi
        fi
        
        if [ -f "coverage/lcov-report/index.html" ]; then
            print_status "Detailed HTML coverage report: coverage/lcov-report/index.html"
        fi
    fi
}

# Function to run linting
run_linting() {
    print_status "Running linting checks..."
    
    # TypeScript type checking
    if command -v tsc &> /dev/null; then
        print_status "Running TypeScript type checking..."
        npx tsc --noEmit
        if [ $? -eq 0 ]; then
            print_success "TypeScript type checking passed!"
        else
            print_error "TypeScript type checking failed!"
            return 1
        fi
    fi
    
    # ESLint (if configured)
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        print_status "Running ESLint..."
        npx eslint src/
        if [ $? -eq 0 ]; then
            print_success "ESLint checks passed!"
        else
            print_error "ESLint checks failed!"
            return 1
        fi
    fi
}

# Main execution
main() {
    local exit_code=0
    
    print_status "Test configuration:"
    echo "  Unit tests: $RUN_UNIT"
    echo "  Integration tests: $RUN_INTEGRATION"
    echo "  Coverage: $RUN_COVERAGE"
    echo "  Watch mode: $WATCH_MODE"
    echo "  Verbose: $VERBOSE"
    echo ""
    
    # Run linting first
    if ! run_linting; then
        exit_code=1
    fi
    
    # Run unit tests
    if [ "$RUN_UNIT" = true ]; then
        if ! run_unit_tests; then
            exit_code=1
        fi
    fi
    
    # Run integration tests (only if not in watch mode)
    if [ "$RUN_INTEGRATION" = true ] && [ "$WATCH_MODE" = false ]; then
        if ! run_integration_tests; then
            exit_code=1
        fi
    fi
    
    # Show coverage report
    show_coverage_report
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "All tests completed successfully! 🎉"
    else
        print_error "Some tests failed. Please check the output above."
    fi
    
    return $exit_code
}

# Trap to ensure cleanup on script exit
cleanup() {
    print_status "Cleaning up..."
    # Kill any remaining background processes
    jobs -p | xargs -r kill 2>/dev/null || true
}

trap cleanup EXIT

# Run main function
main "$@"
exit $? 