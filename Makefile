serve:
	cd webservice && yarn install && cd .. && \
	cd discordbot && yarn install && cd .. && \
	cd game && yarn install && cd .. && \
	COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -p d1337lands up --build --remove-orphans -d

migrate:
	cd database && hasura migrate apply --database-name default && hasura metadata apply && hasura seed apply --database-name default && cd ..

down:
	docker-compose down

remove_volume:
	docker volume ls | grep -q d1337lands_d1337db && docker volume rm d1337lands_d1337db