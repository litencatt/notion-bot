build:
	docker build -t notion-bot:latest .

build-debug:
	docker build -t notion-bot:latest -f Dockerfile.debug .

run:
	docker run --entrypoint=sh --env-file=.env -it notion-bot:latest
