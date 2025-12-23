import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

# Import the specific Google GenAI classes
from google import genai
from google.genai import types

from .databaseConfig import get_db, ChatHistory

load_dotenv()

app = FastAPI(title="Gemini Backend")

# 1. Setup Gemini Client
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL_ID = "gemini-3-flash" 

# CORS Setup
origins = [
    "http://localhost:5173",
    "https://intelligent-workflow-2455nd.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.post("/search")
async def text_search(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        # 2. Fetch History (Optimized: Get last 20 messages to prevent token overflow)
        past_messages = db.query(ChatHistory).order_by(ChatHistory.id).all()
        
        # Format history for the SDK
        history_for_gemini = [
            types.Content(role=msg.role, parts=[types.Part.from_text(text=msg.content)])
            for msg in past_messages
        ]

        # 3. Start Chat Session
        chat_session = client.chats.create(model=MODEL_ID, history=history_for_gemini)

        # 4. Prepare Content (Text + Optional File)
        content_parts = [prompt]
        
        if file:
            file_bytes = await file.read()
            content_parts.append(
                types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=file.content_type
                )
            )

        # 5. Send Message
        response = chat_session.send_message(content_parts)

        # 6. Save to Database
        user_msg = ChatHistory(role="user", content=prompt)
        ai_msg = ChatHistory(role="model", content=response.text)
        
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()

        return {
            "query": prompt,
            "response": response.text,
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))