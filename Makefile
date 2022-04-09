serve:
	docker-compose -p d1337lands_webservice up --build --remove-orphans -d

remove_volume:
	docker volume ls | grep -q d1337lands_d1337db && docker volume rm d1337lands_d1337db