generate stubs from .proto:
`python -m grpc_tools.protoc  -I. --python_out=. --grpc_python_out=. user.proto`

TO DO: fix cli command to not generate import error; for now, you need to fix import path in `user_pb2_grpc.py`