FROM rust:1.70.0

WORKDIR /server
COPY . .
RUN cargo install --path .
CMD ["cargo", "run"]