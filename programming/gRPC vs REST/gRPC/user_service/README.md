User service

generate from .proto:
`python -m grpc_tools.protoc  -I. --pyi_out=. --python_out=. --grpc_python_out=. ./stubs/user.proto`
