#!/bin/bash

echo "🚀 Generating personalization for user 21179358, lesson 1"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Development server not running"
    echo "Please run: npm run dev"
    echo ""
    exit 1
fi

echo "📡 Calling /api/persona/block to trigger generation..."
echo ""

response=$(curl -s -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "21179358",
    "lesson": "1",
    "course": "taping-basics",
    "title": "Урок 1"
  }')

# Save response to file for inspection
echo "$response" > /tmp/personalization_response.json

echo "📊 Response saved to /tmp/personalization_response.json"
echo ""

# Check if successful
if echo "$response" | grep -q '"ok":true'; then
    echo "✅ API call successful"
    echo ""
    
    # Check for personalization indicators
    if echo "$response" | grep -q "introduction"; then
        echo "🎉 PERSONALIZATION GENERATED!"
        echo ""
        echo "Content sections found:"
        echo "$response" | grep -o '"[a-z_]*":' | head -10
    elif echo "$response" | grep -q "Базовая версия"; then
        echo "⚠️  Default version returned (personalization not generated)"
    elif echo "$response" | grep -q "персонализация недоступна"; then
        echo "⚠️  Personalization unavailable message"
    else
        echo "✅ Response received (check /tmp/personalization_response.json for details)"
    fi
else
    echo "❌ API call failed"
    echo ""
    echo "$response" | head -20
fi

echo ""
echo "🔍 Running diagnostic check..."
npx tsx scripts/check-user-21179358.ts
