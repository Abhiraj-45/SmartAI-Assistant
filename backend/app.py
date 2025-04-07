from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# API keys from environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
weather_api_key = os.getenv("WEATHER_API_KEY")
news_api_key = os.getenv("NEWS_API_KEY")

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    user_message = data.get("message", "").strip().lower()

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    # Handle weather queries
    if "weather" in user_message:
        city = "Delhi"  # Default city
        for word in user_message.split():
            if word.istitle():
                city = word
                break

        weather_url = f"http://api.weatherapi.com/v1/current.json?key={weather_api_key}&q={city}"
        try:
            response = requests.get(weather_url)
            weather_data = response.json()

            condition = weather_data['current']['condition']['text']
            temp_c = weather_data['current']['temp_c']
            return jsonify({
                "reply": f"The weather in {city} is {condition} with {temp_c}°C."
            })
        except:
            return jsonify({"reply": "Couldn't fetch the weather right now."}), 500

    # Handle joke request
    elif "joke" in user_message:
        try:
            joke_res = requests.get("https://official-joke-api.appspot.com/random_joke")
            joke_data = joke_res.json()
            return jsonify({"reply": f"{joke_data['setup']} - {joke_data['punchline']}"})
        except:
            return jsonify({"reply": "Sorry, I couldn't fetch a joke right now."})

    # Handle news request
    elif "news" in user_message:
        try:
            news_url = f"https://newsapi.org/v2/top-headlines?country=in&apiKey={news_api_key}"
            news_res = requests.get(news_url)
            news_data = news_res.json()
            articles = news_data.get("articles", [])[:3]
            headlines = "\n".join([f"- {article['title']}" for article in articles])
            return jsonify({"reply": f"Top headlines:\n{headlines}"})
        except:
            return jsonify({"reply": "Sorry, I couldn't fetch the news right now."})

    # Handle translation to Hindi
    elif "translate" in user_message:
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Translate the following text to Hindi."},
                    {"role": "user", "content": user_message}
                ]
            )
            reply = response.choices[0].message["content"].strip()
            return jsonify({"reply": reply})
        except:
            return jsonify({"reply": "Translation failed."})

    # Default OpenAI GPT response
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a smart assistant. Answer clearly and briefly."},
                {"role": "user", "content": user_message}
            ]
        )
        reply = response.choices[0].message["content"].strip()
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)