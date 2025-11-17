#!/bin/bash

SUPABASE_URL="https://qpnalviccuopdwfscoli.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwbmFsdmljY3VvcGR3ZnNjb2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDM0OTIsImV4cCI6MjA2MzUxOTQ5Mn0.AzkJBrRX0RcHfOC82msvg0af5i8riCJKlA_CgYOa31g"
EMAIL="test$(date +%s)@example.com"
PASSWORD="test1234"

echo "🔹 1. Signup nouvel utilisateur"
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$RESPONSE" | jq

USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.session.access_token')

echo "📌 User ID = $USER_ID"
echo "📌 Access Token = $ACCESS_TOKEN"

sleep 2

echo "🔹 2. Vérifier que le trigger a créé le profil"
curl -s "$SUPABASE_URL/rest/v1/profiles?id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo "🔹 3. Simuler Onboarding (UPDATE)"
curl -s -X PATCH "$SUPABASE_URL/rest/v1/profiles?id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "career_stage": "manager",
    "domain": "sales",
    "goal": "promotion",
    "onboarding_completed": true
  }' | jq

echo "🔹 4. Vérifier que le profil a bien été complété"
curl -s "$SUPABASE_URL/rest/v1/profiles?id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
