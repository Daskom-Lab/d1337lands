serve:
	cd webservice && yarn install && cd .. && \
	cd discordbot && yarn install && cd .. && \
	cd game && yarn install && cd .. && \
	cp .env discordbot && cp .env webservice && cp .env websocket && \
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -p d1337lands up --build --remove-orphans -d

migrate:
	cd database && \
	hasura migrate apply --skip-update-check --database-name default --envfile ../.env && \
	hasura seed apply --skip-update-check --database-name default --envfile ../.env && \
	hasura metadata apply --skip-update-check --envfile ../.env && cd ..

db_console:
	cd database && hasura console --skip-update-check --envfile ../.env

down:
	docker-compose down

remove_volume:
	docker volume ls | grep -q d1337lands_d1337db && docker volume rm d1337lands_d1337db
