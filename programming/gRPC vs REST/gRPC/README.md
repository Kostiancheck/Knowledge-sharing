gRPC implementation of Auth + User microservices
https://github.com/jeffhollan/grpc-sample-python/blob/main/protos/greet_pb2_grpc.py

Generate users microservice with grpc tools based on .proto files:
`python -m grpc_tools.protoc  -I. --pyi_out=. --python_out=. --grpc_python_out=. ./protobufs/users/users.proto`