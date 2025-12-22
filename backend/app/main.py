import os
from dotenv import load_dotenv
from fastapi import Depends
from sqlalchemy.orm import Session
from databaseConfig import get_db, ChatHistory
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional


app = FastAPI(title="the first backend app")

load_dotenv()

Google_Api_Key = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=Google_Api_Key)
model = genai.GenerativeModel('gemini-3-flash-preview')

# store chat session history of every user in database




origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search")
async def text_Search(
    prompt: str = Form(...),
    file : Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        past_messages = db.query(ChatHistory).order_by(ChatHistory.id).all()

        history_for_gemini = [{"role":msg.role, "parts":[msg.content]} for msg in past_messages]
        chat_session = model.start_chat(history=history_for_gemini)
        

        content_List = [prompt]
        if file:
            file_bytes = await file.read()

            file_data = {
                'mime_type': file.content_type,
                'data': file_bytes
            }
            content_List.append(file_data)

        response = chat_session.send_message(content_List)

        user_msg = ChatHistory(role="user", content=prompt)
        ai_msg = ChatHistory(role="model", content=response.text)


        db.add(user_msg)
        db.add(ai_msg)
        db.commit()

        return {
            "query" : prompt,
            "response": response.text, 
        }
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {"error": "This AI is currently unavailable"}

