# CONTRIBUTING

In order for you to contribute to the project by helping to develop this project is that you have to know how to run the project first, so here are the how-to's for that  

## How to run the project

first you need to install several things to tun the project:  
1. **Hasura CLI** (to manage the database, and run the hasura console if you want direct interaction with the graphql endpoint)  
2. **Yarn** (to install and build the webservice stuff) 
3. **Docker** Engine and Docker Compose (to run and containerize the project)  

And to run the project, all you need to type is  
```bash
make serve
```
in the root directory

To open up the hasura console, type
```bash
hasura console
```
in the database directory (and it will automatically open up the console in your default browser)

After successfully running the project, you will be able to access the frontend website of this project in http://localhost:5000

Oh, and one more thing, to create the database structure, run this comand  
```
make migrate
```
in the root directory

### Full command

So all in all what you need to run to get all the services running are:  
```bash
make serve && \
make migrate && \
cd database && hasura console
```

## Installing the dependency

To install Yarn, go to https://yarnpkg.com/getting-started/install  
To install Hasura CLI, go to https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli/  
To install docker engine and docker compose, go to https://docs.docker.com/engine/install/ and https://docs.docker.com/compose/install/

## How if i got an error

if you got an error in which the hasura container cant access the postgres container, or you cant even access the postgres container itself, then chances are you have changed the postgres container password in the docker-compose.yaml file, in that case go ahead and run  
```
make remove_volume
```
and then you can try to rebuild the project all over again by running  
```
make serve
```
