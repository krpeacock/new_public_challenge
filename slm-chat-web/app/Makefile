.PHONY: e2e start-dev stop-dev wait-dev build

PORT?=3010
BASE_URL?=http://localhost:$(PORT)

PID_FILE:=.devserver.pid

build:
	@echo "Building Next.js app..."
	@npm run build >/dev/null 2>&1 || (echo "Build failed"; exit 1)

start-dev:
	@echo "Starting server on port $(PORT) ..."
	@pids=$$(lsof -ti :$(PORT) || true); if [ -n "$$pids" ]; then echo "Killing existing process on $(PORT): $$pids"; kill $$pids || true; fi
	@nohup env PORT=$(PORT) npm run dev > .devserver.log 2>&1 & echo $$! > $(PID_FILE)
	@$(MAKE) wait-dev

wait-dev:
	@echo "Waiting for server at $(BASE_URL) ..."
	@for i in `seq 1 40`; do \
	  curl -sf $(BASE_URL)/ >/dev/null 2>&1 && echo "Server is up" && exit 0; \
	  sleep 0.5; \
	done; \
	echo "Server failed to start"; \
	(exit 1)

stop-dev:
	@if [ -f $(PID_FILE) ]; then \
	  kill `cat $(PID_FILE)` || true; \
	  rm -f $(PID_FILE); \
	  echo "Stopped dev server"; \
	fi

e2e: build start-dev
	@echo "Running Playwright e2e tests against $(BASE_URL)"
	@BASE_URL=$(BASE_URL) npm run test:e2e || (CODE=$$?; $(MAKE) stop-dev; exit $$CODE)
	@$(MAKE) stop-dev


