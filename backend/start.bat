@echo off
echo Smart Task Scheduler Backend Setup
echo ===================================
echo.

echo Setting up environment...
copy .env.example .env 2>nul
echo Environment file created (update .env with your settings)
echo.

echo Installing dependencies...
C:/Python313/python.exe -m pip install -r requirements.txt
echo.

echo Setting up database...
C:/Python313/python.exe setup_db.py
echo.

echo Starting development server...
C:/Python313/python.exe dev_server.py

pause
