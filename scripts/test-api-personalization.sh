#!/bin/bash

echo "🧪 Testing personalization for user 21179358, lesson 1"
echo ""

# Start server in background if not running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Development server not running"
    echo "Please run: npm run dev"
    echo ""
    exit 1
fi

echo "📡 Calling API..."
echo ""

response=$(curl -s -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "21179358",
    "lesson": "1",
    "course": "taping-basics",
    "title": "Урок 1"
  }')

echo "$response" | python3 -m json.tool

echo ""
echo "📊 Analysis:"
echo ""

# Check if response contains personalized content
if echo "$response" | grep -q '"ok": *true'; then
    echo "✅ API call successful"
    
    if echo "$response" | grep -q 'persona-section'; then
        echo "✅ Contains personalized sections"
    else
        echo "⚠️  Response OK but may be default content"
    fi
    
    if echo "$response" | grep -q 'Алексей'; then
        echo "✅ Personalized for Алексей"
    else
        echo "❌ Not personalized (name not found)"
    fi
    
    if echo "$response" | grep -q 'Базовая версия'; then
        echo "⚠️  Default version returned"
    else
        echo "✅ Not default version"
    fi
else
    echo "❌ API call failed"
fi

echo ""
echo "✅ Test complete"
