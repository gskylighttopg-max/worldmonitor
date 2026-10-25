@echo off
REM git-push.bat - Safe push script for WorldMonitor (Windows)
REM Usage: .\scripts\git-push.bat "commit message" [branch-name]
REM Default branch: main

set MSG=%~1
set BRANCH=%~2

if "%MSG%"=="" set MSG=Update
if "%BRANCH%"=="" set BRANCH=main

echo 📝 Commit message: %MSG%
echo 🌿 Branch: %BRANCH%
echo.

REM Show status
git status --short

REM Confirm
set /p CONFIRM="Push these changes? (y/N) "
if /i not "%CONFIRM%"=="y" (
    echo Aborted.
    exit /b 1
)

REM Add, commit, push
git add -A
git commit -m "%MSG%"
git push origin %BRANCH%

echo.
echo ✅ Pushed to origin/%BRANCH%
echo 🔗 View: https://github.com/gskylighttopg-max/worldmonitor