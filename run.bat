@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   PDF Editor server starting...
echo ========================================
echo.
echo Local access: http://localhost:17722
echo External access: http://[Your-IP]:17722
echo.
python -m http.server 17722 --bind 0.0.0.0
