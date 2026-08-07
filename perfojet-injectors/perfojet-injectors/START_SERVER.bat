@echo off
cd /d "%~dp0"
echo Starting local server for Perfojet Injector System KB...
echo.
echo Once it starts, open this in your browser:
echo    http://localhost:8000
echo.
echo Press CTRL+C in this window to stop the server when done.
echo.
python -m http.server 8000
pause
