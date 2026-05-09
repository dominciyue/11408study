@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script, Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

pushd "%~dp0"
set "BASEDIR=%CD%"

set MAVEN_WRAPPER_DIR=%~dp0\.mvn\wrapper
set MAVEN_WRAPPER_JAR=%MAVEN_WRAPPER_DIR%\maven-wrapper.jar
set MAVEN_WRAPPER_PROPERTIES=%MAVEN_WRAPPER_DIR%\maven-wrapper.properties

if not exist "%MAVEN_WRAPPER_JAR%" (
  echo Maven Wrapper jar not found: %MAVEN_WRAPPER_JAR%
  echo Please download it first (see docs).
  exit /b 1
)

if not exist "%MAVEN_WRAPPER_PROPERTIES%" (
  echo Maven Wrapper properties not found: %MAVEN_WRAPPER_PROPERTIES%
  exit /b 1
)

set JAVA_EXE=java.exe

"%JAVA_EXE%" "-Dmaven.multiModuleProjectDirectory=%BASEDIR%" -classpath "%MAVEN_WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
set EXIT_CODE=%ERRORLEVEL%
popd
exit /b %EXIT_CODE%

