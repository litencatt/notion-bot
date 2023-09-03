build:
	docker build -t notion-bot:latest .

build-debug:
	docker build -t notion-bot:latest-debug -f Dockerfile.debug .

run:
	docker run --entrypoint=sh --env-file=.env -it notion-bot:latest-debug

# For minikube
apply:
	kubectl apply -f manifests

install-sealed-secrets:
	helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
	helm install --namespace kube-system notion-bot sealed-secrets/sealed-secrets

secret-init:
	kubectl create secret generic notion-bot --dry-run=client --from-env-file=.env -o yaml > manifests/secrets/non-encrypted-secrets.yml

secret-update:
	cat manifests/secrets/non-encrypted-secrets.yml | kubeseal --controller-name=notion-bot-sealed-secrets --controller-namespace=kube-system --format yaml > manifests/secrets/secrets.yaml
	kubectl replace -f manifests/secrets/secrets.yaml
