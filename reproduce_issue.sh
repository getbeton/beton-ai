#!/bin/bash
# Try to build from root using frontend/Dockerfile
# This mimics what Railway seems to be doing based on the logs
docker build -f frontend/Dockerfile .
