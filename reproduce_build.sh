#!/bin/bash
cd frontend

# Build with dummy args to simulate Railway build
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-key" \
  --build-arg NEXT_PUBLIC_API_URL="http://localhost:3001" \
  --build-arg NEXT_PUBLIC_WS_URL="ws://localhost:3001" \
  -t beton-frontend-test .
