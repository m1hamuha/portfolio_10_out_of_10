#!/bin/bash

# Build Verification Test (BVT) Runner
# Runs the complete BVT suite locally

set -e  # Exit on error

echo "🚀 Starting Build Verification Test (BVT) Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker services are running
check_docker_services() {
    print_header "Checking Docker Services"
    
    local services=("postgres" "redis")
    local all_running=true
    
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            print_success "$service is running"
        else
            print_warning "$service is not running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = false ]; then
        print_warning "Some services are not running. Starting them..."
        docker-compose up -d postgres redis
        sleep 5  # Give services time to start
    fi
}

# Function to run infrastructure health checks
run_infrastructure_checks() {
    print_header "Running Infrastructure Health Checks"
    
    cd scripts/health-check || exit 1
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_warning "Installing health check dependencies..."
        npm init -y > /dev/null 2>&1
        npm install pg ioredis > /dev/null 2>&1
    fi
    
    # Run health checks
    echo "Running database health check..."
    if node check-database.js; then
        print_success "Database health check passed"
    else
        print_error "Database health check failed"
        return 1
    fi
    
    echo "Running Redis health check..."
    if node check-redis.js; then
        print_success "Redis health check passed"
    else
        print_error "Redis health check failed"
        return 1
    fi
    
    cd ../..
}

# Function to run backend smoke tests
run_backend_tests() {
    print_header "Running Backend Smoke Tests"
    
    cd backend || exit 1
    
    # Set environment variables
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USERNAME=postgres
    export DB_PASSWORD=postgres
    export DB_DATABASE=crm_erp_test
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export JWT_SECRET=test-secret-for-bvt
    export NODE_ENV=test
    
    # Run smoke tests
    echo "Running backend smoke tests..."
    if npm test -- test/smoke --passWithNoTests; then
        print_success "Backend smoke tests passed"
    else
        print_error "Backend smoke tests failed"
        return 1
    fi
    
    cd ..
}

# Function to run frontend smoke tests
run_frontend_tests() {
    print_header "Running Frontend Smoke Tests"
    
    cd frontend || exit 1
    
    # Set environment variables
    export NEXT_PUBLIC_API_URL=http://localhost:3000/api
    export NEXT_PUBLIC_APP_URL=http://localhost:3000
    
    # Run smoke tests
    echo "Running frontend smoke tests..."
    if npm test -- test/smoke --passWithNoTests; then
        print_success "Frontend smoke tests passed"
    else
        print_error "Frontend smoke tests failed"
        return 1
    fi
    
    cd ..
}

# Function to generate summary report
generate_summary() {
    print_header "BVT Summary Report"
    
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    echo "Build Verification Test Suite - Complete"
    echo "========================================"
    echo "Timestamp: $timestamp"
    echo ""
    
    if [ "$INFRASTRUCTURE_PASSED" = true ] && [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ]; then
        echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
        echo ""
        echo "The system is ready for deployment."
        echo "All critical functionality has been verified."
    else
        echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
        echo ""
        echo "Failed components:"
        [ "$INFRASTRUCTURE_PASSED" = false ] && echo "  - Infrastructure Health Checks"
        [ "$BACKEND_PASSED" = false ] && echo "  - Backend Smoke Tests"
        [ "$FRONTEND_PASSED" = false ] && echo "  - Frontend Smoke Tests"
        echo ""
        echo "Please review the errors above before proceeding with deployment."
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    # Check Docker services
    check_docker_services
    
    # Run infrastructure checks
    if run_infrastructure_checks; then
        INFRASTRUCTURE_PASSED=true
    else
        INFRASTRUCTURE_PASSED=false
    fi
    
    # Run backend tests
    if run_backend_tests; then
        BACKEND_PASSED=true
    else
        BACKEND_PASSED=false
    fi
    
    # Run frontend tests
    if run_frontend_tests; then
        FRONTEND_PASSED=true
    else
        FRONTEND_PASSED=false
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Generate summary
    generate_summary
    
    echo ""
    echo "Total execution time: ${duration} seconds"
    
    # Exit with appropriate code
    if [ "$INFRASTRUCTURE_PASSED" = true ] && [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script arguments
case "$1" in
    "--help" | "-h")
        echo "Build Verification Test (BVT) Runner"
        echo ""
        echo "Usage: ./run-bvt.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --infra-only   Run only infrastructure checks"
        echo "  --backend-only Run only backend smoke tests"
        echo "  --frontend-only Run only frontend smoke tests"
        echo ""
        echo "Without options, runs the complete BVT suite."
        exit 0
        ;;
    "--infra-only")
        check_docker_services
        run_infrastructure_checks
        exit $?
        ;;
    "--backend-only")
        check_docker_services
        run_backend_tests
        exit $?
        ;;
    "--frontend-only")
        run_frontend_tests
        exit $?
        ;;
    *)
        main
        ;;
esac