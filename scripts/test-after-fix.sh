#!/bin/bash

echo "🧪 Testing personalization after fix"
echo "===================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ ERROR: Development server is NOT running"
    echo ""
    echo "Please restart the server:"
    echo "  1. Stop current server (Ctrl+C)"
    echo "  2. Run: pnpm dev"
    echo "  3. Wait for 'Ready' message"
    echo "  4. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo ""

echo "📡 Testing API with user 21179358, lesson 1..."
echo ""

# Make API call
response=$(curl -s -X POST http://localhost:3000/api/persona/block \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "21179358",
    "lesson": "1",
    "course": "taping-basics"
  }')

# Save for inspection
echo "$response" > /tmp/test_response.json

# Check response
if echo "$response" | grep -q '"ok":true'; then
    echo "✅ API call successful"
    echo ""
    
    # Check for default template (bad)
    if echo "$response" | grep -q "Базовая версия урока"; then
        echo "❌ STILL RETURNING DEFAULT TEMPLATE"
        echo ""
        echo "This means:"
        echo "  - Survey data still not loading, OR"
        echo "  - Server needs to be restarted, OR"
        echo "  - Profile not found"
        echo ""
        echo "Check server logs for:"
        echo "  [/api/persona/block] Profile lookup:"
        echo "  has_survey: true  <-- Should be true"
        echo ""
    # Check for personalized content (good)
    elif echo "$response" | grep -q "introduction"; then
        echo "🎉 SUCCESS! PERSONALIZED CONTENT GENERATED!"
        echo ""
        echo "The personalization is working!"
        echo "Check /tmp/test_response.json for full response"
        echo ""
    # Check for unavailable message (needs generation)
    elif echo "$response" | grep -q "недоступна"; then
        echo "⏳ Personalization not generated yet"
        echo ""
        echo "Try calling again - it may be generating now..."
        echo "Or check server logs for generation errors"
        echo ""
    else
        echo "⚠️  Unexpected response (check /tmp/test_response.json)"
        echo ""
    fi
else
    echo "❌ API call failed"
    echo ""
    echo "Response:"
    echo "$response" | head -10
    echo ""
fi

echo "📊 Response saved to: /tmp/test_response.json"
echo ""
echo "🔍 Server logs should show:"
echo "   [/api/persona/block] Profile lookup: { ..., has_survey: true }"
echo "   [/api/persona/block] Attempting to generate personalization..."
echo "   [/api/persona/block] Transcript found, generating with AI..."
echo "   [/api/persona/block] ✅ Personalization generated and saved"
echo ""
echo "Check your server terminal for these messages!"
