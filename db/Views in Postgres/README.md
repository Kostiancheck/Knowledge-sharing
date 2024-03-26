# Set-up working env

1. Run `docker compose up`
2. Open pgAdmin in http://localhost:5050/. Use creds from [docker-compose file](docker-compose.yml) to login
3. Connect to the Postgres and create database with the name `user`
4. Run [generator](./generate_data.py) to feel database with some data:
    1. it will create csv files under `users` folder and upload data from these files to postgres
    2. it will take ~30 mins
5. Query stuff and enjoy
