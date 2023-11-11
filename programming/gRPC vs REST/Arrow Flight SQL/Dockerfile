# Use official PostgreSQL image as the base
FROM postgres:15

# install apache arrow flight sql
RUN apt update
RUN apt install -y ca-certificates gpg lsb-release wget

RUN /bin/bash wget -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
  gpg --no-default-keyring --keyring /usr/share/keyrings/pgdg.gpg --import - \
   | tee /etc/apt/sources.list.d/pgdg.sources

RUN wget https://apache.jfrog.io/artifactory/arrow/$(lsb_release --id --short | tr 'A-Z' 'a-z')/apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb
RUN apt install -y -V ./apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb
RUN rm apache-arrow-apt-source-latest-$(lsb_release --codename --short).deb
RUN apt update

RUN apt install -y postgresql-15-pgdg-apache-arrow-flight-sql

# Copy SQL script files to a special directory that the PostgreSQL image will automatically run all *.sql scripts from
COPY dump.sql /docker-entrypoint-initdb.d/dump.sql
COPY conf.sql /docker-entrypoint-initdb.d/conf.sql

# Expose the default PostgreSQL port
EXPOSE 5432
EXPOSE 15432

# Start PostgreSQL
CMD ["postgres"]
