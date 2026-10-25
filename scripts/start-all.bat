@echo off
REM start-all.bat - Start all WorldMonitor services (Windows)
REM Usage: .\scripts\start-all.bat

title WorldMonitor Collaborative Dev Startup

echo ╔══════════════════════════════════════════════════════════════╗
echo ║           WorldMonitor Collaborative Dev Startup             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check prerequisites
where node >nul 2>nul || (echo [ERROR] node not found & exit /b 1)
where pnpm >nul 2>nul || (echo [ERROR] pnpm not found & exit /b 1)
where ruflo >nul 2>nul || (echo [ERROR] ruflo not found & exit /b 1)
where cloudflared >nul 2>nul || (echo [ERROR] cloudflared not found & exit /b 1)

echo [OK] All prerequisites found
echo.

REM Load .env if exists
if exist .env (
    echo Loading .env...
    for /f "usebackq delims=" %%a in (".env") do set "%%a"
)

REM 1. Start Ruflo Daemon
echo 1/5 Starting Ruflo daemon...
ruflo daemon start
timeout /t 2 /nobreak >nul

REM 2. Initialize/Verify Swarm
echo 2/5 Initializing swarm...
ruflo swarm status >nul 2>&1
if errorlevel 1 (
    ruflo swarm init --topology hierarchical --max-agents 8
) else (
    echo Swarm already running
)

REM 3. Start Website Dev Server (background)
echo 3/5 Starting website dev server (port 3000)...
if exist package.json (
    findstr /c:"dev" package.json >nul
    if not errorlevel 1 (
        start "WorldMonitor Website" cmd /k "pnpm run dev"
    ) else (
        echo [WARN] No dev script in package.json
    )
) else (
    echo [WARN] No package.json found
)

REM 4. Start MCP HTTP Wrapper (background)
echo 4/5 Starting MCP HTTP wrapper (port 3001)...
cd scripts
start "WorldMonitor MCP Wrapper" cmd /k "npm start"
cd ..

REM Wait for services
echo Waiting for services...
timeout /t 3 /nobreak >nul

REM 5. Start Cloudflare Tunnel
echo 5/5 Starting Cloudflare tunnel...
if exist "%USERPROFILE%\.cloudflared\config.yml" (
    echo Starting tunnel (will run in foreground)...
    echo.
    echo Tunnel URLs:
    echo   Website: https://app.worldmonitor.dev
    echo   MCP:     https://mcp.worldmonitor.dev
    echo.
    echo Press Ctrl+C to stop all services
    echo.
    
    cloudflared tunnel run worldmonitor-dev
) else (
    echo [ERROR] Cloudflare config not found at %USERPROFILE%\.cloudflared\config.yml
    echo Run: cloudflared tunnel login ^&^& cloudflared tunnel create worldmonitor-dev
    echo Then edit %USERPROFILE%\.cloudflared\config.yml
    echo.
    echo Press any key to exit...
    pause >nul
)