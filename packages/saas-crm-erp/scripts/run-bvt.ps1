# Build Verification Test (BVT) Runner for Windows
# Runs the complete BVT suite locally

param(
    [string]$Mode = "all"
)

Write-Host "🚀 Starting Build Verification Test (BVT) Suite" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Function to print section headers
function Write-Section {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Blue
}

# Function to print success
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# Function to print warning
function Write-WarningMsg {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Function to print error
function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Function to check if Docker services are running
function Test-DockerServices {
    Write-Section "Checking Docker Services"
    
    $services = @("postgres", "redis")
    $allRunning = $true
    
    foreach ($service in $services) {
        $status = docker-compose ps | Select-String "$service.*Up"
        if ($status) {
            Write-Success "$service is running"
        } else {
            Write-WarningMsg "$service is not running"
            $allRunning = $false
        }
    }
    
    if (-not $allRunning) {
        Write-WarningMsg "Some services are not running. Starting them..."
        docker-compose up -d postgres redis
        Start-Sleep -Seconds 5  # Give services time to start
    }
}

# Function to run infrastructure health checks
function Test-Infrastructure {
    Write-Section "Running Infrastructure Health Checks"
    
    Set-Location scripts/health-check
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-WarningMsg "Installing health check dependencies..."
        npm init -y > $null 2>&1
        npm install pg ioredis > $null 2>&1
    }
    
    # Run health checks
    Write-Host "Running database health check..."
    $dbResult = node check-database.js
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database health check passed"
    } else {
        Write-ErrorMsg "Database health check failed"
        return $false
    }
    
    Write-Host "Running Redis health check..."
    $redisResult = node check-redis.js
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Redis health check passed"
    } else {
        Write-ErrorMsg "Redis health check failed"
        return $false
    }
    
    Set-Location ../..
    return $true
}

# Function to run backend smoke tests
function Test-Backend {
    Write-Section "Running Backend Smoke Tests"
    
    Set-Location backend
    
    # Set environment variables
    $env:DB_HOST = "localhost"
    $env:DB_PORT = "5432"
    $env:DB_USERNAME = "postgres"
    $env:DB_PASSWORD = "postgres"
    $env:DB_DATABASE = "crm_erp_test"
    $env:REDIS_HOST = "localhost"
    $env:REDIS_PORT = "6379"
    $env:JWT_SECRET = "test-secret-for-bvt"
    $env:NODE_ENV = "test"
    
    # Run smoke tests
    Write-Host "Running backend smoke tests..."
    $testResult = npm test -- test/smoke --passWithNoTests
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend smoke tests passed"
        Set-Location ..
        return $true
    } else {
        Write-ErrorMsg "Backend smoke tests failed"
        Set-Location ..
        return $false
    }
}

# Function to run frontend smoke tests
function Test-Frontend {
    Write-Section "Running Frontend Smoke Tests"
    
    Set-Location frontend
    
    # Set environment variables
    $env:NEXT_PUBLIC_API_URL = "http://localhost:3000/api"
    $env:NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    
    # Run smoke tests
    Write-Host "Running frontend smoke tests..."
    $testResult = npm test -- test/smoke --passWithNoTests
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend smoke tests passed"
        Set-Location ..
        return $true
    } else {
        Write-ErrorMsg "Frontend smoke tests failed"
        Set-Location ..
        return $false
    }
}

# Function to generate summary report
function Write-Summary {
    param(
        [bool]$InfrastructurePassed,
        [bool]$BackendPassed,
        [bool]$FrontendPassed,
        [int]$Duration
    )
    
    Write-Section "BVT Summary Report"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"
    
    Write-Host "Build Verification Test Suite - Complete"
    Write-Host "========================================"
    Write-Host "Timestamp: $timestamp"
    Write-Host ""
    
    if ($InfrastructurePassed -and $BackendPassed -and $FrontendPassed) {
        Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green
        Write-Host ""
        Write-Host "The system is ready for deployment."
        Write-Host "All critical functionality has been verified."
    } else {
        Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red
        Write-Host ""
        Write-Host "Failed components:"
        if (-not $InfrastructurePassed) { Write-Host "  - Infrastructure Health Checks" }
        if (-not $BackendPassed) { Write-Host "  - Backend Smoke Tests" }
        if (-not $FrontendPassed) { Write-Host "  - Frontend Smoke Tests" }
        Write-Host ""
        Write-Host "Please review the errors above before proceeding with deployment."
    }
    
    Write-Host ""
    Write-Host "Total execution time: ${Duration} seconds"
}

# Main execution
function Start-BVT {
    $startTime = Get-Date
    
    # Check Docker services
    Test-DockerServices
    
    # Initialize result variables
    $infrastructurePassed = $false
    $backendPassed = $false
    $frontendPassed = $false
    
    # Run tests based on mode
    switch ($Mode.ToLower()) {
        "infra" {
            $infrastructurePassed = Test-Infrastructure
        }
        "backend" {
            $backendPassed = Test-Backend
        }
        "frontend" {
            $frontendPassed = Test-Frontend
        }
        "all" {
            $infrastructurePassed = Test-Infrastructure
            $backendPassed = Test-Backend
            $frontendPassed = Test-Frontend
        }
        default {
            Write-ErrorMsg "Invalid mode: $Mode. Use 'all', 'infra', 'backend', or 'frontend'."
            exit 1
        }
    }
    
    $endTime = Get-Date
    $duration = [math]::Round(($endTime - $startTime).TotalSeconds)
    
    # Generate summary
    Write-Summary -InfrastructurePassed $infrastructurePassed `
                  -BackendPassed $backendPassed `
                  -FrontendPassed $frontendPassed `
                  -Duration $duration
    
    # Exit with appropriate code
    if ($infrastructurePassed -and $backendPassed -and $frontendPassed) {
        exit 0
    } else {
        exit 1
    }
}

# Show help if requested
if ($args -contains "--help" -or $args -contains "-h") {
    Write-Host "Build Verification Test (BVT) Runner for Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\run-bvt.ps1 [MODE]" 
    Write-Host ""
    Write-Host "Modes:"
    Write-Host "  all        Run complete BVT suite (default)"
    Write-Host "  infra      Run only infrastructure checks"
    Write-Host "  backend    Run only backend smoke tests"
    Write-Host "  frontend   Run only frontend smoke tests"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run-bvt.ps1"
    Write-Host "  .\run-bvt.ps1 infra"
    Write-Host "  .\run-bvt.ps1 backend"
    exit 0
}

# Check if mode parameter was provided
if ($args.Count -gt 0 -and $args[0] -notin @("--help", "-h")) {
    $Mode = $args[0]
}

# Run BVT
Start-BVT