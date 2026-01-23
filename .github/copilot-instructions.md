# Copilot / AI Agent Instructions (project-specific)

This file contains focused, actionable guidance for AI coding agents working on this repository.

Summary
- Purpose: A lightweight Hospital Patient Flow Simulator built with server-side PHP APIs and a client-side single-page UI in `main.php` + `station_room_management.js`.
- Runtime: Runs under Apache/PHP (XAMPP). DB: MySQL database `hospitalstation` (see API files for credentials).

Quick architecture notes
- Frontend: `main.php` is the single-page UI. Most UI logic lives in `station_room_management.js` which uses global functions like `openStationDetail(stationId)` and `openRoomDetail(roomId)`.
- Backend: Individual PHP endpoints in `api/` serve JSON. Convention: every endpoint returns `{ success: bool, data: ..., message: ... }` and sets JSON headers.
- DB: APIs use PDO to connect to MySQL. Many endpoints expect a local DB named `hospitalstation` with user `root` and empty password by default.

Key data flows (use these as entry points)
- Station detail: click UI -> `openStationDetail()` -> GET `api/get_station_detail.php?station_id=...` -> returns station, rooms, staff, doctors, procedures, patients.
- Room detail: `openRoomDetail()` -> GET `api/get_room_detail.php?room_id=...` -> returns `data.room`, `staff`, `equipment`, `procedures`, `patients`, and `staff_count`.
- Toggle equipment: client calls POST `api/manage_room_equipment.php` with JSON `{ action: 'toggle', equipment_id, is_active, room_id }`.
- Add/remove room staff: POST `api/manage_room_staff.php` with `{ action: 'add', room_id, staff_id, staff_name }` or `{ action: 'remove', room_staff_id }`.
- Update procedure times: POST `api/manage_procedure_times.php` with `{ action: 'update', room_procedure_id, wait_time, procedure_time }`.

Important conventions & patterns
- API shape: Always expect `success` boolean. Do not change the response format without updating all callers in `*.js`.
- JSON POST body: endpoints read raw JSON via `file_get_contents('php://input')` and decode. Use matching keys and `action` where required.
- Station types: `station_type`==`simple` vs `with_rooms`. `simple` stations store staff schedules JSON in `stations.staff_schedules_json`; `with_rooms` uses tables `station_rooms`, `room_staff`, `room_equipment`, `room_procedures`.
- UI coding style: client code is imperative, DOM-manipulation heavy, and uses global variables (e.g., `currentRoomId`, `currentStationId`). Keep patches minimal and avoid introducing complex frameworks.

Integration caveats
- External PDP DB: `api/get_station_detail.php` attempts to query an external PDP database at `172.25.72.230` for department names — treat this as optional and fail-safe (it falls back to a placeholder). Do not assume PDP is always available.
- Local DB defaults: API files use `127.0.0.1`, DB `hospitalstation`, user `root`, password `''`. Confirm local environment or extract credentials into a single config if you refactor.

Developer workflows (how to run / debug)
- Start XAMPP (Apache + MySQL) and ensure the project is under `htdocs` (already the case). Open `http://localhost/hospital/main.php`.
- Database: Import the `hospitalstation` schema if available (not included here). APIs will fail if tables are missing — check API error responses in browser devtools / PHP logs.
- Debugging APIs: APIs return JSON with `'message'` when `success:false`. Check Apache/PHP error log or enable `display_errors` briefly in the API files when debugging.

Examples (copy-pasteable)
- GET station detail (from browser/JS):
  - `/hospital/api/get_station_detail.php?station_id=12`
- Toggle equipment (JS POST payload):
  - POST `/hospital/api/manage_room_equipment.php` with JSON body:
    { "action": "toggle", "equipment_id": 55, "is_active": true, "room_id": 10 }
- Add staff to room (JS POST payload):
  - POST `/hospital/api/manage_room_staff.php` with JSON body:
    { "action": "add", "room_id": 10, "staff_id": 123, "staff_name": "Nurse A" }

Where to look first when changing behavior
- UI flows: `station_room_management.js` (client behavior and fetch calls).
- Server contract and validation: the corresponding `api/*.php` file (they implement the expected JSON payloads and return shape).
- Creation flows: `main.php`'s wizard calls `api/create_station.php` — check it when changing station creation behavior.

Style guidance for AI edits
- Make minimal, behavior-preserving changes. Update both the JS caller and PHP endpoint together when changing API shape.
- Preserve the `{ success, data, message }` response convention.
- Avoid introducing global refactors (e.g., moving to modules or frameworks) unless the user asks; prefer incremental changes.

If anything is unclear
- Tell me which endpoint, UI action, or DB table you want clarity on and I will extract the exact request/response shape and example payloads.

— End of instructions —
