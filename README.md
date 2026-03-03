# Metodog

Backend Node + Docker para Metodog.

## Ejecutar
docker compose up -d --build

## Puertos
Frontend: http://localhost:3001
Backend:  http://localhost:4000
Postgres: localhost:5432

## Comandos útiles
docker compose ps
docker compose logs -f backend
docker exec -it metodog-backend-1 sh
docker compose down

## Probar endpoints desde PowerShell
Invoke-RestMethod http://localhost:4000/ | Out-String
Invoke-RestMethod http://localhost:4000/health | Out-String
curl.exe -sS http://localhost:4000/health

## Flujo Git recomendado
git checkout -b docs/add-readme
git add README.md
git commit -m "docs: add README"
git push --set-upstream origin docs/add-readme

## Notas
Añadir un archivo .env.example con las variables necesarias (DB_HOST, DB_USER, DB_PASS, PORT).
